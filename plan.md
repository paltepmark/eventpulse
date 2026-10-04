# EventPulse AI — Implementation Plan

## Saklaw at pangunahing desisyon

Gagawin ang EventPulse AI bilang isang responsive, dark event-intelligence dashboard na nakabatay sa ibinigay na EventDash reference. Ang application ay educational paper-trading workspace lamang: lahat ng market data, events, analysis, at trades ay simulated at walang real-money execution.

Gagamitin ang **Manus OAuth** para sa real account sign in at sign up dahil ito ang default authentication provider ng WebDev starter at nagse-save ng authenticated user sa `users` table. Gagamitin ang managed MySQL database at Drizzle migrations para sa account-linked portfolio, positions, trades, risk settings, at agent activity.

## Design direction

- **Design Movement:** Dark operational dashboard / Bloomberg-terminal precision na pinalambot ng editorial fintech polish.
- **Core Principles:** high information density without clutter; visible system trust and safety; hierarchy through contrast and spacing; every action has an explicit simulated state.
- **Color Philosophy:** near-black navy surfaces create a focused monitoring room; electric cyan is the ownable signal color for active intelligence; mint/green indicates healthy simulated outcomes; amber and coral reserve urgency for risk and warnings.
- **Layout Paradigm:** fixed utility rail plus asymmetric two-column workspace; the main market narrative occupies the left, while agent/risk instrumentation remains visible in a right rail.
- **Signature Elements:** cyan pulse-line logo mark; thin telemetry dividers and scanline accents; compact uppercase labels with luminous status dots.
- **Interaction Philosophy:** every control gives immediate, local feedback (selected navigation, feed refresh, trade ticket update, risk validation) and avoids pretending that simulated actions are live orders.
- **Animation:** subtle pulse for active agents and status dots, gentle chart line reveal, short slide/fade for cards and toast feedback; no distracting or high-frequency motion.
- **Typography System:** `Space Grotesk` for headlines and primary numbers, `IBM Plex Mono` for telemetry labels, timestamps, prices, and risk values. Use generous display weight and compact mono metadata.
- **Brand Essence:** “A calm command center for understanding event-driven markets without real-money risk.” Personality: precise, assured, transparent.
- **Brand Voice:** headlines are concise and operational; CTAs say exactly what happens. Examples: “Review the signal before the simulated order.” and “Your workspace is synced to this account.”
- **Wordmark & Logo:** `EventPulse AI` wordmark with a small three-segment pulse glyph that reads as both a market sparkline and an agent heartbeat.
- **Signature Brand Color:** electric cyan `#27E2D0` used only for active intelligence, selected controls, and key positive telemetry.

## Product behavior

1. Logged-out visitors see a focused landing/auth state with the EventPulse value proposition, the educational disclaimer, and a clear **Sign in / Create account** CTA that starts Manus OAuth. No fake demo user is shown as authenticated.
2. Authenticated users land in the dashboard with their display name, persisted portfolio snapshot, event feed, paper positions, risk settings, and agent activity.
3. The dashboard includes navigation for Dashboard, Market Events, AI Analysis, Trading Agent, Paper Portfolio, Trade History, Analytics, Risk Center, and Settings. Navigation switches the visible workspace section without losing the dashboard shell.
4. Market events use seeded simulated data and expose impact, category, timing, movement, AI signal, confidence, and an actionable detail/trade view.
5. A simulated trade ticket lets the user choose an event signal, quantity, and side, shows a review state, validates against persisted risk limits, and records an approved simulated trade and position. It never calls a real broker or payment endpoint.
6. Portfolio metrics show current equity, today’s P&L, total return, win rate, exposure, open positions, and recent paper-trading activity. Reset demo resets only the authenticated user’s simulated workspace through an explicit UI action.
7. Risk Center exposes configurable position limit, daily loss limit, and volatility threshold, shows PASS/WATCH/BLOCK states, and persists changes to the authenticated user.
8. Agent Activity shows timestamped observations, analysis confidence, simulated decisions, and actions; new demo activity can be refreshed without claiming live market data.
9. All persistent data is scoped by the authenticated `users.id` through Drizzle queries and protected tRPC procedures. The existing OAuth session cookie remains `webdev_app_session` with cross-site Preview-safe `SameSite=None; Secure` handling.

## Project structure

- `client/src/pages/Home.tsx`: logged-out auth state and authenticated EventPulse shell/dashboard.
- `client/src/index.css`: dark theme tokens, typography, layout utilities, cards, charts, and responsive behavior.
- `client/src/App.tsx`: app routing and dark theme default.
- `client/src/_core/hooks/useAuth.ts`: existing Manus OAuth session hook, reused without fake auth bypasses.
- `drizzle/schema.ts`: users plus account-scoped portfolio, positions, trades, risk settings, and agent activity tables.
- `drizzle/*.sql`: additive migration for the new application tables.
- `server/db.ts`: typed database queries, upserts, user workspace initialization, and user-scoped mutations.
- `server/routers.ts`: protected tRPC procedures for workspace reads, simulated trades, risk settings, reset, and activity refresh.
- `public/manus-routes.json`: declared page route manifest for `/` and `/404`.
- `app.config.ts`: quoted durable logo URL metadata for the project.

## Infrastructure and serving

The project is initialized with WebDev `server:true` and `database:true`. Development runs with `pnpm dev` on port 3000. The managed database is read at runtime from `DATABASE_URL`; no private credential is bundled into the frontend. The existing Dockerfile and `/api/health` deployment contract remain in place. The project will be typechecked, tested, built, and pushed to the canonical `main` branch for a checkpoint. Publication is not enabled automatically; delivery will use the current Preview URL unless a successful publish is explicitly available.
