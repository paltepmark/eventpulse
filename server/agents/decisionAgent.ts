import { demoProvider, llmProvider, type AIProvider } from './providers.js';
import type { AgentDecision, DecisionInput } from '../types.js';

export function getActiveProvider(): AIProvider {
  return process.env.AI_API_KEY ? llmProvider : demoProvider;
}

export function validateDecision(decision: AgentDecision, input: DecisionInput): AgentDecision {
  const allowed = ['BUY', 'SELL', 'HOLD'];
  if (!allowed.includes(decision.action)) throw new Error('Malformed AI decision: action must be BUY, SELL, or HOLD.');
  if (decision.symbol !== input.symbol) throw new Error('Malformed AI decision: symbol mismatch.');
  if (!Number.isFinite(decision.confidence) || decision.confidence < 0 || decision.confidence > 1) throw new Error('Malformed AI decision: confidence must be between 0 and 1.');
  if (!Number.isFinite(decision.suggestedPositionPercent) || decision.suggestedPositionPercent < 0 || decision.suggestedPositionPercent > 100) throw new Error('Malformed AI decision: position sizing is invalid.');
  if (decision.action === 'BUY' && decision.stopLossPercent <= 0) throw new Error('Malformed AI decision: BUY requires a stop loss.');
  if (!Array.isArray(decision.riskFactors)) throw new Error('Malformed AI decision: riskFactors must be an array.');
  return { ...decision, eventId: input.event.id, symbol: input.symbol, confidence: Number(decision.confidence.toFixed(2)), createdAt: new Date().toISOString() };
}

export async function analyzeDecision(input: DecisionInput): Promise<{ decision: AgentDecision; provider: string }> {
  const provider = getActiveProvider();
  const raw = await provider.analyze(input);
  return { decision: validateDecision(raw, input), provider: provider.name };
}
