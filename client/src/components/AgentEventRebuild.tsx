import { AlertTriangle, Bot, Check, CheckCircle2, Circle, Clock3, FileText, GitBranch, Loader2, Radio, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, XCircle, Zap } from 'lucide-react';
import type { AgentDecision, AgentStatus, AuditLog, EventsResponse, MarketEvent, PipelineResult, PortfolioSummary, Position, RiskCheck, Trade } from '../lib/api';
import { formatMoney, formatPct, formatTime } from '../lib/api';

type Props = {
  status: AgentStatus;
  events: EventsResponse;
  decisions: AgentDecision[];
  trades: Trade[];
  positions: Position[];
  portfolio: PortfolioSummary;
  audit: AuditLog[];
  processing: boolean;
  stage: string;
  lastResult: PipelineResult | null;
  onExecute: (decisionId: string) => void;
};

const stageOrder = ['EVENT_DETECTED', 'CONTEXT_ANALYSIS', 'AI_DECISION', 'RISK_CHECK', 'EXECUTION', 'MONITORING'];
const stageNames: Record<string, string> = { EVENT_DETECTED: 'Event received', CONTEXT_ANALYSIS: 'AI analysis completed', AI_DECISION: 'AI decision generated', RISK_CHECK: 'Risk check', EXECUTION: 'Paper trade executed', MONITORING: 'Monitoring' };

function toneForAction(action?: AgentDecision['action']) { return action === 'BUY' ? 'positive' : action === 'SELL' ? 'negative' : 'neutral'; }
function displaySentiment(value?: string) { return value ? value.replace('_', ' ') : '—'; }

export function AgentEventRebuild({ status, events, decisions, trades, positions, portfolio, audit, processing, stage, lastResult, onExecute }: Props) {
  const event = lastResult?.event ?? events.events[0];
  const decision = lastResult?.decision ?? status.lastDecision ?? decisions[0];
  const risk = lastResult?.risk ?? status.lastRisk;
  const trade = lastResult?.trade ?? (decision ? trades.find((item) => item.decisionId === decision.id) : undefined);
  const market = event ? events.market.find((item) => item.symbol === (decision?.symbol ?? event.affectedSymbols[0])) : undefined;
  const activeStage = processing ? stage : risk ? (trade ? 'MONITORING' : 'RISK_CHECK') : status.stage;
  const isRejected = risk?.status === 'REJECTED';
  const currentPosition = market && positions.find((item) => item.symbol === market.symbol);
  const monitorPrice = currentPosition?.currentPrice ?? market?.price ?? trade?.price ?? 0;
  const monitorEntry = currentPosition?.averageEntry ?? trade?.price ?? monitorPrice;
  const monitorPnl = currentPosition?.unrealizedPnl ?? trade?.realizedPnl ?? 0;
  const monitorReturn = currentPosition?.pnlPct ?? (monitorEntry ? monitorPnl / monitorEntry * 100 : 0);

  return <div className="agent-event-rebuild">
    <header className="agent-event-hero">
      <div><div className="agent-event-kicker"><Radio size={13} /> EVENTPULSE AI / AGENT EVENT ENGINE</div><h2>AI Agent Trading Engine</h2><p>Events are interpreted, decisions are risk-checked, and only approved paper trades are executed.</p></div>
      <div className="agent-online"><span className="agent-online-dot" /> <strong>AI Agent Online</strong><small>{status.mode} · PAPER ONLY</small></div>
    </header>

    <div className="agent-event-flow" aria-label="EventPulse AI flow">{['EVENT', 'ANALYSIS', 'DECISION', 'RISK', 'EXECUTION', 'MONITORING', 'RESULT / LOG'].map((label, index) => <div className="agent-flow-step" key={label}><span>{String(index + 1).padStart(2, '0')}</span><strong>{label}</strong>{index < 6 && <GitBranch size={13} />}</div>)}</div>

    <div className="agent-event-actions"><div className="agent-event-safety"><ShieldCheck size={15} /><span>Automatic mode · refreshes every 7s · new events auto-trigger · approved paper trades auto-execute</span></div><div className="agent-auto-badge"><span className="agent-online-dot" /> AUTO PILOT ACTIVE</div></div>

    <div className="agent-event-grid">
      <section className="agent-event-card event-card"><CardHeader icon={<Radio size={14} />} label="01 / EVENT" title="Live market event" status={event ? 'RECEIVED' : 'WAITING'} statusTone={event ? 'good' : 'muted'} />{event ? <div className="event-detail"><div className="event-title">{event.title}</div><p>{event.description}</p><div className="data-pairs"><DataPair label="Symbol" value={event.affectedSymbols.join(', ')} /><DataPair label="Event type" value={event.sourceType} /><DataPair label="Sentiment" value={displaySentiment(event.sentiment)} tone={event.sentiment === 'BULLISH' ? 'positive' : event.sentiment === 'BEARISH' ? 'negative' : 'neutral'} /><DataPair label="Severity / impact" value={`${event.severity} · ${event.estimatedImpact}/100`} /><DataPair label="Timestamp" value={formatTime(event.timestamp)} /></div></div> : <EmptyBlock icon={<Radio size={22} />} text="Trigger a demo event to provide input to the AI Agent." />}</section>

      <section className="agent-event-card"><CardHeader icon={<Bot size={14} />} label="02 / AI ANALYSIS" title="Market interpretation" status={decision ? 'COMPLETED' : 'PENDING'} statusTone={decision ? 'good' : 'muted'} />{decision ? <div className="analysis-detail"><div className="analysis-metrics"><Metric label="Market sentiment" value={displaySentiment(decision.eventImpact)} tone={toneForAction(decision.action)} /><Metric label="Market impact" value={displaySentiment(event?.sentiment)} /><Metric label="Confidence" value={`${Math.round(decision.confidence * 100)}%`} tone="cyan" /></div><div className="analysis-copy"><span>AI ANALYSIS</span><p>{decision.rationale || decision.thesis}</p></div><div className="risk-factors"><strong>Possible risks</strong><div>{decision.riskFactors.map((item) => <span key={item}><AlertTriangle size={12} /> {item}</span>)}</div></div></div> : <EmptyBlock icon={<Bot size={22} />} text="The AI Agent will interpret the event before generating a decision." />}</section>

      <section className={`agent-event-card decision-card ${decision ? toneForAction(decision.action) : ''}`}><CardHeader icon={<Zap size={14} />} label="03 / AI AGENT DECISION" title="Structured AI decision" status={decision ? 'DECISION READY' : 'PENDING'} statusTone={decision ? 'good' : 'muted'} />{decision ? <div className="decision-detail"><div className="decision-action"><div className="decision-symbol">{decision.symbol}</div><strong>{decision.action}</strong><span>{Math.round(decision.confidence * 100)}% confidence · {decision.timeHorizon}</span></div><p>{decision.thesis}</p></div> : <EmptyBlock icon={<Target size={22} />} text="No manual trade controls are exposed. The AI Agent makes the decision." />}</section>

      <section className={`agent-event-card risk-card ${isRejected ? 'rejected' : risk ? 'approved' : ''}`}><CardHeader icon={<ShieldCheck size={14} />} label="04 / RISK CHECK" title="Independent safety validation" status={risk ? risk.status === 'PASS' ? 'APPROVED' : 'REJECTED' : 'PENDING'} statusTone={risk ? risk.status === 'PASS' ? 'good' : 'bad' : 'muted'} />{risk ? <div className="risk-detail"><div className="risk-score"><span>Risk score</span><strong>{risk.riskScore}<small>/100</small></strong></div><div className="risk-check-list">{risk.checks.map((check) => <div key={check.label} className={check.status === 'PASS' ? 'pass' : 'fail'}>{check.status === 'PASS' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}<span>{check.label}</span><small>{check.detail}</small></div>)}</div><div className="risk-result"><strong>{risk.status === 'PASS' ? 'APPROVED' : 'REJECTED'}</strong><span>{risk.reasons[0] ?? 'All independent risk controls passed.'}</span></div></div> : <EmptyBlock icon={<ShieldCheck size={22} />} text="The AI proposal must pass position, loss, exposure, and stop-loss controls." />}</section>

      <section className="agent-event-card execution-card"><CardHeader icon={<FileText size={14} />} label="05 / EXECUTION" title="Paper trade execution" status={trade ? trade.status : isRejected ? 'NOT CREATED' : risk?.status === 'PASS' && decision?.action !== 'HOLD' ? 'READY' : 'PENDING'} statusTone={trade ? 'good' : isRejected ? 'bad' : risk?.status === 'PASS' && decision?.action !== 'HOLD' ? 'good' : 'muted'} />{trade ? <div className="execution-detail"><div className="execution-banner"><Check size={17} /><strong>PAPER TRADE EXECUTED</strong><span>Risk approval verified before execution</span></div><div className="data-pairs"><DataPair label="Action / symbol" value={`${trade.side} ${trade.symbol}`} tone={trade.side === 'BUY' ? 'positive' : 'negative'} /><DataPair label="Entry price" value={formatMoney(trade.price, trade.price < 10 ? 5 : 2)} /><DataPair label="Quantity" value={trade.quantity.toFixed(4)} /><DataPair label="Total value" value={formatMoney(trade.notional, 2)} /><DataPair label="Status" value={trade.status} /></div></div> : risk?.status === 'PASS' && decision && decision.action !== 'HOLD' ? <div className="execution-ready"><div className="execution-ready-icon"><ShieldCheck size={22} /></div><strong>Risk approved · execution ready</strong><span>The AI Agent has made the decision. Execute only the approved paper order below.</span><button className="primary-button execute-paper-button" onClick={() => onExecute(decision.id ?? '')} disabled={processing || !decision.id}><Zap size={15} /> {processing ? 'EXECUTING PAPER TRADE…' : `EXECUTE PAPER ${decision.action}`}</button><small>Server re-checks exposure, position availability, duplicate signal, and loss limits before filling.</small></div> : <EmptyBlock icon={isRejected ? <XCircle size={22} /> : <FileText size={22} />} text={isRejected ? 'No paper trade was created because the risk check was rejected.' : decision?.action === 'HOLD' ? 'The AI Agent selected HOLD. No execution is appropriate for this event.' : 'Execution activates only after risk approval.'} danger={isRejected} />}</section>

      <section className="agent-event-card monitor-card"><CardHeader icon={<TrendingUp size={14} />} label="06 / MONITORING" title="Trade monitor" status={trade || currentPosition ? 'ACTIVE' : 'STANDBY'} statusTone={trade || currentPosition ? 'good' : 'muted'} />{trade || currentPosition ? <div className="monitor-detail"><div className="monitor-symbol"><span>{decision?.symbol ?? currentPosition?.symbol}</span><small>OPEN PAPER POSITION</small></div><div className="monitor-stats"><Metric label="Entry" value={formatMoney(monitorEntry, monitorEntry < 10 ? 5 : 2)} /><Metric label="Current" value={formatMoney(monitorPrice, monitorPrice < 10 ? 5 : 2)} /><Metric label="P/L" value={formatMoney(monitorPnl, 2)} tone={monitorPnl >= 0 ? 'positive' : 'negative'} /><Metric label="Return" value={formatPct(monitorReturn, 2)} tone={monitorReturn >= 0 ? 'positive' : 'negative'} /></div><div className="monitor-note"><Clock3 size={13} /> Tracking current price, unrealized P/L, stop-loss, take-profit, and position status.</div></div> : <EmptyBlock icon={<TrendingUp size={22} />} text="Approved paper trades appear here for live monitoring." />}</section>
    </div>

    <section className="agent-event-timeline"><CardHeader icon={<Clock3 size={14} />} label="07 / RESULT + LOG" title="Complete event timeline" status={event ? 'AUDIT TRAIL ACTIVE' : 'WAITING'} statusTone={event ? 'good' : 'muted'} /><div className="timeline-list">{['EVENT_DETECTED', 'CONTEXT_ANALYSIS', 'AI_DECISION', 'RISK_CHECK', 'EXECUTION', 'MONITORING'].map((item, index) => { const done = Boolean(event && (risk || index < stageOrder.indexOf(activeStage) + 1)); const blocked = item === 'EXECUTION' && isRejected; const current = processing && item === activeStage; return <div className={`timeline-item ${done ? 'done' : ''} ${blocked ? 'blocked' : ''} ${current ? 'current' : ''}`} key={item}><div className="timeline-marker">{blocked ? <XCircle size={14} /> : done ? <Check size={14} /> : current ? <Loader2 size={14} className="spin" /> : <Circle size={10} />}</div><div><strong>{blocked ? 'Paper trade blocked safely' : stageNames[item]}</strong><span>{audit.find((row) => row.stage === item)?.detail ?? (current ? 'Agent processing…' : done ? 'Recorded in audit trail' : 'Awaiting previous stage')}</span></div>{index < 5 && <div className="timeline-line" />}</div> })}<div className={`timeline-item result ${trade ? 'done' : isRejected ? 'blocked' : ''}`}><div className="timeline-marker">{trade ? <Check size={14} /> : isRejected ? <XCircle size={14} /> : <Circle size={10} />}</div><div><strong>{isRejected ? 'Final result: rejected' : trade ? 'Final result: paper position monitored' : 'Final result pending'}</strong><span>{trade ? `${trade.symbol} ${trade.side} is recorded with complete lifecycle history.` : isRejected ? 'No paper trade was created.' : 'The result is generated after execution and monitoring.'}</span></div></div></div></section>

    <div className="agent-event-footnote"><AlertTriangle size={13} /><span>Simulation only. EventPulse AI does not place real orders or provide financial advice. The system always enforces the Risk → Approved → Paper Execution sequence.</span></div>
  </div>;
}

function CardHeader({ icon, label, title, status, statusTone }: { icon: React.ReactNode; label: string; title: string; status: string; statusTone: string }) { return <div className="agent-card-header"><div><div className="agent-card-label">{icon} {label}</div><h3>{title}</h3></div><span className={`agent-status-badge ${statusTone}`}>{status}</span></div>; }
function DataPair({ label, value, tone = '' }: { label: string; value: string; tone?: string }) { return <div className="agent-data-pair"><span>{label}</span><strong className={tone}>{value}</strong></div>; }
function Metric({ label, value, tone = '' }: { label: string; value: string; tone?: string }) { return <div className="agent-metric"><span>{label}</span><strong className={tone}>{value}</strong></div>; }
function EmptyBlock({ icon, text, danger = false }: { icon: React.ReactNode; text: string; danger?: boolean }) { return <div className={`agent-empty ${danger ? 'danger' : ''}`}>{icon}<span>{text}</span></div>; }
