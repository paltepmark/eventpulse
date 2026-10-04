import type { MarketSnapshot } from '../types.js';

export const SUPPORTED_SYMBOLS = ['NVDA', 'MSFT', 'SPY', 'SNDK', 'AAPL', 'TSLA', 'AMZN', 'GOOGL', 'QQQ', 'AMD', 'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX', 'LINK', 'SUI', 'TRX', 'TON', 'DOT', 'LTC', 'BCH', 'UNI', 'NEAR', 'ATOM', 'XLM', 'SHIB', 'PEPE', 'APT', 'ARB', 'OP', 'FIL', 'ICP', 'ETC', 'HBAR', 'ALGO', 'AAVE', 'MKR', 'CRO', 'INJ', 'RUNE', 'SEI', 'TIA'];

const bases: Record<string, number> = { SPY: 574.2, QQQ: 493.8, NVDA: 185.42, SNDK: 47.2, AAPL: 226.7, MSFT: 428.3, AMZN: 187.6, TSLA: 248.4, GOOGL: 247.2, AMD: 142.1, BTC: 110500, ETH: 3820, SOL: 222, XRP: 2.8, BNB: 690, DOGE: 0.18, ADA: 0.75, AVAX: 34, LINK: 18, SUI: 3.4, TRX: 0.29, TON: 3.1, DOT: 4.2, LTC: 96, BCH: 515, UNI: 7.2, NEAR: 5.1, ATOM: 4.6, XLM: 0.31, SHIB: 0.000013, PEPE: 0.000009, APT: 4.8, ARB: 0.42, OP: 0.72, FIL: 1.65, ICP: 5.2, ETC: 18.5, HBAR: 0.15, ALGO: 0.19, AAVE: 178, MKR: 1500, CRO: 0.09, INJ: 9.8, RUNE: 1.4, SEI: 0.18, TIA: 1.2 };
const phases: Record<string, number> = { SPY: 0.8, QQQ: 1.5, NVDA: 2.3, SNDK: 1.8, AAPL: 0.4, MSFT: 2.8, AMZN: 1.1, TSLA: 3.2, GOOGL: 2.6, AMD: 2.0, BTC: 0.2, ETH: 1.2, SOL: 2.4, XRP: 3.1, BNB: 1.7, DOGE: 2.9, ADA: 0.7, AVAX: 1.9, LINK: 2.2, SUI: 3.4, TRX: 0.5, TON: 1.4, DOT: 2.1, LTC: 2.8, BCH: 1.6, UNI: 0.9, NEAR: 2.6, ATOM: 3.2, XLM: 0.3, SHIB: 1.8, PEPE: 2.4, APT: 0.6, ARB: 1.3, OP: 2.9, FIL: 0.8, ICP: 2.0, ETC: 3.5, HBAR: 1.1, ALGO: 2.7, AAVE: 1.9, MKR: 0.4, CRO: 3.0, INJ: 2.3, RUNE: 1.5, SEI: 3.3, TIA: 0.7 };

function stableWave(symbol: string, time: number): number {
  const phase = phases[symbol] ?? 1;
  return Math.sin(time / 18_000 + phase) * 0.006 + Math.cos(time / 42_000 + phase * 1.7) * 0.003;
}

export function getMarketSnapshot(symbol: string, now = Date.now()): MarketSnapshot {
  const base = bases[symbol] ?? 100;
  const wave = stableWave(symbol, now);
  const price = Number((base * (1 + wave)).toFixed(2));
  const changePct = Number(((wave + Math.sin(now / 90_000 + (phases[symbol] ?? 1)) * 0.002) * 100).toFixed(2));
  const volatility = Number((Math.abs(Math.sin(now / 30_000 + (phases[symbol] ?? 1))) * 18 + 8).toFixed(1));
  const momentum = Number((changePct * 1.4 + Math.sin(now / 55_000) * 4).toFixed(1));
  const movingAverage = Number((price / (1 + wave * 0.45)).toFixed(2));
  const rsi = Math.min(78, Math.max(22, Number((50 + momentum * 1.7).toFixed(1))));
  const atr = Number((price * volatility / 100 * 0.36).toFixed(price < 10 ? 5 : 2));
  const macd = Number((momentum * 0.08 + (price - movingAverage) / Math.max(price, 1) * 100).toFixed(4));
  const macdSignal = Number((macd * 0.72).toFixed(4));
  const bandWidth = Math.max(atr * 2.1, price * 0.006);
  const bollingerUpper = Number((movingAverage + bandWidth).toFixed(price < 10 ? 5 : 2));
  const bollingerLower = Number(Math.max(0, movingAverage - bandWidth).toFixed(price < 10 ? 5 : 2));
  const bidAskRatio = Number((1 + Math.sin(now / 17_000 + price) * 0.18 + momentum / 100).toFixed(3));
  const trend: MarketSnapshot['trend'] = momentum > 1.3 ? 'UP' : momentum < -1.3 ? 'DOWN' : 'FLAT';
  const recentChanges = [-1.2, 0.4, 1.1, -0.3, changePct].map((value, index) => Number((value + Math.sin((now / 70_000) + index + (phases[symbol] ?? 1)) * 0.25).toFixed(2)));
  const volume = Math.round((8_000_000 + Math.abs(Math.sin(now / 50_000 + (phases[symbol] ?? 1))) * 22_000_000) * (bases[symbol] > 200 ? 0.8 : 1.15));
  return { symbol, price, changePct, volume, volatility, trend, momentum, movingAverage, rsi, atr, macd, macdSignal, bollingerUpper, bollingerLower, bidAskRatio, recentChanges, timestamp: new Date(now).toISOString() };
}

export function getAllMarketSnapshots(now = Date.now()): MarketSnapshot[] {
  return SUPPORTED_SYMBOLS.map((symbol) => getMarketSnapshot(symbol, now));
}
