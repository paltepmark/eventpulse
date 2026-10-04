import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Loader2, Search, ShieldCheck, Target, TrendingDown, TrendingUp } from 'lucide-react';
import type { MarketSnapshot } from '../lib/api';
import { api, formatMoney } from '../lib/api';

type TraderAnalysis = {
  symbol: string; action: 'BUY' | 'HOLD' | 'SELL'; confidence: number; price: number; changePct: number; trend: string; timeframe: string; thesis: string; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; approved: boolean; riskWarning: string; positionSizeUsdt: number; stopLossPrice: number; takeProfitPrice: number; riskAmountUsdt: number; confirmations: string[]; generatedAt: string;
};

export function AgentTrader({ market, accountBalance }: { market: MarketSnapshot[]; accountBalance: number }) {
  const [symbol, setSymbol] = useState(market.find((item) => item.symbol === 'BTC')?.symbol ?? market[0]?.symbol ?? 'BTC');
  const [query, setQuery] = useState('');
  const [timeframe, setTimeframe] = useState('15m');
  const [riskPercent, setRiskPercent] = useState('1');
  const [analysis, setAnalysis] = useState<TraderAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const filteredMarket = useMemo(() => market.filter((item) => item.symbol.toLowerCase().includes(query.trim().toLowerCase())), [market, query]);
  const selected = useMemo(() => market.find((item) => item.symbol === symbol), [market, symbol]);
  useEffect(() => {
    if (query.trim() && filteredMarket.length && !filteredMarket.some((item) => item.symbol === symbol)) {
      setSymbol(filteredMarket[0].symbol);
      setAnalysis(null);
    }
  }, [filteredMarket, query, symbol]);
  const runAnalysis = async () => {
    setBusy(true);
    try { setAnalysis(await api<TraderAnalysis>('/api/agent-trader/analyze', { method: 'POST', body: JSON.stringify({ symbol, timeframe, accountBalance, riskPercent: Number(riskPercent) }) })); }
    finally { setBusy(false); }
  };
  const priceDigits = (analysis?.price ?? selected?.price ?? 0) < 10 ? 4 : 2;
  return <section className="panel agent-trader-panel">
    <div className="agent-trader-header"><div><div className="panel-label"><Bot size={13} /> AGENT TRADER</div><h2>Should you buy, hold, or sell?</h2><p>Live market context, indicator confirmation, and an independent risk gate. Paper analysis only.</p></div><div className="agent-trader-live"><span /> LIVE ANALYSIS</div></div>
    <div className="agent-trader-controls"><label className="agent-trader-search">SEARCH ASSET<div className="agent-search-input"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="BTC, ETH, SOL..." aria-label="Search assets" /></div></label><label>ASSET<select value={symbol} onChange={(event) => { setSymbol(event.target.value); setAnalysis(null); }}>{filteredMarket.length ? filteredMarket.map((item) => <option key={item.symbol} value={item.symbol}>{item.symbol} / USDT</option>) : <option value={symbol}>{symbol} / USDT</option>}</select></label><label>TIMEFRAME<select value={timeframe} onChange={(event) => setTimeframe(event.target.value)}><option>5m</option><option>15m</option><option>1h</option><option>4h</option><option>1d</option></select></label><label>RISK / TRADE<select value={riskPercent} onChange={(event) => setRiskPercent(event.target.value)}><option value="0.5">0.5%</option><option value="1">1%</option><option value="2">2%</option></select></label><button className="primary-button" onClick={() => void runAnalysis()} disabled={busy || !selected}>{busy ? <><Loader2 size={15} className="spin" /> ANALYZING...</> : <><Bot size={15} /> ANALYZE ASSET</>}</button></div>
    {selected && <div className="agent-trader-snapshot"><div><span>MARKET PRICE</span><strong>{formatMoney(selected.price, selected.price < 10 ? 6 : 2)}</strong></div><div><span>24H CHANGE</span><strong className={selected.changePct >= 0 ? 'positive' : 'negative'}>{selected.changePct >= 0 ? '+' : ''}{selected.changePct.toFixed(2)}%</strong></div><div><span>TREND</span><strong>{selected.trend}</strong></div><div><span>RSI (14)</span><strong>{selected.rsi.toFixed(0)}</strong></div><div><span>ATR</span><strong>{formatMoney(selected.atr, selected.price < 10 ? 5 : 2)}</strong></div></div>}
    {!analysis ? <div className="agent-trader-empty"><Target size={25} /><div><strong>Select an asset to begin</strong><span>The agent checks trend, RSI, moving average, MACD, volatility, and risk/reward before making a recommendation.</span></div></div> : <div className="agent-trader-result"><div className={`agent-trader-action ${analysis.action.toLowerCase()}`}><div className="action-icon">{analysis.action === 'BUY' ? <TrendingUp size={27} /> : analysis.action === 'SELL' ? <TrendingDown size={27} /> : <Target size={27} />}</div><span>RECOMMENDATION</span><strong>{analysis.action}</strong><small>{analysis.confidence}% confidence · {analysis.timeframe}</small></div><div className="agent-trader-thesis"><div className="result-heading"><strong>{analysis.symbol} market read</strong><span className={`risk-chip ${analysis.riskLevel.toLowerCase()}`}>{analysis.riskLevel} RISK</span></div><p>{analysis.thesis}</p><div className="confirmation-list">{analysis.confirmations.map((item) => <span key={item}><CheckCircle2 size={13} /> {item}</span>)}</div></div><div className={`agent-trader-risk ${analysis.approved ? 'approved' : 'blocked'}`}><div className="result-heading"><strong><ShieldCheck size={15} /> RISK CONTROL</strong><span>{analysis.approved ? 'PASS' : 'BLOCKED'}</span></div><div className="risk-grid"><div><span>MAX SIZE</span><strong>{formatMoney(analysis.positionSizeUsdt, 2)}</strong></div><div><span>STOP LOSS</span><strong>{formatMoney(analysis.stopLossPrice, priceDigits)}</strong></div><div><span>TAKE PROFIT</span><strong>{formatMoney(analysis.takeProfitPrice, priceDigits)}</strong></div><div><span>RISK BUDGET</span><strong>{formatMoney(analysis.riskAmountUsdt, 2)}</strong></div></div><p>{analysis.riskWarning}</p></div></div>}
    <div className="agent-trader-disclaimer"><AlertTriangle size={13} /> Recommendation lamang ito, hindi financial advice. Walang real order na inilalagay; paper analysis lang.</div>
  </section>;
}
