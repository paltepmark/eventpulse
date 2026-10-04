import { useEffect, useMemo, useState } from 'react';
import type { MarketSnapshot } from '../lib/api';
import { api } from '../lib/api';
import { historyWindow, LiveMarketGraph, type GraphPoint, type LiveGraphRange } from './LiveMarketGraph';

export function LiveTradingChart({ market, onTimeframeChange }: { market: MarketSnapshot[]; onTimeframeChange?: (timeframe: LiveGraphRange) => void }) {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [range, setRange] = useState<LiveGraphRange>('1H');
  const [points, setPoints] = useState<GraphPoint[]>([]);
  const [quote, setQuote] = useState<MarketSnapshot | null>(null);
  const [liveState, setLiveState] = useState<'CONNECTING' | 'LIVE' | 'STALE'>('CONNECTING');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const selected = useMemo(() => market.find((item) => item.symbol === selectedSymbol) ?? market[0], [market, selectedSymbol]);

  useEffect(() => {
    if (!selected) return;
    let mounted = true;
    const load = async () => {
      try {
        const [history, nextQuote] = await Promise.all([
          api<{ points: GraphPoint[] }>(`/api/market/${selected.symbol}/history?timeframe=${historyWindow[range]}`),
          api<MarketSnapshot>(`/api/market/${selected.symbol}/quote`),
        ]);
        if (!mounted) return;
        setPoints([...(history.points ?? []), { timestamp: nextQuote.timestamp, price: nextQuote.price, volume: nextQuote.volume }]);
        setQuote(nextQuote);
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
  }, [selected?.symbol, range]);

  if (!market.length || !selected) return null;
  const current = quote?.symbol === selected.symbol ? { ...selected, ...quote } : selected;
  const handleRange = (next: LiveGraphRange) => { setRange(next); onTimeframeChange?.(next); };
  return <section className="panel trading-chart-panel"><LiveMarketGraph symbol={current.symbol} symbols={market.map((item) => item.symbol)} points={points} quote={current} range={range} onRangeChange={handleRange} liveState={liveState} lastUpdated={lastUpdated} onSymbolChange={setSelectedSymbol} /></section>;
}
