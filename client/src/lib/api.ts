export type Action = 'BUY' | 'SELL' | 'HOLD';
export type Sentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PipelineStage = 'IDLE' | 'EVENT_DETECTED' | 'CONTEXT_ANALYSIS' | 'AI_DECISION' | 'RISK_CHECK' | 'EXECUTION' | 'MONITORING';
export interface Point { timestamp: string; price: number; volume?: number; }
export interface MarketSnapshot { symbol: string; price: number; changePct: number; volume: number; volatility: number; trend: string; momentum: number; movingAverage: number; rsi: number; atr: number; macd: number; macdSignal: number; bollingerUpper: number; bollingerLower: number; bidAskRatio: number; recentChanges: number[]; timestamp: string; }
export interface MarketEvent { id: string; timestamp: string; title: string; description: string; sourceType: string; affectedSymbols: string[]; sentiment: Sentiment; estimatedImpact: number; severity: Severity; }
export interface AgentDecision { id?: string; eventId: string; symbol: string; action: Action; confidence: number; eventImpact: Sentiment; timeHorizon: string; thesis: string; riskFactors: string[]; suggestedPositionPercent: number; stopLossPercent: number; takeProfitPercent: number; rationale: string; createdAt?: string; }
export interface RiskCheck { id?: string; decisionId?: string; status: 'PASS' | 'REJECTED'; riskScore: number; reasons: string[]; checks: Array<{ label: string; status: 'PASS' | 'FAIL'; detail: string }>; createdAt?: string; }
export interface Trade { id: string; decisionId?: string; symbol: string; side: 'BUY' | 'SELL'; quantity: number; price: number; notional: number; confidence: number; riskScore: number; status: 'FILLED' | 'REJECTED'; realizedPnl: number; timestamp: string; }
export interface Position { symbol: string; quantity: number; averageEntry: number; currentPrice: number; marketValue: number; unrealizedPnl: number; pnlPct: number; }
export interface PortfolioSummary { startingValue: number; portfolioValue: number; cash: number; investedCapital: number; totalPnl: number; realizedPnl: number; unrealizedPnl: number; todayPnl: number; exposurePct: number; positionsCount: number; winRate: number; maxDrawdown: number; tradeCount: number; }
export interface AuditLog { id: string; eventId?: string; stage: string; title: string; detail: string; status: 'INFO' | 'PASS' | 'WARN' | 'REJECTED'; metadata?: unknown; timestamp: string; }
export interface AgentStatus { active: boolean; mode: 'DEMO'; stage: PipelineStage; lastEventId?: string; lastDecision?: AgentDecision; lastRisk?: RiskCheck; updatedAt: string; }
export interface Performance { equity: Array<{ timestamp: string; value: number; dailyPnl: number }>; exposure: Array<{ timestamp: string; exposure: number }>; distribution: Array<{ label: string; value: number }>; metrics: PortfolioSummary & { sharpeLike: number; averageTrade: number }; }
export interface EventsResponse { events: MarketEvent[]; market: MarketSnapshot[]; }
export interface PipelineResult { event: MarketEvent; decision: AgentDecision; risk: RiskCheck; trade?: Trade; provider: string; }
export interface CryptoAnalysis { symbol: string; timeframe: string; market_condition: 'TRENDING_BULLISH' | 'TRENDING_BEARISH' | 'RANGING' | 'HIGH_VOLATILITY'; signal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL'; confidence_score: number; reasoning: string; recommended_strategy: 'SPOT_GRID' | 'DYNAMIC_DCA' | 'SCALPING' | 'NONE'; indicators: { rsi: number; atr: number; macd: number; macdSignal: number; bollingerUpper: number; bollingerLower: number; bidAskRatio: number }; generated_at: string; }
export interface CryptoRisk { approved: boolean; leverage: number; position_size_usdt: number; stop_loss_price: number; take_profit_price: number; risk_reward_ratio: string; liquidation_buffer_percent: number; risk_warning: string; risk_amount_usdt: number; }

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `Request failed: ${response.status}`);
  return body as T;
}
export const formatMoney = (value: number, digits = 0) => `$${value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
export const formatPct = (value: number, digits = 1) => `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
export const formatTime = (value?: string) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
export const timeAgo = (value: string) => { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`; };
