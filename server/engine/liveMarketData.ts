import { getAllMarketSnapshots, getMarketSnapshot, SUPPORTED_SYMBOLS } from './marketData.js';
import type { MarketSnapshot } from '../types.js';

const cryptoIds: Record<string, string> = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XRP: 'ripple', BNB: 'binancecoin', DOGE: 'dogecoin', ADA: 'cardano', AVAX: 'avalanche-2', LINK: 'chainlink', SUI: 'sui', TRX: 'tron', TON: 'the-open-network', DOT: 'polkadot', LTC: 'litecoin', BCH: 'bitcoin-cash', UNI: 'uniswap', NEAR: 'near', ATOM: 'cosmos', XLM: 'stellar', SHIB: 'shiba-inu', PEPE: 'pepe', APT: 'aptos', ARB: 'arbitrum', OP: 'optimism', FIL: 'filecoin', ICP: 'internet-computer', ETC: 'ethereum-classic', HBAR: 'hedera-hashgraph', ALGO: 'algorand', AAVE: 'aave', MKR: 'maker', CRO: 'crypto-com-com', INJ: 'injective-protocol', RUNE: 'thorchain', SEI: 'sei-network', TIA: 'celestia' };
const cmcSlugs: Record<string, string> = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', XRP: 'xrp', BNB: 'bnb', DOGE: 'dogecoin', ADA: 'cardano', AVAX: 'avalanche', LINK: 'chainlink', SUI: 'sui', TRX: 'tron', TON: 'toncoin', DOT: 'polkadot', LTC: 'litecoin', BCH: 'bitcoin-cash', UNI: 'uniswap', NEAR: 'near-protocol', ATOM: 'cosmos', XLM: 'stellar', SHIB: 'shiba-inu', PEPE: 'pepe', APT: 'aptos', ARB: 'arbitrum', OP: 'optimism', FIL: 'filecoin', ICP: 'internet-computer', ETC: 'ethereum-classic', HBAR: 'hedera', ALGO: 'algorand', AAVE: 'aave', MKR: 'maker', CRO: 'crypto-com-chain', INJ: 'injective', RUNE: 'thorchain', SEI: 'sei', TIA: 'celestia' };
const cache = new Map<string, { expires: number; value: MarketSnapshot }>();
const historyCache = new Map<string, { expires: number; value: MarketHistoryPoint[] }>();
const quoteCache = new Map<string, { expires: number; value: MarketSnapshot }>();
const cmcCache = new Map<string, { expires: number; value: MarketSnapshot }>();
const TTL = 30_000;
const QUOTE_TTL = 1_000;
export type HistoryTimeframe = '24H' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'Max';
export type ChartTimeframe = '1M' | '5M' | '15M' | '1H' | '1D' | '1W';
export interface MarketHistoryPoint { timestamp: string; price: number; open?: number; high?: number; low?: number; close?: number; volume?: number; }
const normalizeTimeframe = (value?: string): HistoryTimeframe => ['24H', '7D', '1M', '3M', 'YTD', '1Y', 'Max'].includes(value ?? '') ? value as HistoryTimeframe : 'Max';
const cryptoRange = (timeframe: HistoryTimeframe) => timeframe === '24H' ? { days: '1', interval: 'hourly' } : timeframe === '7D' ? { days: '7', interval: 'hourly' } : timeframe === '1M' ? { days: '30', interval: 'hourly' } : timeframe === '3M' ? { days: '90', interval: 'daily' } : timeframe === '1Y' || timeframe === 'YTD' ? { days: '365', interval: 'daily' } : { days: 'max', interval: 'daily' };
const equityRange = (timeframe: HistoryTimeframe) => timeframe === '24H' ? { range: '1d', interval: '5m' } : timeframe === '7D' ? { range: '5d', interval: '30m' } : timeframe === '1M' ? { range: '1mo', interval: '1h' } : timeframe === '3M' ? { range: '3mo', interval: '1d' } : timeframe === '1Y' ? { range: '1y', interval: '1d' } : timeframe === 'YTD' ? { range: 'ytd', interval: '1d' } : { range: 'max', interval: '1d' };
const chartConfig: Record<ChartTimeframe, { range: string; interval: string; bitgetGranularity: string; limit: number }> = {
  '1M': { range: '1d', interval: '1m', bitgetGranularity: '1m', limit: 720 }, '5M': { range: '1d', interval: '5m', bitgetGranularity: '5m', limit: 288 },
  '15M': { range: '5d', interval: '15m', bitgetGranularity: '15m', limit: 480 }, '1H': { range: '1mo', interval: '1h', bitgetGranularity: '1H', limit: 720 },
  '1D': { range: '1y', interval: '1d', bitgetGranularity: '1D', limit: 365 }, '1W': { range: '5y', interval: '1wk', bitgetGranularity: '1W', limit: 260 },
};
const isChartTimeframe = (value: string): value is ChartTimeframe => value in chartConfig;

async function fetchJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try { const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'EventPulseAI/1.0' }, signal: controller.signal }); if (!response.ok) throw new Error(`provider ${response.status}`); return await response.json(); } finally { clearTimeout(timer); }
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try { const response = await fetch(url, { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 EventPulseAI/1.0' }, signal: controller.signal }); if (!response.ok) throw new Error(`provider ${response.status}`); return await response.text(); } finally { clearTimeout(timer); }
}

async function fetchCmcQuote(symbol: string): Promise<MarketSnapshot> {
  const slug = cmcSlugs[symbol];
  if (!slug) throw new Error('unsupported CoinMarketCap slug');
  const cached = cmcCache.get(symbol);
  if (cached && cached.expires > Date.now()) return cached.value;
  const html = await fetchText(`https://coinmarketcap.com/currencies/${slug}/`);
  const prices = [...html.matchAll(/"price":([0-9]+(?:\.[0-9]+)?)/g)].map((match) => Number(match[1])).filter((price) => Number.isFinite(price) && price > 0);
  const price = prices[0];
  if (!price) throw new Error('missing CoinMarketCap price');
  const snapshot = getMarketSnapshot(symbol);
  const value = liveSnapshot(symbol, price, snapshot.changePct, snapshot.volume);
  cmcCache.set(symbol, { expires: Date.now() + TTL, value });
  return value;
}

function liveSnapshot(symbol: string, price: number, changePct: number, volume: number): MarketSnapshot {
  const snapshot = getMarketSnapshot(symbol);
  const precision = price < 0.01 ? 10 : price < 10 ? 6 : 2;
  const movingAverage = Number((price / (1 + (snapshot.price - snapshot.movingAverage) / Math.max(snapshot.price, 1) * 0.45)).toFixed(precision));
  const atr = Number((price * snapshot.volatility / 100 * 0.36).toFixed(precision));
  const macd = Number((snapshot.momentum * 0.08 + (price - movingAverage) / Math.max(price, 1) * 100).toFixed(4));
  const macdSignal = Number((macd * 0.72).toFixed(4));
  const bandWidth = Math.max(atr * 2.1, price * 0.006);
  return { ...snapshot, price: Number(price.toFixed(precision)), changePct: Number(changePct.toFixed(2)), volume: Math.round(volume || snapshot.volume), movingAverage, atr, macd, macdSignal, bollingerUpper: Number((movingAverage + bandWidth).toFixed(precision)), bollingerLower: Number(Math.max(0, movingAverage - bandWidth).toFixed(precision)), timestamp: new Date().toISOString() };
}

async function fetchCryptoQuotes(): Promise<Map<string, MarketSnapshot>> {
  const symbols = Object.keys(cryptoIds);
  const ids = symbols.map((symbol) => cryptoIds[symbol]).join(',');
  const rows = await fetchJson(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`);
  return new Map<string, MarketSnapshot>(rows.map((row: any) => { const symbol = symbols.find((key) => cryptoIds[key] === row.id) ?? String(row.symbol).toUpperCase(); return [symbol, liveSnapshot(symbol, Number(row.current_price), Number(row.price_change_percentage_24h ?? 0), Number(row.total_volume ?? 0))] as [string, MarketSnapshot]; }));
}

async function fetchYahooQuote(symbol: string): Promise<MarketSnapshot> {
  const payload = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`);
  const result = payload.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta?.regularMarketPrice) throw new Error('missing quote');
  return liveSnapshot(symbol, Number(meta.regularMarketPrice), Number(meta.regularMarketChangePercent ?? 0), Number(meta.regularMarketVolume ?? 0));
}

async function fetchBitgetQuote(symbol: string): Promise<MarketSnapshot> {
  const payload = await fetchJson(`https://api.bitget.com/api/v2/mix/market/ticker?symbol=${symbol}USDT&productType=USDT-FUTURES`);
  const row = payload.data?.[0];
  if (payload.code !== '00000' || !row?.lastPr) throw new Error(`Bitget quote ${payload.code ?? 'empty'}`);
  return liveSnapshot(symbol, Number(row.lastPr), Number(row.changeUtc24h ?? row.change24h ?? 0) * 100, Number(row.quoteVolume ?? row.baseVolume ?? 0));
}

export async function getLiveMarketData(): Promise<MarketSnapshot[]> {
  const fallback = getAllMarketSnapshots();
  const now = Date.now();
  const values = new Map<string, MarketSnapshot>(fallback.map((item): [string, MarketSnapshot] => [item.symbol, item]));
  try { const cryptoQuotes = await fetchCryptoQuotes(); cryptoQuotes.forEach((value, symbol) => values.set(symbol, value)); } catch { await Promise.all(Object.keys(cmcSlugs).map(async (symbol) => { try { values.set(symbol, await fetchCmcQuote(symbol)); } catch { /* retain fallback for provider availability */ } })); }
  await Promise.all(SUPPORTED_SYMBOLS.filter((symbol) => !cryptoIds[symbol]).map(async (symbol) => { const cached = cache.get(symbol); if (cached && cached.expires > now) { values.set(symbol, cached.value); return; } try { const value = await fetchYahooQuote(symbol); cache.set(symbol, { expires: now + TTL, value }); values.set(symbol, value); } catch { /* retain fallback */ } }));
  return SUPPORTED_SYMBOLS.map((symbol) => values.get(symbol) ?? getMarketSnapshot(symbol));
}

export async function getLiveQuote(symbol: string): Promise<MarketSnapshot> {
  const normalized = symbol.toUpperCase();
  const cached = quoteCache.get(normalized);
  if (cached && cached.expires > Date.now()) return cached.value;
  try {
    const value = cryptoIds[normalized] ? await fetchBitgetQuote(normalized) : await fetchYahooQuote(normalized);
    if (value) { quoteCache.set(normalized, { expires: Date.now() + QUOTE_TTL, value }); return value; }
  } catch { /* use deterministic fallback when the public provider is unavailable */ }
  const fallback = getMarketSnapshot(normalized);
  quoteCache.set(normalized, { expires: Date.now() + QUOTE_TTL, value: fallback });
  return fallback;
}

export async function getLiveHistory(symbol: string, requestedTimeframe = 'Max'): Promise<{ points: MarketHistoryPoint[]; source: 'LIVE' | 'SIMULATED_FALLBACK' }> {
  const normalized = symbol.toUpperCase();
  if (isChartTimeframe(requestedTimeframe)) return getChartHistory(normalized, requestedTimeframe);
  const timeframe = normalizeTimeframe(requestedTimeframe);
  const cacheKey = `${normalized}:${timeframe}`;
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return { points: cached.value, source: 'LIVE' };
  try {
    let points: MarketHistoryPoint[];
    if (cryptoIds[normalized]) {
      const range = cryptoRange(timeframe);
      const payload = await fetchJson(`https://api.coingecko.com/api/v3/coins/${cryptoIds[normalized]}/market_chart?vs_currency=usd&days=${range.days}&interval=${range.interval}`);
      points = (payload.prices ?? []).map((row: [number, number], index: number) => ({ timestamp: new Date(row[0]).toISOString(), price: Number(row[1]), close: Number(row[1]), volume: Number(payload.total_volumes?.[index]?.[1] ?? 0) }));
    } else {
      const range = equityRange(timeframe);
      const payload = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}?range=${range.range}&interval=${range.interval}`);
      const result = payload.chart?.result?.[0];
      const quote = result?.indicators?.quote?.[0] ?? {};
      points = (result?.timestamp ?? []).map((timestamp: number, index: number) => ({ timestamp: new Date(timestamp * 1000).toISOString(), price: Number(quote.close?.[index] ?? 0), open: Number(quote.open?.[index] ?? 0), high: Number(quote.high?.[index] ?? 0), low: Number(quote.low?.[index] ?? 0), close: Number(quote.close?.[index] ?? 0), volume: Number(quote.volume?.[index] ?? 0) })).filter((point: MarketHistoryPoint) => point.price > 0);
    }
    historyCache.set(cacheKey, { expires: Date.now() + TTL, value: points });
    return { points, source: 'LIVE' };
  } catch {
    const base = getMarketSnapshot(normalized).price;
    const hours = timeframe === '24H' ? 24 : timeframe === '7D' ? 168 : timeframe === '1M' ? 720 : timeframe === '3M' ? 2160 : timeframe === '1Y' || timeframe === 'YTD' ? 8760 : 43800;
    const step = timeframe === '1Y' || timeframe === 'YTD' || timeframe === 'Max' ? 24 : 1;
    const count = Math.min(720, Math.ceil(hours / step));
    const points = Array.from({ length: count }, (_, index) => ({ timestamp: new Date(Date.now() - (count - 1 - index) * step * 60 * 60_000).toISOString(), price: Number((base * (1 + Math.sin(index / 6) * 0.006)).toFixed(normalized.length > 3 ? 2 : 6)) }));
    return { points, source: 'SIMULATED_FALLBACK' };
  }
}

async function getChartHistory(symbol: string, timeframe: ChartTimeframe): Promise<{ points: MarketHistoryPoint[]; source: 'LIVE' | 'SIMULATED_FALLBACK' }> {
  const cacheKey = `chart:${symbol}:${timeframe}`;
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return { points: cached.value, source: 'LIVE' };
  try {
    const config = chartConfig[timeframe];
    let points: MarketHistoryPoint[];
    if (cryptoIds[symbol]) {
      const payload = await fetchJson(`https://api.bitget.com/api/v2/mix/market/candles?symbol=${symbol}USDT&productType=USDT-FUTURES&granularity=${config.bitgetGranularity}&limit=${config.limit}`);
      if (payload.code !== '00000') throw new Error(`Bitget provider ${payload.code}`);
      points = (payload.data ?? []).map((row: string[]) => ({ timestamp: new Date(Number(row[0])).toISOString(), price: Number(row[4]), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) })).filter((point: MarketHistoryPoint) => point.price > 0).sort((a: MarketHistoryPoint, b: MarketHistoryPoint) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    } else {
      const payload = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${config.range}&interval=${config.interval}`);
      const result = payload.chart?.result?.[0];
      const quote = result?.indicators?.quote?.[0] ?? {};
      points = (result?.timestamp ?? []).map((timestamp: number, index: number) => ({ timestamp: new Date(timestamp * 1000).toISOString(), price: Number(quote.close?.[index] ?? 0), open: Number(quote.open?.[index] ?? 0), high: Number(quote.high?.[index] ?? 0), low: Number(quote.low?.[index] ?? 0), close: Number(quote.close?.[index] ?? 0), volume: Number(quote.volume?.[index] ?? 0) })).filter((point: MarketHistoryPoint) => point.price > 0);
    }
    if (!points.length) throw new Error('empty chart history');
    historyCache.set(cacheKey, { expires: Date.now() + TTL, value: points });
    return { points, source: 'LIVE' };
  } catch {
    return getLiveHistory(symbol, timeframe === '1D' || timeframe === '1W' ? '7D' : '24H');
  }
}
