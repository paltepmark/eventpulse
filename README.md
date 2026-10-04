# EventPulse AI

## Turn Market Events Into Intelligent Trading Decisions.

EventPulse AI is an autonomous event-driven trading agent built for the **Bitget AI Base Camp Hackathon S2**. It transforms normalized market events into explainable, risk-controlled **paper trades** through a visible agent workflow:

> **EVENT → AI ANALYSIS → TRADE DECISION → RISK CHECK → PAPER EXECUTION → PORTFOLIO MONITORING**

This is a hackathon demonstration. The default environment uses simulated market data and paper trading; it does not connect to an exchange or execute real-money trades.

## Problem

Event-driven trading is difficult to demonstrate responsibly. A news headline is not yet a trade, and an AI suggestion is not a sufficient control layer. A useful agent needs to normalize the event, assemble market context, make a structured decision, pass independent risk controls, execute through a bounded paper engine, and retain an audit trail.

## Solution

EventPulse AI makes that causal chain observable. The application includes a deterministic demo event engine, a market-data abstraction, an LLM provider abstraction with a no-key Demo AI fallback, an independent risk engine, paper order execution, portfolio monitoring, performance charts, and a stage-by-stage audit log.

## Agent Architecture

1. **Market Event** — demo earnings, macro, inflation, supply chain, regulation, or product signals.
2. **Event Normalizer** — IDs, timestamps, affected symbols, sentiment, impact, severity, and source type.
3. **Market Context** — deterministic price, change, volume, volatility, trend, momentum, moving average, RSI, and recent changes.
4. **AI Analyzer** — `server/agents/decisionAgent.ts` requests validated structured JSON from the active provider.
5. **Trade Proposal** — BUY, SELL, or HOLD with confidence, sizing, stop loss, take profit, thesis, and risk factors.
6. **Risk Engine** — independent controls calculate a 0–100 risk score and return PASS or REJECTED with exact reasons.
7. **Paper Execution** — approved BUY/SELL decisions create fills; HOLD decisions do not place orders.
8. **Portfolio Update** — cash, positions, P&L, exposure, drawdown, and snapshots update in SQLite.
9. **Audit Trail** — every event, context, decision, risk check, execution, and monitoring step is recorded.

The UI never exposes hidden chain-of-thought. It shows a concise thesis, rationale, and risk factors instead.

## AI Decision Engine

The input contract includes event sentiment and severity, symbol, current price, trend, volatility, momentum, RSI, moving average, recent price changes, portfolio exposure, and existing positions. The output is validated to contain:

```json
{
  "symbol": "NVDA",
  "action": "BUY",
  "confidence": 0.82,
  "eventImpact": "BULLISH",
  "timeHorizon": "1-5 days",
  "thesis": "Positive earnings guidance and strong momentum create a favorable short-term setup.",
  "riskFactors": ["Elevated volatility", "Market-wide risk-off movement"],
  "suggestedPositionPercent": 8,
  "stopLossPercent": 3,
  "takeProfitPercent": 6
}
```

When `AI_API_KEY` is absent, the deterministic Demo AI provider uses event sentiment, estimated impact, simulated momentum, volatility, and current portfolio exposure to produce a repeatable decision. If an OpenAI-compatible provider is configured, the server calls `AI_BASE_URL/chat/completions` with server-side credentials and falls back safely if the provider is unavailable.

## Independent Risk Engine

The AI cannot bypass `server/engine/riskEngine.ts`. The engine enforces:

| Control | Limit |
| --- | ---: |
| Maximum single position | 10% |
| Maximum total exposure | 60% |
| Maximum single-trade portfolio loss | 2% |
| Maximum daily loss | 5% |
| Minimum AI confidence | 65% |
| BUY requirement | Stop loss required |

It also rejects malformed decisions, missing market data, duplicate orders, and excessive exposure. The UI exposes the individual checks and exact rejection reason.

## Paper Trading and Demo Mode

The portfolio seeds with **$100,000** in cash. Supported actions are BUY, SELL, and HOLD. The engine tracks cash, quantity, average entry, current price, realized/unrealized P&L, portfolio value, exposure, win rate, drawdown, and trade count. Every filled or rejected paper order receives an execution record.

Click **Trigger Demo Event** from the dashboard. The interface shows event detection, context analysis, AI decision, risk evaluation, paper execution, and monitoring. The **Demo Guide** in the dashboard is designed for a 60-second judge walkthrough.

The application visibly labels:

- `DEMO MODE — SIMULATED MARKET DATA`
- `PAPER TRADING`
- `SIMULATED / PAPER TRADING`
- `EventPulse AI is a hackathon demonstration using paper trading and simulated market data unless otherwise indicated. It does not provide financial advice.`

## Audit Trail

Open **Audit Log** to inspect the event-to-execution timeline. Each record includes stage, title, detail, timestamp, status, and structured metadata. Rejected risk checks remain in the timeline so the demonstration shows both autonomy and accountability.

## Performance

The **Performance** page includes a simulated portfolio equity curve, exposure, win/loss distribution, total return, realized/unrealized P&L, win rate, maximum drawdown, a Sharpe-like illustrative ratio, number of trades, and average trade. The page explicitly states that results are simulated and does not invent historical results.

## Tech Stack

- React, TypeScript, Vite
- Custom dark terminal UI with Tailwind-compatible utility direction
- Recharts and Lucide React
- Node.js, TypeScript, Express
- SQLite via better-sqlite3
- Provider abstraction for deterministic Demo AI or OpenAI-compatible LLMs
- Render-ready Node service with a production Dockerfile

## API

### Read endpoints

- `GET /api/health`
- `GET /api/portfolio`
- `GET /api/positions`
- `GET /api/trades`
- `GET /api/events`
- `GET /api/agent/status`
- `GET /api/agent/decisions`
- `GET /api/performance`
- `GET /api/audit`

### Control endpoints

- `POST /api/agent/start`
- `POST /api/agent/pause`
- `POST /api/agent/resume`
- `POST /api/demo/event`
- `POST /api/agent/analyze` with `{ "eventId": "..." }`
- `POST /api/trades/paper` returns a safe guidance response because trades should be created through the risk-controlled pipeline

## Local Development

```bash
npm install
npm run dev
```

The Vite frontend runs on port `3000` and proxies `/api` to the Express server on port `3001` during development. For a production-style local run:

```bash
npm run build
PORT=3000 npm start
```

Open `http://localhost:3000`. Without an AI key, the Demo AI provider is active. To use an OpenAI-compatible provider, copy `.env.example` to `.env` and set `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`; credentials remain server-side.

Useful checks:

```bash
npm run typecheck
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/demo/event
```

## Render Deployment

This repository includes `render.yaml` and `Dockerfile`. The Render service:

1. installs dependencies,
2. runs the Vite + TypeScript production build,
3. starts the Express server,
4. serves the built frontend and API from one process,
5. uses `/api/health` as its health check.

The service listens on `process.env.PORT` and binds to `0.0.0.0`. Configure `AI_API_KEY` only if you want to use a live LLM provider; Demo AI requires no external API. `DATABASE_URL` defaults to `./data/eventpulse.db`.

For durable production persistence, attach a Render disk or replace the SQLite data layer with a managed database. The default application behavior remains paper-only.

## Hackathon Track

- **Event:** Bitget AI Base Camp Hackathon S2
- **Track:** Agentic Trading
- **Sub-theme:** Event-Driven Agent

EventPulse AI makes an agentic trading workflow visible without claiming awards, rankings, profits, or live performance.

## Expanded Cross-Asset Universe

The market-data abstraction now covers the requested cross-asset watchlist. US stocks/rTokens include **NVDA, MSFT, SPY, SNDK, AAPL, TSLA, AMZN, and GOOGL**, with QQQ and AMD retained for the existing semiconductor and index scenarios. Crypto assets include **BTC, ETH, SOL, XRP, BNB, DOGE, ADA, AVAX, LINK, and SUI**.

The dashboard includes a live-moving simulated trading graph with an asset selector. It updates every 1.8 seconds from deterministic simulated prices and is clearly labeled as demo data; it does not represent live exchange prices.

## Crypto Market Analyst and Risk API

The dashboard exposes paper-only crypto intelligence endpoints:

- `POST /api/crypto/analyze` with `{ "symbol": "BTC", "timeframe": "15m" }` returns JSON containing `market_condition`, `signal`, `confidence_score`, `reasoning`, `recommended_strategy`, and the calculated RSI, ATR, MACD, Bollinger Band, and bid/ask-ratio context.
- `POST /api/crypto/risk` with `{ "symbol": "BTC", "accountBalance": 100000, "entryPrice": 110000, "leverage": 5, "signal": "BUY" }` returns JSON containing approval, position size, dynamic ATR stop-loss/take-profit, risk/reward, liquidation buffer, and a warning when volatility is too high.

The sizing engine budgets 1% of account balance per trade, caps notional exposure at 20% of balance, caps leverage at 5x, rejects neutral or excessive-volatility setups, and never places a live exchange order.

## Live Currencies Tab

The Currencies tab is clickable: selecting a row opens a per-asset historical chart with one-second live quote ticks. The server reads public quote data from **CoinGecko** for crypto and **Yahoo Finance chart endpoints** for US/rToken symbols. If a public provider is unavailable or rate-limited, EventPulse preserves the interface with a clearly labeled deterministic fallback; the detail view shows `LIVE PROVIDER` or `FALLBACK DATA`.

The app remains read-only and paper-only. No live orders, exchange credentials, or account actions are enabled.

## Currency Chart Types

The clickable Currencies detail panel now supports two chart views:

- **Candlestick** — OHLC candles derived from each live history interval.
- **Line** — close-price line chart.

Both views use the selected asset's refreshed history and remain read-only.

## One-Second Live Chart Ticks

The selected currency chart now polls its single-symbol quote endpoint every second and appends a new live tick to the active chart. Public providers may return the same price across adjacent ticks when the market has not moved; those are preserved as real values rather than invented movement. The server keeps the read-only quote request scoped to the selected symbol and falls back visibly when a public provider is unavailable.

## Agentic Trading Flow

EventPulse is designed to demonstrate an autonomous event-driven loop rather than a decorative dashboard. A normalized market event enters the Event Parser, the AI analyzes sentiment, expected impact, confidence, and risks, and the Trading Agent produces an explicit **BUY / SELL / HOLD** decision. An independent Risk Management layer checks position size, exposure, existing positions, maximum allowed risk, stop-loss, and take-profit before any action. Approved decisions go to the Paper Trading Engine, then Portfolio Update and Trade Log persist the measurable result and full causal audit trail. Rejected decisions are also recorded with the reason.

The currency detail chart intentionally supports only **Candlestick** and **Line** views, both fed by the selected asset's live-tick history.

## Startup Experience

The project opens with a judge-friendly **Welcome to EventPulse AI** screen that explains the Agentic Trading track and the causal chain. No Sign In or Sign Up is required. The **Enter EventPulse AI** action opens the live control room directly so judges can trigger the demo pipeline immediately.
