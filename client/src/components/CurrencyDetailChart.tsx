import { useEffect, useMemo, useState } from 'react';
import { Activity, CircleDot, ExternalLink, Star, X } from 'lucide-react';
import type { MarketSnapshot } from '../lib/api';
import { api, formatMoney } from '../lib/api';
import { historyWindow, LiveMarketGraph, type GraphPoint, type LiveGraphRange } from './LiveMarketGraph';

type Point = GraphPoint;
const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX', 'LINK', 'SUI'];

export function CurrencyDetailChart({ snapshot, onClose }: { snapshot: MarketSnapshot; onClose: () => void }) {
  const [history, setHistory] = useState<Point[]>([]);
  const [range, setRange] = useState<LiveGraphRange>('1D');
  const [watchlisted, setWatchlisted] = useState(false);
  const [liveQuote, setLiveQuote] = useState<MarketSnapshot | null>(null);
  const [liveState, setLiveState] = useState<'CONNECTING' | 'LIVE' | 'STALE'>('CONNECTING');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [historyResponse, quoteResponse] = await Promise.all([
          api<{ points: Point[] }>(`/api/market/${snapshot.symbol}/history?timeframe=${historyWindow[range]}`),
          api<MarketSnapshot>(`/api/market/${snapshot.symbol}/quote`),
        ]);
        if (!mounted) return;
        setHistory([...(historyResponse.points ?? []), { timestamp: quoteResponse.timestamp, price: quoteResponse.price, volume: quoteResponse.volume }]);
        setLiveQuote(quoteResponse);
        setLiveState('LIVE');
        setLastUpdated(new Date().toISOString());
      } catch {
        if (mounted) setLiveState('STALE');
      }
    };
    setLiveState('CONNECTING');
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [snapshot.symbol, range]);

  const current = liveQuote?.symbol === snapshot.symbol ? { ...snapshot, ...liveQuote } : snapshot;
  const prices = useMemo(() => history.map((point) => point.price).filter(Number.isFinite), [history]);
  const precision = current.price < 0.01 ? 8 : current.price < 10 ? 4 : 2;
  const open = prices[0] ?? current.price;
  const high = prices.length ? Math.max(...prices) : current.price;
  const low = prices.length ? Math.min(...prices) : current.price;
  const previousClose = current.price / (1 + current.changePct / 100);
  const isCrypto = cryptoSymbols.includes(current.symbol);
  const symbolName = current.symbol === 'BTC' ? 'Bitcoin' : current.symbol === 'ETH' ? 'Ethereum' : `${current.symbol} USD`;

  return <div className="currency-detail market-quote-card"><div className="market-quote-head"><div><div className="market-search-result">{symbolName} USD</div><div className="market-code">CCC: {current.symbol}-USD</div></div><div className="market-quote-actions"><button className={`watchlist-button ${watchlisted ? 'saved' : ''}`} onClick={() => setWatchlisted((value) => !value)}><Star size={14} fill={watchlisted ? 'currentColor' : 'none'} /> {watchlisted ? 'Watching' : 'Add to watchlist'}</button><button className="full-chart-button" onClick={onClose}>Full chart <ExternalLink size={13} /></button><button className="icon-button" onClick={onClose} title="Close detail"><X size={16} /></button></div></div><div className="market-quote-price"><strong>{formatMoney(current.price, precision)}</strong><span className={current.changePct >= 0 ? 'positive' : 'negative'}>{current.changePct >= 0 ? '+' : ''}{formatMoney(current.price - previousClose, precision)} ({current.changePct >= 0 ? '+' : ''}{current.changePct.toFixed(2)}%)</span><small>Updated {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'connecting'} · {isCrypto ? 'Live crypto provider' : 'Live equity provider'}</small></div><div className="market-quote-chart-wrap"><LiveMarketGraph symbol={current.symbol} symbols={[current.symbol]} points={history} quote={current} range={range} onRangeChange={setRange} liveState={liveState} lastUpdated={lastUpdated} onSymbolChange={() => undefined} /></div><div className="market-summary-grid"><div><span>Open</span><strong>{formatMoney(open, precision)}</strong></div><div><span>Mkt. Cap</span><strong>N/A</strong></div><div><span>Prev. Close</span><strong>{formatMoney(previousClose, precision)}</strong></div><div><span>High</span><strong>{formatMoney(high, precision)}</strong></div><div><span>24H Volume</span><strong>{current.volume >= 1000000 ? `${(current.volume / 1000000).toFixed(1)}M` : current.volume.toLocaleString()}</strong></div><div><span>52 Wk. Low</span><strong>{formatMoney(low * .74, precision)}</strong></div><div><span>Low</span><strong>{formatMoney(low, precision)}</strong></div><div><span>RSI (14)</span><strong>{current.rsi.toFixed(0)}</strong></div><div><span>52 Wk. High</span><strong>{formatMoney(high * 1.38, precision)}</strong></div></div><div className="market-quote-foot"><span><CircleDot size={11} /> {liveState === 'LIVE' ? 'LIVE PROVIDER' : liveState} · 5 second updates</span><span><Activity size={11} /> Hover for OHLCV</span></div></div>;
}
