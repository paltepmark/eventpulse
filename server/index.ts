import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { generateDemoEvent } from './engine/eventEngine.js';
import { executeApprovedDecision, runEventPipeline, agentStatus } from './engine/agentPipeline.js';
import { getAudit, getDecisions, getEvent, getEvents, getMarketData, getPerformance, getPortfolioSummary, getPositions, getTrades } from './db/repositories.js';
import { getMarketSnapshot } from './engine/marketData.js';
import { analyzeCryptoMarket, calculateCryptoRisk, isCryptoSymbol } from './engine/cryptoAnalyst.js';
import { getLiveHistory, getLiveMarketData, getLiveQuote } from './engine/liveMarketData.js';
import { closeDatabase } from './db/database.js';

const app = express();
const port = Number(process.env.PORT ?? 3001);
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'EventPulse AI', mode: 'DEMO', timestamp: new Date().toISOString() }));
app.get('/api/portfolio', (_req, res) => res.json(getPortfolioSummary()));
app.get('/api/positions', (_req, res) => res.json(getPositions()));
app.get('/api/trades', (_req, res) => res.json(getTrades()));
app.get('/api/events', async (_req, res) => res.json({ events: getEvents(), market: await getLiveMarketData() }));
app.get('/api/market/:symbol/history', async (req, res) => { const symbol = String(req.params.symbol ?? '').toUpperCase(); if (!getMarketData().some((item) => item.symbol === symbol)) return res.status(404).json({ error: 'Unsupported market symbol.' }); res.json(await getLiveHistory(symbol, String(req.query.timeframe ?? 'Max'))); });
app.get('/api/market/:symbol/quote', async (req, res) => { const symbol = String(req.params.symbol ?? '').toUpperCase(); if (!getMarketData().some((item) => item.symbol === symbol)) return res.status(404).json({ error: 'Unsupported market symbol.' }); res.json(await getLiveQuote(symbol)); });
app.get('/api/agent/status', (_req, res) => res.json(agentStatus));
app.get('/api/agent/decisions', (_req, res) => res.json(getDecisions()));
app.get('/api/performance', (_req, res) => res.json(getPerformance()));
app.get('/api/audit', (_req, res) => res.json(getAudit()));
app.post('/api/agent/start', (_req, res) => { agentStatus.active = true; agentStatus.updatedAt = new Date().toISOString(); res.json(agentStatus); });
app.post('/api/agent/pause', (_req, res) => { agentStatus.active = false; agentStatus.updatedAt = new Date().toISOString(); res.json(agentStatus); });
app.post('/api/agent/resume', (_req, res) => { agentStatus.active = true; agentStatus.updatedAt = new Date().toISOString(); res.json(agentStatus); });
app.post('/api/demo/event', async (req, res) => { if (!agentStatus.active) return res.status(409).json({ error: 'Agent is paused. Resume the agent before triggering a demo event.' }); const event = generateDemoEvent(); const result = await runEventPipeline(event, { execute: req.body?.execute !== false }); res.status(201).json(result); });
app.post('/api/agent/analyze', async (req, res) => { const event = getEvent(String(req.body?.eventId ?? '')); if (!event) return res.status(404).json({ error: 'Event not found.' }); const result = await runEventPipeline(event, { execute: req.body?.execute !== false }); res.status(201).json(result); });
app.post('/api/agent/execute', async (req, res) => { try { const decisionId = String(req.body?.decisionId ?? ''); if (!decisionId) return res.status(400).json({ error: 'decisionId is required.' }); const result = await executeApprovedDecision(decisionId); res.status(201).json(result); } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Paper execution failed.' }); } });
app.post('/api/trades/paper', (_req, res) => res.status(400).json({ error: 'Paper trades are created by the risk-controlled agent pipeline. Use /api/demo/event or /api/agent/analyze.' }));
app.post('/api/crypto/analyze', (req, res) => {
  const symbol = String(req.body?.symbol ?? 'BTC').toUpperCase();
  if (!isCryptoSymbol(symbol)) return res.status(400).json({ error: 'Unsupported crypto symbol. Use BTC, ETH, SOL, XRP, BNB, DOGE, ADA, AVAX, LINK, or SUI.' });
  const snapshot = getMarketSnapshot(symbol);
  res.json(analyzeCryptoMarket(snapshot, String(req.body?.timeframe ?? '15m')));
});
app.post('/api/crypto/risk', (req, res) => {
  const symbol = String(req.body?.symbol ?? 'BTC').toUpperCase();
  if (!isCryptoSymbol(symbol)) return res.status(400).json({ error: 'Unsupported crypto symbol.' });
  const snapshot = getMarketSnapshot(symbol);
  res.json(calculateCryptoRisk({ accountBalance: Number(req.body?.accountBalance ?? getPortfolioSummary().portfolioValue), entryPrice: Number(req.body?.entryPrice ?? snapshot.price), leverage: Number(req.body?.leverage ?? 5), signal: req.body?.signal ?? 'BUY', atr: Number(req.body?.atr ?? snapshot.atr), side: req.body?.side }));
});
app.post('/api/agent-trader/analyze', async (req, res) => {
  const symbol = String(req.body?.symbol ?? 'BTC').toUpperCase();
  if (!getMarketData().some((item) => item.symbol === symbol)) return res.status(400).json({ error: 'Unsupported asset.' });
  const timeframe = String(req.body?.timeframe ?? '15m');
  const live = await getLiveQuote(symbol);
  const bullish = [live.trend === 'UP', live.rsi >= 52, live.macd > live.macdSignal, live.price > live.movingAverage, live.bidAskRatio > 1.04].filter(Boolean).length;
  const bearish = [live.trend === 'DOWN', live.rsi <= 48, live.macd < live.macdSignal, live.price < live.movingAverage, live.bidAskRatio < 0.96].filter(Boolean).length;
  const action: 'BUY' | 'HOLD' | 'SELL' = bullish >= 4 && bullish > bearish + 1 ? 'BUY' : bearish >= 4 && bearish > bullish + 1 ? 'SELL' : 'HOLD';
  const confidence = Math.min(94, Math.max(51, Math.round(52 + Math.abs(bullish - bearish) * 9 + Math.abs(live.rsi - 50) * 0.3)));
  const riskPercent = Math.min(2, Math.max(0.25, Number(req.body?.riskPercent ?? 1)));
  const balance = Math.max(0, Number(req.body?.accountBalance ?? getPortfolioSummary().portfolioValue));
  const entry = live.price;
  const stopDistance = Math.max(live.atr * 1.8, entry * 0.003);
  const takeDistance = stopDistance * 2.5;
  const riskAmount = balance * riskPercent / 100;
  const positionSize = action === 'HOLD' ? 0 : Math.min(balance * 0.2, riskAmount / (stopDistance / entry));
  const stopLossPrice = action === 'SELL' ? entry + stopDistance : entry - stopDistance;
  const takeProfitPrice = action === 'SELL' ? entry - takeDistance : entry + takeDistance;
  const volatilityRatio = live.atr / Math.max(entry, 0.00000001);
  const highRisk = volatilityRatio > 0.06 || live.volatility >= 28;
  const approved = action !== 'HOLD' && !highRisk && positionSize > 0;
  const direction = action === 'BUY' ? 'bullish' : action === 'SELL' ? 'bearish' : 'mixed';
  const thesis = `${symbol} is showing a ${direction} setup on ${timeframe}. ${bullish}/5 bullish confirmations versus ${bearish}/5 bearish confirmations; RSI is ${live.rsi.toFixed(0)}, price is ${live.price >= live.movingAverage ? 'above' : 'below'} its moving average, and MACD is ${live.macd >= live.macdSignal ? 'above' : 'below'} signal.`;
  res.json({ symbol, action, confidence, price: entry, changePct: live.changePct, trend: live.trend, timeframe, thesis, riskLevel: highRisk ? 'HIGH' : action === 'HOLD' ? 'MEDIUM' : 'LOW', approved, riskWarning: highRisk ? 'Blocked: volatility is too high for this risk budget. Wait for confirmation or reduce exposure.' : action === 'HOLD' ? 'No directional edge. The agent will not force a trade.' : `Paper sizing uses ${riskPercent}% account risk with a 1:2.5 risk/reward target.`, positionSizeUsdt: Number(positionSize.toFixed(2)), stopLossPrice: Number(stopLossPrice.toFixed(entry < 10 ? 6 : 2)), takeProfitPrice: Number(takeProfitPrice.toFixed(entry < 10 ? 6 : 2)), riskAmountUsdt: Number(riskAmount.toFixed(2)), confirmations: [`Trend: ${live.trend}`, `RSI: ${live.rsi.toFixed(0)}`, `MACD: ${live.macd >= live.macdSignal ? 'above' : 'below'} signal`, `Price ${live.price >= live.movingAverage ? 'above' : 'below'} moving average`, `Volatility: ${live.volatility.toFixed(1)}%`], generatedAt: new Date().toISOString() });
});

const clientDir = path.resolve(process.cwd(), 'dist/client');
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.get('*', (req, res, next) => { if (req.path.startsWith('/api/')) return next(); res.sendFile(path.join(clientDir, 'index.html')); });
}

const server = app.listen(port, '0.0.0.0', () => console.log(`EventPulse AI listening on 0.0.0.0:${port}`));
process.on('SIGTERM', () => { server.close(() => { closeDatabase(); process.exit(0); }); });
