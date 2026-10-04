import type { AgentDecision, DecisionInput } from '../types.js';

export interface AIProvider {
  name: string;
  analyze(input: DecisionInput): Promise<AgentDecision>;
}

function decisionFromSignal(input: DecisionInput): AgentDecision {
  const { event, market, symbol } = input;
  const heldPosition = Boolean(input.existingPositions[symbol]?.quantity);
  const bullish = event.sentiment === 'BULLISH';
  const bearish = event.sentiment === 'BEARISH';
  const momentumBoost = market.momentum > 0 ? 0.06 : market.momentum < 0 ? -0.04 : 0;
  const baseConfidence = 0.66 + event.estimatedImpact * 0.16 + momentumBoost - (market.volatility / 1000);
  const confidence = Math.min(0.93, Math.max(0.58, Number(baseConfidence.toFixed(2))));
  const action = bullish && confidence >= 0.65 && market.trend !== 'DOWN'
    ? 'BUY'
    : bearish && confidence >= 0.65 && heldPosition && market.trend !== 'UP'
      ? 'SELL'
      : 'HOLD';
  const position = action === 'HOLD' ? 0 : Math.min(8, Math.max(4, Number((event.estimatedImpact * 8.5 - market.volatility / 16).toFixed(1))));
  const stopLoss = action === 'HOLD' ? 0 : market.volatility > 20 ? 3.8 : 3.0;
  const takeProfit = action === 'HOLD' ? 0 : event.estimatedImpact > 0.75 ? 7 : 5.5;
  const direction = bullish ? 'positive' : bearish ? 'defensive' : 'balanced';
  const executionNote = action === 'HOLD' && bearish && !heldPosition ? ' No open position exists to reduce, so the agent is observing instead of forcing a SELL.' : '';
  return {
    eventId: event.id, symbol, action, confidence, eventImpact: event.sentiment,
    timeHorizon: action === 'HOLD' ? 'Observe / 1 day' : '1-5 days',
    thesis: `${event.title} creates a ${direction} short-term setup for ${symbol}.`,
    riskFactors: [
      market.volatility > 20 ? 'Elevated simulated volatility may widen outcomes.' : 'Market regime can invalidate the event signal.',
      input.portfolioExposure > 45 ? 'Existing portfolio exposure reduces sizing flexibility.' : 'Macro risk may move correlated positions together.',
    ],
    suggestedPositionPercent: position, stopLossPercent: stopLoss, takeProfitPercent: takeProfit,
    rationale: `${bullish ? 'Positive event sentiment increased bullish probability.' : bearish ? 'Negative event sentiment increased defensive probability.' : 'Mixed signal kept the agent selective.'} ${market.volatility > 20 ? 'Elevated volatility reduced the recommended position size.' : 'Current volatility supports measured sizing.'}${executionNote}`,
  };
}

export const demoProvider: AIProvider = {
  name: 'Demo AI · deterministic',
  async analyze(input) { return decisionFromSignal(input); },
};

export const llmProvider: AIProvider = {
  name: process.env.AI_MODEL ? `LLM · ${process.env.AI_MODEL}` : 'LLM provider',
  async analyze(input) {
    const baseUrl = process.env.AI_BASE_URL;
    const apiKey = process.env.AI_API_KEY;
    if (!baseUrl || !apiKey) return demoProvider.analyze(input);
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.AI_MODEL ?? 'gpt-4o-mini', temperature: 0.1, response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: 'You are a concise event-driven paper trading analyst. Return only valid JSON with action BUY, SELL, or HOLD; never reveal chain-of-thought.' },
          { role: 'user', content: JSON.stringify({ event: input.event, symbol: input.symbol, market: input.market, portfolioExposure: input.portfolioExposure, existingPositions: input.existingPositions }) }] }),
    });
    if (!response.ok) return demoProvider.analyze(input);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return demoProvider.analyze(input);
    try { return { ...demoProviderOutput(input, JSON.parse(content)), eventId: input.event.id, symbol: input.symbol }; }
    catch { return demoProvider.analyze(input); }
  },
};

function demoProviderOutput(input: DecisionInput, parsed: Partial<AgentDecision>): AgentDecision {
  const fallback = decisionFromSignal(input);
  return { ...fallback, ...parsed, action: parsed.action === 'BUY' || parsed.action === 'SELL' || parsed.action === 'HOLD' ? parsed.action : fallback.action,
    confidence: Number(parsed.confidence ?? fallback.confidence), suggestedPositionPercent: Number(parsed.suggestedPositionPercent ?? fallback.suggestedPositionPercent),
    stopLossPercent: Number(parsed.stopLossPercent ?? fallback.stopLossPercent), takeProfitPercent: Number(parsed.takeProfitPercent ?? fallback.takeProfitPercent),
    riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors.map(String) : fallback.riskFactors, thesis: String(parsed.thesis ?? fallback.thesis), rationale: String(parsed.rationale ?? fallback.rationale) };
}
