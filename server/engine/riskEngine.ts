import type { AgentDecision, PortfolioSummary, RiskCheck } from '../types.js';

export const RISK_LIMITS = { maxSinglePosition: 10, maxTotalExposure: 60, maxSingleTradeLoss: 2, maxDailyLoss: 5, minConfidence: 0.65 };

export function evaluateRisk(decision: AgentDecision, portfolio: PortfolioSummary, duplicateOrder = false, positionAvailable = true): RiskCheck {
  const checks: RiskCheck['checks'] = [];
  const reasons: string[] = [];
  const currentExposure = portfolio.exposurePct;
  const proposedExposure = currentExposure + decision.suggestedPositionPercent;
  const projectedLoss = decision.suggestedPositionPercent * (decision.stopLossPercent / 100);
  const singlePositionPass = decision.suggestedPositionPercent <= RISK_LIMITS.maxSinglePosition || decision.action === 'HOLD';
  const exposurePass = proposedExposure <= RISK_LIMITS.maxTotalExposure || decision.action !== 'BUY';
  const confidencePass = decision.confidence >= RISK_LIMITS.minConfidence || decision.action === 'HOLD';
  const stopPass = decision.action !== 'BUY' || decision.stopLossPercent > 0;
  const lossPass = projectedLoss <= RISK_LIMITS.maxSingleTradeLoss || decision.action !== 'BUY';
  const dailyPass = Math.abs(portfolio.todayPnl / portfolio.startingValue * 100) < RISK_LIMITS.maxDailyLoss;
  const duplicatePass = !duplicateOrder;
  const positionPass = decision.action !== 'SELL' || positionAvailable;
  const marketPass = Boolean(decision.symbol && Number.isFinite(decision.confidence));
  checks.push({ label: 'AI confidence ≥ 65%', status: confidencePass ? 'PASS' : 'FAIL', detail: `${(decision.confidence * 100).toFixed(0)}% confidence` });
  checks.push({ label: 'Single position ≤ 10%', status: singlePositionPass ? 'PASS' : 'FAIL', detail: `${decision.suggestedPositionPercent.toFixed(1)}% proposed` });
  checks.push({ label: 'Total exposure ≤ 60%', status: exposurePass ? 'PASS' : 'FAIL', detail: `${proposedExposure.toFixed(1)}% projected` });
  checks.push({ label: 'Single-trade loss ≤ 2%', status: lossPass ? 'PASS' : 'FAIL', detail: `${projectedLoss.toFixed(2)}% projected loss` });
  checks.push({ label: 'BUY stop loss present', status: stopPass ? 'PASS' : 'FAIL', detail: decision.action === 'BUY' ? `${decision.stopLossPercent}% stop` : 'Not required for HOLD/SELL' });
  checks.push({ label: 'Daily loss ≤ 5%', status: dailyPass ? 'PASS' : 'FAIL', detail: `${Math.abs(portfolio.todayPnl / portfolio.startingValue * 100).toFixed(2)}% today` });
  checks.push({ label: 'Duplicate order guard', status: duplicatePass ? 'PASS' : 'FAIL', detail: duplicatePass ? 'No duplicate order' : 'Existing recent order found' });
  checks.push({ label: 'Position available for SELL', status: positionPass ? 'PASS' : 'FAIL', detail: positionPass ? 'Position can be reduced' : 'No open position to sell' });
  checks.push({ label: 'Market data present', status: marketPass ? 'PASS' : 'FAIL', detail: marketPass ? 'Context complete' : 'Required market fields missing' });
  if (!confidencePass) reasons.push('Trade rejected: AI confidence is below the 65% minimum.');
  if (!singlePositionPass) reasons.push('Trade rejected: proposed position exceeds the 10% single-position limit.');
  if (!exposurePass) reasons.push('Trade rejected: proposed position would increase total exposure above 60%.');
  if (!lossPass) reasons.push('Trade rejected: projected single-trade portfolio loss exceeds 2%.');
  if (!stopPass) reasons.push('Trade rejected: every BUY requires a stop loss.');
  if (!dailyPass) reasons.push('Trade rejected: daily loss limit of 5% has been reached.');
  if (!duplicatePass) reasons.push('Trade rejected: duplicate order detected for this signal.');
  if (!positionPass) reasons.push('Trade rejected: SELL requires an existing paper position.');
  if (!marketPass) reasons.push('Trade rejected: required market data is missing.');
  const riskScore = Math.max(0, Math.min(100, Math.round(100 - decision.suggestedPositionPercent * 2.2 - (decision.confidence < 0.75 ? 12 : 0) - (decision.stopLossPercent > 3.5 ? 8 : 0) - (portfolio.exposurePct > 40 ? 10 : 0))));
  return { status: reasons.length ? 'REJECTED' : 'PASS', riskScore, reasons, checks, createdAt: new Date().toISOString() };
}
