import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const configured = process.env.DATABASE_URL?.replace(/^file:/, '');
const databasePath = configured
  ? path.resolve(process.cwd(), configured)
  : path.resolve(process.cwd(), 'data/eventpulse.db');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
    source_type TEXT NOT NULL, affected_symbols TEXT NOT NULL, sentiment TEXT NOT NULL,
    estimated_impact REAL NOT NULL, severity TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS market_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT, symbol TEXT NOT NULL, timestamp TEXT NOT NULL,
    price REAL NOT NULL, change_pct REAL NOT NULL, volume REAL NOT NULL, volatility REAL NOT NULL,
    trend TEXT NOT NULL, momentum REAL NOT NULL, moving_average REAL NOT NULL, rsi REAL NOT NULL,
    recent_changes TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS agent_decisions (
    id TEXT PRIMARY KEY, event_id TEXT NOT NULL, symbol TEXT NOT NULL, action TEXT NOT NULL,
    confidence REAL NOT NULL, event_impact TEXT NOT NULL, time_horizon TEXT NOT NULL,
    thesis TEXT NOT NULL, risk_factors TEXT NOT NULL, suggested_position_percent REAL NOT NULL,
    stop_loss_percent REAL NOT NULL, take_profit_percent REAL NOT NULL, rationale TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS risk_checks (
    id TEXT PRIMARY KEY, decision_id TEXT, status TEXT NOT NULL, risk_score REAL NOT NULL,
    reasons TEXT NOT NULL, checks TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, decision_id TEXT, symbol TEXT NOT NULL, side TEXT NOT NULL,
    quantity REAL NOT NULL, price REAL NOT NULL, notional REAL NOT NULL, confidence REAL NOT NULL,
    risk_score REAL NOT NULL, status TEXT NOT NULL, realized_pnl REAL NOT NULL, timestamp TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS positions (
    symbol TEXT PRIMARY KEY, quantity REAL NOT NULL, average_entry REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL, portfolio_value REAL NOT NULL,
    cash REAL NOT NULL, invested_capital REAL NOT NULL, realized_pnl REAL NOT NULL,
    unrealized_pnl REAL NOT NULL, exposure_pct REAL NOT NULL, daily_pnl REAL NOT NULL,
    drawdown REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY, event_id TEXT, stage TEXT NOT NULL, title TEXT NOT NULL,
    detail TEXT NOT NULL, status TEXT NOT NULL, metadata TEXT, timestamp TEXT NOT NULL
  );
`);

const seedCount = (db.prepare('SELECT COUNT(*) as count FROM portfolio_snapshots').get() as { count: number }).count;
if (seedCount === 0) {
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO portfolio_snapshots
    (timestamp, portfolio_value, cash, invested_capital, realized_pnl, unrealized_pnl, exposure_pct, daily_pnl, drawdown)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(now, 100000, 100000, 0, 0, 0, 0, 0, 0);
}

export function closeDatabase(): void {
  db.close();
}
