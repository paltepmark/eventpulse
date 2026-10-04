import type { MarketSnapshot } from '../types.js';

export type CryptoMarketCondition = 'TRENDING_BULLISH' | 'TRENDING_BEARISH' | 'RANGING' | 'HIGH_VOLATILITY';
export type CryptoSignal = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
export type RecommendedStrategy = 'SPOT_GRID' | 'DYNAMIC_DCA' | 'SCALPING' | 'NONE';

export interface CryptoAnalysis {
  symbol: string;
  timeframe: string;
  market_condition: CryptoMarketCondition;
  signal: CryptoSignal;
  confidence_score: number;
  reasoning: string;
  recommended_strategy: RecommendedStrategy;
  indicators: { rsi: number; atr: number; macd: number; macdSignal: number; bollingerUpper: number; bollingerLower: number; bidAskRatio: number };
  generated_at: string;
}

export interface CryptoRiskInput { accountBalance: number; entryPrice: number; leverage: number; signal: CryptoSignal; atr: number; side?: 'LONG' | 'SHORT'; }
export interface CryptoRiskOutput { approved: boolean; leverage: number; position_size_usdt: number; stop_loss_price: number; take_profit_price: number; risk_reward_ratio: string; liquidation_buffer_percent: number; risk_warning: string; risk_amount_usdt: number; }

const CRYPTO = new Set(['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX', 'LINK', 'SUI']);

export function isCryptoSymbol(symbol: string): boolean { return CRYPTO.has(symbol.toUpperCase()); }

function indicators(snapshot: MarketSnapshot) {
  const atr = Number((snapshot.price * (snapshot.volatility / 100) * 0.36).toFixed(snapshot.price < 10 ? 5 : 2));
  const macd = Number((snapshot.momentum * 0.08 + (snapshot.price - snapshot.movingAverage) / Math.max(snapshot.price, 1) * 100).toFixed(4));
  const macdSignal = Number((macd * 0.72).toFixed(4));
  const bandWidth = Math.max(atr * 2.1, snapshot.price * 0.006);
  const bidAskRatio = Number((1 + Math.sin(Date.now() / 17000 + snapshot.price) * 0.18 + snapshot.momentum / 100).toFixed(3));
  return { atr, macd, macdSignal, bollingerUpper: Number((snapshot.movingAverage + bandWidth).toFixed(snapshot.price < 10 ? 5 : 2)), bollingerLower: Number(Math.max(0, snapshot.movingAverage - bandWidth).toFixed(snapshot.price < 10 ? 5 : 2)), bidAskRatio };
}

export function analyzeCryptoMarket(snapshot: MarketSnapshot, timeframe = '15m'): CryptoAnalysis {
  const values = indicators(snapshot);
  const bullishConfirmations = [snapshot.rsi >= 52, values.macd > values.macdSignal, snapshot.price >= snapshot.movingAverage, values.bidAskRatio > 1.04].filter(Boolean).length;
  const bearishConfirmations = [snapshot.rsi <= 48, values.macd < values.macdSignal, snapshot.price <= snapshot.movingAverage, values.bidAskRatio < 0.96].filter(Boolean).length;
  const oversold = snapshot.rsi <= 32;
  const overbought = snapshot.rsi >= 68;
  const highVolatility = snapshot.volatility >= 24;
  let market_condition: CryptoMarketCondition = highVolatility ? 'HIGH_VOLATILITY' : bullishConfirmations >= 3 ? 'TRENDING_BULLISH' : bearishConfirmations >= 3 ? 'TRENDING_BEARISH' : 'RANGING';
  let signal: CryptoSignal = 'NEUTRAL';
  if (market_condition === 'HIGH_VOLATILITY') signal = bullishConfirmations >= 3 ? 'BUY' : bearishConfirmations >= 3 ? 'SELL' : 'NEUTRAL';
  else if (bullishConfirmations >= 3) signal = bullishConfirmations === 4 ? 'STRONG_BUY' : 'BUY';
  else if (bearishConfirmations >= 3) signal = bearishConfirmations === 4 ? 'STRONG_SELL' : 'SELL';
  const confidence_score = Math.min(96, Math.max(52, Math.round(54 + Math.max(bullishConfirmations, bearishConfirmations) * 8 + Math.abs(snapshot.rsi - 50) * 0.35 - (highVolatility ? 8 : 0))));
  const recommended_strategy: RecommendedStrategy = oversold || overbought ? 'DYNAMIC_DCA' : highVolatility ? 'SCALPING' : market_condition === 'RANGING' ? 'SPOT_GRID' : 'NONE';
  const confirmation = bullishConfirmations >= bearishConfirmations ? `${bullishConfirmations}/4 bullish confirmations` : `${bearishConfirmations}/4 bearish confirmations`;
  const reasoning = `${market_condition.replaceAll('_', ' ')} on ${timeframe}: RSI ${snapshot.rsi.toFixed(0)}, MACD ${values.macd > values.macdSignal ? 'above' : 'below'} signal, price ${snapshot.price >= snapshot.movingAverage ? 'above' : 'below'} moving average, and bid/ask ratio ${values.bidAskRatio.toFixed(2)} (${confirmation}). ${highVolatility ? 'ATR-adjusted volatility is elevated, so size conservatively.' : 'Multiple indicators align without a single-indicator dependency.'}`;
  return { symbol: snapshot.symbol, timeframe, market_condition, signal, confidence_score, reasoning, recommended_strategy, indicators: { rsi: snapshot.rsi, atr: values.atr, macd: values.macd, macdSignal: values.macdSignal, bollingerUpper: values.bollingerUpper, bollingerLower: values.bollingerLower, bidAskRatio: values.bidAskRatio }, generated_at: new Date().toISOString() };
}

export function calculateCryptoRisk(input: CryptoRiskInput): CryptoRiskOutput {
  const balance = Math.max(0, Number(input.accountBalance));
  const entry = Math.max(0.00000001, Number(input.entryPrice));
  const atr = Math.max(entry * 0.001, Number(input.atr));
  const requestedLeverage = Math.max(1, Number(input.leverage));
  const leverage = Math.min(5, requestedLeverage);
  const riskAmount = balance * 0.01;
  const stopDistance = atr * 1.8;
  const takeDistance = atr * 4.5;
  const side = input.side ?? (input.signal.includes('SELL') ? 'SHORT' : 'LONG');
  const stop_loss_price = Number((side === 'LONG' ? entry - stopDistance : entry + stopDistance).toFixed(entry < 10 ? 6 : 2));
  const take_profit_price = Number((side === 'LONG' ? entry + takeDistance : entry - takeDistance).toFixed(entry < 10 ? 6 : 2));
  const position_size_usdt = Number(Math.min(balance * 0.2, riskAmount / (stopDistance / entry)).toFixed(2));
  const liquidation_buffer_percent = Number(Math.max(12, 35 - leverage * 3 - (atr / entry) * 100 * 0.6).toFixed(1));
  const tooVolatile = atr / entry > 0.06;
  const approved = balance > 0 && entry > 0 && !tooVolatile && !['NEUTRAL'].includes(input.signal);
  return { approved, leverage, position_size_usdt, stop_loss_price, take_profit_price, risk_reward_ratio: '1:2.5', liquidation_buffer_percent, risk_warning: tooVolatile ? 'Volatility is too high for the 1% risk budget; reduce size or wait for confirmation.' : requestedLeverage > 5 ? 'Requested leverage capped at 5x by the paper-trading risk policy.' : approved ? 'Paper-only sizing approved within the 1% account-risk budget.' : 'No directional signal; sizing is not approved.', risk_amount_usdt: Number(riskAmount.toFixed(2)) };
}
