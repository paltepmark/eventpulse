export type Action = 'BUY' | 'SELL' | 'HOLD';
export type Sentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PipelineStage = 'IDLE' | 'EVENT_DETECTED' | 'CONTEXT_ANALYSIS' | 'AI_DECISION' | 'RISK_CHECK' | 'EXECUTION' | 'MONITORING';

export interface MarketSnapshot {
  symbol: string;
  price: number;
  changePct: number;
  volume: number;
  volatility: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
  momentum: number;
  movingAverage: number;
  rsi: number;
  atr: number;
  macd: number;
  macdSignal: number;
  bollingerUpper: number;
  bollingerLower: number;
  bidAskRatio: number;
  recentChanges: number[];
  timestamp: string;
}

export interface MarketEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  sourceType: string;
  affectedSymbols: string[];
  sentiment: Sentiment;
  estimatedImpact: number;
  severity: Severity;
}

export interface DecisionInput {
  event: MarketEvent;
  symbol: string;
  market: MarketSnapshot;
  portfolioExposure: number;
  existingPositions: Record<string, Position>;
}

export interface AgentDecision {
  id?: string;
  eventId: string;
  symbol: string;
  action: Action;
  confidence: number;
  eventImpact: Sentiment;
  timeHorizon: string;
  thesis: string;
  riskFactors: string[];
  suggestedPositionPercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  rationale: string;
  createdAt?: string;
}

export interface RiskCheck {
  id?: string;
  decisionId?: string;
  status: 'PASS' | 'REJECTED';
  riskScore: number;
  reasons: string[];
  checks: { label: string; status: 'PASS' | 'FAIL'; detail: string }[];
  createdAt?: string;
}

export interface Trade {
  id: string;
  decisionId?: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  notional: number;
  confidence: number;
  riskScore: number;
  status: 'FILLED' | 'REJECTED';
  realizedPnl: number;
  timestamp: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  averageEntry: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  pnlPct: number;
}

export interface PortfolioSummary {
  startingValue: number;
  portfolioValue: number;
  cash: number;
  investedCapital: number;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  todayPnl: number;
  exposurePct: number;
  positionsCount: number;
  winRate: number;
  maxDrawdown: number;
  tradeCount: number;
}

export interface AuditLog {
  id: string;
  eventId?: string;
  stage: string;
  title: string;
  detail: string;
  status: 'INFO' | 'PASS' | 'WARN' | 'REJECTED';
  metadata?: unknown;
  timestamp: string;
}

export interface AgentStatus {
  active: boolean;
  mode: 'DEMO';
  stage: PipelineStage;
  lastEventId?: string;
  lastDecision?: AgentDecision;
  lastRisk?: RiskCheck;
  updatedAt: string;
}
