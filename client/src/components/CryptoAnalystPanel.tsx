import { useMemo, useState } from 'react';
import { AlertTriangle, BrainCircuit, Check, ChevronDown, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import type { CryptoAnalysis, CryptoRisk, MarketSnapshot } from '../lib/api';
import { api, formatMoney } from '../lib/api';

const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'AVAX', 'LINK', 'SUI'];

export function CryptoAnalystPanel({ market, accountBalance }: { market: MarketSnapshot[]; accountBalance: number }) {
  const [symbol, setSymbol] = useState('BTC');
  const [timeframe, setTimeframe] = useState('15m');
  const [leverage, setLeverage] = useState('5');
  const [analysis, setAnalysis] = useState<CryptoAnalysis | null>(null);
  const [risk, setRisk] = useState<CryptoRisk | null>(null);
  const [busy, setBusy] = useState(false);
  const snapshot = useMemo(() => market.find((item) => item.symbol === symbol), [market, symbol]);
  const run = async () => {
    setBusy(true);
    try {
      const nextAnalysis = await api<CryptoAnalysis>('/api/crypto/analyze', { method: 'POST', body: JSON.stringify({ symbol, timeframe }) });
      setAnalysis(nextAnalysis);
      const nextRisk = await api<CryptoRisk>('/api/crypto/risk', { method: 'POST', body: JSON.stringify({ symbol, signal: nextAnalysis.signal, leverage: Number(leverage), accountBalance, entryPrice: snapshot?.price, atr: nextAnalysis.indicators.atr }) });
      setRisk(nextRisk);
    } finally { setBusy(false); }
  };
  const signalClass = analysis?.signal.toLowerCase().replace('_', '-') ?? '';
  return <section className="panel crypto-analyst-panel">
    <div className="crypto-panel-header"><div><div className="panel-label"><BrainCircuit size={12} /> CRYPTO MARKET ANALYST</div><h3>Signal + risk workspace <span className="ai-badge"><Sparkles size={11} /> JSON OUTPUT</span></h3></div><div className="crypto-controls"><label className="symbol-select"><select value={symbol} onChange={(event) => setSymbol(event.target.value)}>{cryptoSymbols.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label><label className="symbol-select"><select value={timeframe} onChange={(event) => setTimeframe(event.target.value)}><option>5m</option><option>15m</option><option>1h</option><option>4h</option></select><ChevronDown size={14} /></label><button className="secondary-button analyst-run" onClick={() => void run()} disabled={busy}><Sparkles size={13} /> {busy ? 'ANALYZING' : 'RUN ANALYSIS'}</button></div></div>
    <div className="crypto-panel-body"><div className="crypto-input-strip">{[['Price', snapshot ? formatMoney(snapshot.price, snapshot.price < 10 ? 4 : 2) : '—'], ['RSI', snapshot?.rsi.toFixed(0) ?? '—'], ['MACD', snapshot?.macd.toFixed(3) ?? '—'], ['Bid / Ask', snapshot?.bidAskRatio.toFixed(2) ?? '—'], ['ATR', snapshot?.atr.toFixed(snapshot && snapshot.price < 10 ? 5 : 2) ?? '—']].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>{analysis ? <div className="crypto-output-grid"><div className="crypto-signal-card"><div className="signal-top"><span className={`signal-pill ${signalClass}`}>{analysis.signal}</span><span className="confidence-score">{analysis.confidence_score}% confidence</span></div><h4>{analysis.symbol} · {analysis.market_condition.replaceAll('_', ' ')}</h4><p>{analysis.reasoning}</p><div className="strategy-row"><span>Recommended strategy</span><strong>{analysis.recommended_strategy.replaceAll('_', ' ')}</strong></div><div className="indicator-confirmations"><span><Check size={12} /> RSI</span><span><Check size={12} /> MACD</span><span><Check size={12} /> MA</span><span><Check size={12} /> Order book</span></div></div>{risk && <div className={`crypto-risk-card ${risk.approved ? 'approved' : 'blocked'}`}><div className="signal-top"><span className="risk-title"><ShieldCheck size={15} /> QUANT RISK SIZING</span><span className={`status-badge ${risk.approved ? 'pass' : 'rejected'}`}>{risk.approved ? 'APPROVED' : 'BLOCKED'}</span></div><div className="risk-number-grid"><div><span>Size</span><strong>{formatMoney(risk.position_size_usdt, 2)}</strong></div><div><span>Leverage</span><strong>{risk.leverage}x</strong></div><div><span>SL</span><strong>{risk.stop_loss_price}</strong></div><div><span>TP</span><strong>{risk.take_profit_price}</strong></div></div><p>{risk.risk_warning}</p><small>Risk budget {formatMoney(risk.risk_amount_usdt, 2)} · Liquidation buffer {risk.liquidation_buffer_percent}% · R:R {risk.risk_reward_ratio}</small></div>}</div> : <div className="crypto-empty"><TrendingUp size={18} /><div><strong>Evaluate a crypto pair</strong><span>Uses RSI, ATR, MACD, Bollinger Bands, moving averages, volume, and simulated bid/ask imbalance. No live orders are placed.</span></div><button className="primary-button" onClick={() => void run()} disabled={busy}><Sparkles size={14} /> RUN CRYPTO ANALYST</button></div>}</div><div className="crypto-panel-footer"><AlertTriangle size={13} /> Paper-only quantitative sizing. Leverage is capped at 5x and every output is simulated.</div>
  </section>;
}
