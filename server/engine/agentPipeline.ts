import { addAudit, getDecision, getEvent, getPortfolioSummary, getPositions, getRiskForDecision, getTradeForDecision, saveDecision, saveEventAudit, saveMarketSnapshot, saveRisk, hasRecentOrder } from '../db/repositories.js';
import { analyzeDecision } from '../agents/decisionAgent.js';
import { getMarketSnapshot } from './marketData.js';
import { evaluateRisk } from './riskEngine.js';
import { executePaperOrder } from './paperTrading.js';
import type { AgentDecision, AgentStatus, MarketEvent, RiskCheck, Trade } from '../types.js';

export const agentStatus: AgentStatus = { active: true, mode: 'DEMO', stage: 'IDLE', updatedAt: new Date().toISOString() };

export interface PipelineResult { event: MarketEvent; decision: AgentDecision; risk: RiskCheck; trade?: Trade; provider: string; }

export async function runEventPipeline(event: MarketEvent, options: { execute?: boolean } = {}): Promise<PipelineResult> {
  const shouldExecute = options.execute ?? true;
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  agentStatus.stage = 'EVENT_DETECTED'; agentStatus.lastEventId = event.id; agentStatus.updatedAt = new Date().toISOString();
  saveEventAudit(event, runId);
  const symbol = event.affectedSymbols[0];
  const market = getMarketSnapshot(symbol);
  saveMarketSnapshot(market);
  agentStatus.stage = 'CONTEXT_ANALYSIS'; agentStatus.updatedAt = new Date().toISOString();
  addAudit({ id: `audit-${runId}-context`, eventId: event.id, stage: 'CONTEXT_ANALYSIS', title: 'Market context assembled', detail: `${symbol} ${market.trend} · RSI ${market.rsi} · volatility ${market.volatility}%`, status: 'INFO', metadata: market, timestamp: new Date().toISOString() });
  const portfolio = getPortfolioSummary();
  const positions = getPositions();
  const { decision, provider } = await analyzeDecision({ event, symbol, market, portfolioExposure: portfolio.exposurePct, existingPositions: Object.fromEntries(positions.map((position) => [position.symbol, position])) });
  decision.id = `dec-${Date.now()}`;
  agentStatus.stage = 'AI_DECISION'; agentStatus.lastDecision = decision; agentStatus.updatedAt = new Date().toISOString();
  saveDecision(decision);
  addAudit({ id: `audit-${runId}-decision`, eventId: event.id, stage: 'AI_DECISION', title: `${decision.action} proposed for ${symbol}`, detail: `${(decision.confidence * 100).toFixed(0)}% confidence · ${decision.thesis}`, status: 'INFO', metadata: { decision, provider }, timestamp: new Date().toISOString() });
  const risk = evaluateRisk(decision, portfolio, hasRecentOrder(event.id, symbol), Boolean(positions.find((position) => position.symbol === symbol && position.quantity > 0)));
  agentStatus.stage = 'RISK_CHECK'; agentStatus.lastRisk = risk; agentStatus.updatedAt = new Date().toISOString();
  saveRisk(`risk-${decision.id}`, decision.id, risk);
  addAudit({ id: `audit-${runId}-risk`, eventId: event.id, stage: 'RISK_CHECK', title: risk.status === 'PASS' ? 'Risk check passed' : 'Risk check rejected', detail: risk.status === 'PASS' ? `Risk score ${risk.riskScore}/100 · independent controls cleared the proposal.` : risk.reasons.join(' '), status: risk.status === 'PASS' ? 'PASS' : 'REJECTED', metadata: risk, timestamp: new Date().toISOString() });
  let trade: Trade | undefined;
  agentStatus.stage = 'EXECUTION'; agentStatus.updatedAt = new Date().toISOString();
  if (shouldExecute) {
    trade = executePaperOrder(decision, risk);
    if (trade) addAudit({ id: `audit-${runId}-execution`, eventId: event.id, stage: 'EXECUTION', title: trade.status === 'FILLED' ? 'Paper order filled' : 'Paper order rejected', detail: `${trade.side} ${trade.quantity} ${trade.symbol} at $${trade.price.toFixed(2)} · ${trade.status}`, status: trade.status === 'FILLED' ? 'PASS' : 'REJECTED', metadata: trade, timestamp: new Date().toISOString() });
    else addAudit({ id: `audit-${runId}-hold`, eventId: event.id, stage: 'EXECUTION', title: 'No order placed', detail: decision.action === 'HOLD' ? 'AI selected HOLD; no paper order was sent.' : 'Risk controls prevented execution.', status: decision.action === 'HOLD' ? 'INFO' : 'REJECTED', metadata: { action: decision.action }, timestamp: new Date().toISOString() });
  } else {
    addAudit({ id: `audit-${runId}-execution-pending`, eventId: event.id, stage: 'EXECUTION', title: 'Execution pending approval', detail: risk.status === 'PASS' && decision.action !== 'HOLD' ? 'Risk approved the proposal. Awaiting explicit paper execution.' : 'No execution available because the AI selected HOLD or risk rejected the proposal.', status: risk.status === 'PASS' ? 'INFO' : 'REJECTED', metadata: { action: decision.action, riskStatus: risk.status }, timestamp: new Date().toISOString() });
  }
  agentStatus.stage = 'MONITORING'; agentStatus.updatedAt = new Date().toISOString();
  addAudit({ id: `audit-${runId}-monitoring`, eventId: event.id, stage: 'MONITORING', title: 'Position monitoring active', detail: `Portfolio refreshed after ${decision.action} decision.`, status: 'INFO', metadata: { portfolio: getPortfolioSummary() }, timestamp: new Date().toISOString() });
  return { event, decision, risk, trade, provider };
}

export async function executeApprovedDecision(decisionId: string): Promise<PipelineResult> {
  const decision = getDecision(decisionId);
  if (!decision) throw new Error('Decision not found. Run the Agent Event analysis first.');
  const event = getEvent(decision.eventId);
  if (!event) throw new Error('Source event not found for this decision.');
  const existingTrade = getTradeForDecision(decisionId);
  if (existingTrade) return { event, decision, risk: getRiskForDecision(decisionId) ?? { status: 'PASS', riskScore: existingTrade.riskScore, reasons: [], checks: [], createdAt: existingTrade.timestamp }, trade: existingTrade, provider: 'stored approval' };
  const portfolio = getPortfolioSummary();
  const positions = getPositions();
  const risk = evaluateRisk(decision, portfolio, hasRecentOrder(event.id, decision.symbol), Boolean(positions.find((position) => position.symbol === decision.symbol && position.quantity > 0)));
  saveRisk(`risk-execute-${decision.id}-${Date.now()}`, decision.id ?? decisionId, risk);
  agentStatus.stage = 'RISK_CHECK'; agentStatus.lastRisk = risk; agentStatus.updatedAt = new Date().toISOString();
  if (risk.status !== 'PASS' || decision.action === 'HOLD') return { event, decision, risk, provider: 'revalidated approval' };
  const trade = executePaperOrder(decision, risk);
  if (trade) addAudit({ id: `audit-execute-${decisionId}-${Date.now()}`, eventId: event.id, stage: 'EXECUTION', title: 'Approved paper order executed', detail: `${trade.side} ${trade.quantity} ${trade.symbol} at $${trade.price.toFixed(2)} · ${trade.status}`, status: trade.status === 'FILLED' ? 'PASS' : 'REJECTED', metadata: trade, timestamp: new Date().toISOString() });
  agentStatus.stage = 'MONITORING'; agentStatus.updatedAt = new Date().toISOString();
  return { event, decision, risk, trade, provider: 'revalidated approval' };
}
