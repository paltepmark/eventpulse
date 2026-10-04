import { db } from '../db/database.js';
import { getLatestSnapshot, getPositions } from '../db/repositories.js';
import type { AgentDecision, RiskCheck, Trade } from '../types.js';
import { getMarketSnapshot } from './marketData.js';

export function executePaperOrder(decision: AgentDecision, risk: RiskCheck): Trade | undefined {
  if (decision.action === 'HOLD' || risk.status !== 'PASS') return undefined;
  const now = new Date().toISOString();
  const price = getMarketSnapshot(decision.symbol).price;
  const snapshot = getLatestSnapshot();
  const existing = (db.prepare('SELECT * FROM positions WHERE symbol = ?').get(decision.symbol) as { symbol: string; quantity: number; average_entry: number } | undefined);
  let quantity = 0;
  let realizedPnl = 0;
  let status: Trade['status'] = 'FILLED';
  if (decision.action === 'BUY') {
    const targetNotional = Math.min(snapshot.cash, snapshot.portfolioValue * decision.suggestedPositionPercent / 100);
    quantity = Math.floor(targetNotional / price);
    if (quantity < 1) { status = 'REJECTED'; }
    if (status === 'FILLED') {
      const notional = quantity * price;
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      const averageEntry = (((existing?.quantity ?? 0) * (existing?.average_entry ?? price)) + notional) / nextQuantity;
      db.prepare(`INSERT INTO positions (symbol, quantity, average_entry) VALUES (?, ?, ?) ON CONFLICT(symbol) DO UPDATE SET quantity = excluded.quantity, average_entry = excluded.average_entry`).run(decision.symbol, nextQuantity, averageEntry);
      updateSnapshot(snapshot.cash - notional);
    }
  } else {
    quantity = Math.min(existing?.quantity ?? 0, Math.max(1, Math.floor(snapshot.portfolioValue * Math.max(decision.suggestedPositionPercent, 5) / 100 / price)));
    if (!existing || quantity < 1) { status = 'REJECTED'; }
    if (status === 'FILLED' && existing) {
      const notional = quantity * price;
      realizedPnl = (price - existing.average_entry) * quantity;
      const remaining = existing.quantity - quantity;
      if (remaining <= 0) db.prepare('DELETE FROM positions WHERE symbol = ?').run(decision.symbol);
      else db.prepare('UPDATE positions SET quantity = ? WHERE symbol = ?').run(remaining, decision.symbol);
      updateSnapshot(snapshot.cash + notional, realizedPnl);
    }
  }
  const notional = quantity * price;
  const trade: Trade = { id: `ord-${Date.now()}`, decisionId: decision.id, symbol: decision.symbol, side: decision.action, quantity, price, notional, confidence: decision.confidence, riskScore: risk.riskScore, status, realizedPnl, timestamp: now };
  db.prepare('INSERT INTO orders (id, decision_id, symbol, side, quantity, price, notional, confidence, risk_score, status, realized_pnl, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(trade.id, trade.decisionId ?? null, trade.symbol, trade.side, trade.quantity, trade.price, trade.notional, trade.confidence, trade.riskScore, trade.status, trade.realizedPnl, trade.timestamp);
  if (status === 'FILLED') updateSnapshot(getLatestSnapshot().cash);
  return trade;
}

function updateSnapshot(cash: number, realizedDelta = 0): void {
  const positions = getPositions();
  const investedCapital = positions.reduce((sum, position) => sum + position.marketValue, 0);
  const unrealizedPnl = positions.reduce((sum, position) => sum + position.unrealizedPnl, 0);
  const value = cash + investedCapital;
  const previous = getLatestSnapshot();
  const peak = Math.max(100000, previous.portfolioValue);
  const drawdown = Math.max(0, ((peak - value) / peak) * 100);
  db.prepare(`INSERT INTO portfolio_snapshots (timestamp, portfolio_value, cash, invested_capital, realized_pnl, unrealized_pnl, exposure_pct, daily_pnl, drawdown) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(new Date().toISOString(), value, cash, investedCapital, previous.realizedPnl + realizedDelta, unrealizedPnl, value ? investedCapital / value * 100 : 0, value - 100000, drawdown);
}
