# EventPulse AI Delivery TODO

## Product and deployment foundation

- [x] The project is named EventPulse AI everywhere: browser title, dashboard, navigation, README, Render service metadata, API documentation, demo guide, and project metadata.
- [x] The application is a production-buildable React + TypeScript + Vite frontend with Tailwind-compatible styling, Recharts, and Lucide React, backed by a Node.js + TypeScript + Express server.
- [x] The production server listens on `process.env.PORT`, binds to `0.0.0.0`, serves the built React frontend and API endpoints, and has no localhost-only dependency.
- [x] The project includes `render.yaml`, `.env.example`, `README.md`, a production Docker/runtime configuration, and automatic database initialization.
- [x] The project includes a valid `GET /manus-routes.json` manifest for all application pages and excludes APIs/assets/system endpoints.

## Agentic event-driven pipeline

- [x] The implemented pipeline is MARKET EVENT → EVENT NORMALIZER → MARKET CONTEXT → AI ANALYZER → TRADE PROPOSAL → RISK ENGINE → PAPER EXECUTION → PORTFOLIO UPDATE → PERFORMANCE → AUDIT TRAIL.
- [x] Demo mode works without external APIs and a `Trigger Demo Event` control generates an event and automatically starts the agent pipeline.
- [x] The live interface visibly progresses through EVENT DETECTED, AI ANALYZING, TRADE DECISION, RISK CHECK, PAPER ORDER, and MONITORING.
- [x] The event engine supports Earnings Surprise, Interest Rate Event, Inflation Event, Supply Chain Event, Regulatory Event, and Product Event for SPY, QQQ, NVDA, AAPL, MSFT, AMZN, TSLA, and AMD.
- [x] Each event stores an event ID, timestamp, title, description, source type, affected symbols, sentiment, estimated impact, and severity.

## AI decision engine

- [x] `decisionAgent.ts` accepts the event, symbol, current price, price trend, volatility, momentum, RSI, moving average, recent price changes, portfolio exposure, existing positions, event sentiment, and event severity.
- [x] The AI provider abstraction uses `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` when configured and uses a deterministic Demo AI provider when no API key exists.
- [x] The AI returns validated structured JSON containing symbol, action, confidence, eventImpact, timeHorizon, thesis, riskFactors, suggestedPositionPercent, stopLossPercent, and takeProfitPercent.
- [x] AI participation is meaningful to the decision process; the application does not expose hidden chain-of-thought and shows only concise rationale and risk factors.

## Independent risk engine

- [x] The deterministic risk engine enforces maximum single position 10%, maximum total exposure 60%, maximum single-trade portfolio loss 2%, maximum daily loss 5%, and minimum AI confidence 65%.
- [x] Every BUY requires a stop loss.
- [x] Malformed decisions, missing market data, inappropriate duplicate orders, and excessive exposure are rejected.
- [x] The engine calculates a 0–100 risk score and reports PASS or REJECTED with the exact reason.
- [x] The AI cannot bypass the risk engine.

## Paper trading and portfolio

- [x] Paper trading starts with a $100,000 portfolio and supports BUY, SELL, and HOLD.
- [x] The system tracks cash, positions, quantity, average entry, current price, unrealized P&L, realized P&L, portfolio value, exposure, win rate, maximum drawdown, and trade count.
- [x] Every trade generates an execution record with symbol, side, quantity, price, notional, confidence, risk score, and status.
- [x] The interface clearly labels PAPER TRADE and SIMULATED PERFORMANCE.
- [x] The market-data abstraction generates deterministic simulated prices and calculates price, change %, volume, volatility, trend, momentum, moving average, RSI, and recent price changes.
- [x] The interface clearly displays DEMO MODE — SIMULATED MARKET DATA and never presents simulated values as live exchange data.

## Dashboard and page experience

- [x] Navigation includes Dashboard, Agent, Events, Portfolio, Trades, Performance, Audit Log, and Settings.
- [x] The dashboard top bar shows EventPulse AI, AGENT ACTIVE status, and DEMO MODE.
- [x] Dashboard cards show Portfolio Value, Today's P&L, Exposure, Risk Level, Agent Decisions, and Trades Today.
- [x] The dashboard provides a real-time-looking event stream. Each event card shows event, symbol, time, sentiment, severity, and a working Analyze Event control; analyzing cards update to AI DECISION with action and confidence.
- [x] The Agent page shows EVENTPULSE AI AGENT, ACTIVE status, an animated EVENT DETECTED → CONTEXT ANALYSIS → AI DECISION → RISK CHECK → EXECUTION → MONITORING pipeline, and the current decision details.
- [x] The Portfolio page shows portfolio value, cash, invested capital, total/realized/unrealized P&L, exposure, position count, allocation chart, and symbol/quantity/average/current/P&L/P&L % for every position.
- [x] The Performance page shows portfolio equity curve, daily P&L, trade results, exposure, win/loss distribution, and metrics for total return, realized P&L, unrealized P&L, win rate, maximum drawdown, Sharpe-like ratio, number of trades, and average trade.
- [x] All performance results are clearly labeled SIMULATED / PAPER TRADING and do not invent historical results.
- [x] The Audit Log stores and visually timelines event, market context, AI analysis summary, decision, confidence, risk score, risk checks, order, execution, and portfolio result.
- [x] The Settings page shows demo/provider state, risk settings, safe API configuration visibility, and the safety disclaimer without exposing secrets.
- [x] The application includes a working 60-second Demo Guide that directs a judge through triggering an event, watching analysis, seeing decision/confidence/risk approval or rejection/paper execution, and opening Audit Log and Performance.
- [x] The interface is responsive, information-dense, professionally styled as a dark trading terminal, uses subtle animations, and has no fake AI chat, placeholder text, generic marketing hero, fake statistics, or nonfunctional visible controls.

## API and auditability

- [x] The API implements `GET /api/health`, `/api/portfolio`, `/api/positions`, `/api/trades`, `/api/events`, `/api/agent/status`, `/api/agent/decisions`, `/api/performance`, and `/api/audit`.
- [x] The API implements `POST /api/agent/start`, `/api/agent/pause`, `/api/agent/resume`, `/api/demo/event`, `/api/agent/analyze`, and `/api/trades/paper`.
- [x] The database stores events, market snapshots, agent decisions, risk checks, orders, positions, portfolio snapshots, and audit logs.
- [x] Database seed/init is automatic and includes the $100,000 demo portfolio.
- [x] Every decision creates an auditable event-to-execution record, including rejected risk checks.

## Safety and documentation

- [x] The application visibly states: EventPulse AI is a hackathon demonstration using paper trading and simulated market data unless otherwise indicated. It does not provide financial advice.
- [x] The application does not request private exchange credentials and never executes real-money trades by default.
- [x] README covers overview, problem, solution, agent architecture, AI decision engine, risk engine, paper trading, demo mode, audit trail, performance, tech stack, API, local development, Render deployment, Bitget AI Base Camp Hackathon S2, Track Agentic Trading, and sub-theme Event-Driven Agent.
- [x] The README does not claim awards, rankings, profits, or performance that have not been achieved.

## Validation evidence

- [x] `npm install` completes.
- [x] TypeScript checks complete without actionable diagnostics.
- [x] Production build completes.
- [x] The application starts and `/api/health` succeeds.
- [x] Demo event, AI decision, risk approval, risk rejection, paper execution, portfolio update, audit trail, performance charts, all buttons, and Render configuration are verified.
- [x] No TODOs remain in the implemented source and confirmed errors are fixed before delivery.
