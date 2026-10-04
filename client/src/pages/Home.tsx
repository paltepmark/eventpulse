import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  LineChart,
  ListFilter,
  LogOut,
  Menu,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const events = [
  { symbol: "NVDA", company: "NVIDIA Corporation", impact: "HIGH IMPACT", impactTone: "high", category: "Earnings", ago: "2 min ago", title: "Quarterly revenue tops consensus; data center demand remains strong", price: 142.55, change: "+2.84%", signal: "BUY", confidence: 0.72 },
  { symbol: "TSLA", company: "Tesla, Inc.", impact: "HIGH IMPACT", impactTone: "high", category: "Product News", ago: "8 min ago", title: "Company outlines expanded production timeline for next-generation platform", price: 338.21, change: "-1.16%", signal: "HOLD", confidence: 0.64 },
  { symbol: "AAPL", company: "Apple Inc.", impact: "MEDIUM IMPACT", impactTone: "medium", category: "Company Guidance", ago: "14 min ago", title: "Management comments on services growth and supply-chain normalization", price: 254.63, change: "+0.62%", signal: "BUY", confidence: 0.69 },
];

const navGroups = [
  { label: "Workspace", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, { id: "events", label: "Market Events", icon: Zap, badge: "6" }, { id: "analysis", label: "AI Analysis", icon: BrainCircuit }, { id: "agent", label: "Trading Agent", icon: Activity }] },
  { label: "Portfolio", items: [{ id: "portfolio", label: "Paper Portfolio", icon: Wallet }, { id: "history", label: "Trade History", icon: ListFilter }, { id: "analytics", label: "Analytics", icon: LineChart }] },
  { label: "Controls", items: [{ id: "risk", label: "Risk Center", icon: ShieldCheck }, { id: "settings", label: "Settings", icon: Settings2 }] },
];

type EventItem = (typeof events)[number];
type Section = "dashboard" | "events" | "analysis" | "agent" | "portfolio" | "history" | "analytics" | "risk" | "settings";

const money = (value?: number | string | null) => `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortMoney = (value?: number | string | null) => `$${Number(value ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const initials = (name?: string | null) => (name || "Demo User").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const relativeTime = (value?: Date | string | null) => value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";

function Brand() {
  return <div className="brand"><div className="brand-mark"><TrendingUp size={16} /></div><div><div className="brand-name">EventPulse AI</div><div className="brand-kicker">Event intelligence</div></div></div>;
}

function Disclaimer() {
  return <div className="disclaimer"><AlertTriangle size={13} /> <span>Simulation environment · All events, analysis, and trades are demo data. No live market feed or real-money orders.</span></div>;
}

function SignedOut() {
  return <div className="auth-layout">
    <section className="auth-hero">
      <div className="auth-content">
        <Brand />
        <div className="page-kicker">Event-driven intelligence · paper trading demo</div>
        <h1>Read the signal.<br /><span>Practice the move.</span></h1>
        <p>EventPulse turns market-moving events into a calm, auditable workspace for exploring decisions without putting real capital at risk.</p>
        <div className="auth-points"><div className="auth-point"><i /> Simulated portfolio with persistent account continuity</div><div className="auth-point"><i /> Risk controls before every paper trade</div><div className="auth-point"><i /> Transparent AI agent activity, timestamp by timestamp</div></div>
      </div>
    </section>
    <section className="auth-panel"><div className="auth-card">
      <div className="page-kicker">Secure workspace access</div>
      <h2>Enter your command center.</h2>
      <p>Sign in or create an account through Manus to keep your simulated portfolio, preferences, and activity history synced.</p>
      <button className="primary-btn" onClick={() => startLogin()}><Sparkles size={15} /> Sign in / Create account</button>
      <div className="auth-note">By continuing, you enter an educational simulation.<br />No real-money trading. No broker connection.</div>
    </div></section>
  </div>;
}

function Sidebar({ active, setActive, open, close }: { active: Section; setActive: (section: Section) => void; open: boolean; close: () => void }) {
  return <aside className={`sidebar ${open ? "open" : ""}`}>
    <Brand />
    {navGroups.map((group) => <div key={group.label}><div className="nav-label">{group.label}</div><div className="nav-list">{group.items.map(({ id, label, icon: Icon, badge }) => <button key={id} className={`nav-item ${active === id ? "active" : ""}`} onClick={() => { setActive(id as Section); close(); }}><Icon size={15} /><span>{label}</span>{badge && <span className="nav-badge">{badge}</span>}</button>)}</div></div>)}
    <div className="sidebar-foot"><div className="agent-mini"><div className="agent-mini-top"><span>AI Agent</span><span className="status-dot" /></div><div className="agent-mini-copy">Monitoring demo feed</div></div><div className="user-mini"><div className="avatar">JD</div><div><div className="user-mini-name">Demo workspace</div><div className="user-mini-role">Educational mode</div></div></div></div>
  </aside>;
}

function Topbar({ user, onLogout, setOpen }: { user: { name?: string | null; email?: string | null }; onLogout: () => void; setOpen: (open: boolean) => void }) {
  return <header className="topbar"><div className="crumbs"><button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={15} /></button><span>EventPulse AI</span><ChevronRight size={12} /><strong>Market overview</strong></div><div className="top-actions"><div className="sim-chip"><span className="status-dot" /> Simulated session <em>DEMO</em></div><button className="icon-btn" aria-label="Notifications"><Bell size={14} /></button><button className="profile-btn" onClick={onLogout} title="Sign out"><div className="avatar">{initials(user.name)}</div><span>{user.name || user.email || "Account"}</span><LogOut size={13} /></button></div></header>;
}

function ChartCard() {
  const points = "0,144 35,131 70,136 105,119 140,126 175,95 210,102 245,91 280,98 315,72 350,78 385,58 420,67 455,46 490,49 525,26 560,35 595,16";
  return <div className="card chart-card"><div className="card-head"><div><div className="card-title">Portfolio performance</div><div className="chart-summary"><span className="chart-number">$102,485.60</span><span className="chart-gain">+$2,485.60 (2.49%)</span></div></div><div className="range-row">{["1D", "1W", "1M", "ALL"].map((range) => <button className={`range-btn ${range === "1D" ? "active" : ""}`} key={range}>{range}</button>)}<button className="icon-btn" aria-label="Download chart"><ArrowDownRight size={13} /></button></div></div><div className="chart-wrap"><svg viewBox="0 0 600 165" role="img" aria-label="Simulated equity curve"><defs><linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#27e2d0" stopOpacity=".25" /><stop offset="1" stopColor="#27e2d0" stopOpacity="0" /></linearGradient></defs>{[22, 58, 94, 130].map((y) => <line className="chart-grid-line" key={y} x1="0" x2="600" y1={y} y2={y} />)}<polyline className="chart-area" points={`${points} 595,158 0,158`} /><polyline className="chart-line" points={points} /></svg><div className="chart-axis"><span>09:30</span><span>10:30</span><span>11:30</span><span>12:30</span><span>13:30</span><span>14:30</span><span>15:00</span></div><div className="legend-row" style={{ marginTop: 14 }}><span className="legend-dot" /> Simulated equity <span style={{ marginLeft: 7 }}>· $100k starting capital</span></div></div></div>;
}

function EventRow({ event, onTrade }: { event: EventItem; onTrade: (event: EventItem) => void }) {
  return <button className="event-row" onClick={() => onTrade(event)}><div><div className="event-symbol">{event.symbol}</div><div className="event-company">{event.company}</div></div><div className="event-main"><div className="event-meta"><span className={`impact ${event.impactTone}`}>{event.impact}</span><span>{event.category}</span><span>·</span><span>{event.ago}</span></div><div className="event-title">{event.title}</div></div><div className="event-price"><div className="price">{money(event.price)}</div><div className={event.change.startsWith("+") ? "positive mono" : "negative mono"} style={{ fontSize: 9, marginTop: 4 }}>{event.change}</div><span className={`signal ${event.signal.toLowerCase()}`}>AI {event.signal}</span></div></button>;
}

function EventFeed({ onTrade, compact = false }: { onTrade: (event: EventItem) => void; compact?: boolean }) {
  return <div className="card events-card"><div className="card-head"><div><div className="card-title">Demo event feed</div><div style={{ marginTop: 6, color: "#e4f0f2", fontSize: 18, letterSpacing: "-.04em" }}>Market events</div></div><button className="card-link" onClick={() => toast.info("Showing the latest simulated market events.")}>{compact ? "View all events" : "Refresh feed"}</button></div><div className="event-list">{events.map((event) => <EventRow key={event.symbol} event={event} onTrade={onTrade} />)}</div><div style={{ padding: "0 17px 14px", color: "#647d88", font: '9px "IBM Plex Mono", monospace' }}>Sample events are preloaded for demonstration · Click an event to review a simulated trade</div></div>;
}

function AgentCard({ snapshot, paused, setPaused, onRefresh }: { snapshot: any; paused: boolean; setPaused: (value: boolean) => void; onRefresh: () => void }) {
  const workspace = snapshot?.workspace;
  const activities = snapshot?.activities ?? [];
  return <div className="card agent-card"><div className="card-head"><div className="card-title">Agent monitoring</div><button className="icon-btn" onClick={onRefresh} aria-label="Refresh agent activity"><RefreshCw size={13} /></button></div><div className="agent-status"><span className="status-dot" /> <strong>{paused ? "Paused" : "Active"}</strong> · Monitoring the simulated event feed</div><div className="agent-stat-grid"><div className="agent-stat"><div className="agent-stat-value">{workspace?.eventsScanned ?? 127}</div><div className="agent-stat-label">Events scanned</div></div><div className="agent-stat"><div className="agent-stat-value">{workspace?.analyses ?? 43}</div><div className="agent-stat-label">AI analyses</div></div><div className="agent-stat"><div className="agent-stat-value">{workspace?.decisions ?? 18}</div><div className="agent-stat-label">Decisions</div></div></div><div className="agent-bottom"><span>Last event processed · {activities[0] ? relativeTime(activities[0].createdAt) : "2 min ago"}</span><button className="card-link" onClick={() => setPaused(!paused)}>{paused ? <><Play size={11} /> Resume agent</> : <><Pause size={11} /> Pause agent</>}</button></div></div>;
}

function RiskCard({ snapshot, onOpen }: { snapshot: any; onOpen: () => void }) {
  const risk = snapshot?.risk;
  const score = 32;
  return <div className="card risk-card"><div className="card-head"><div className="card-title">Independent safety layer</div><button className="icon-btn" onClick={onOpen} aria-label="Open risk center"><SlidersHorizontal size={13} /></button></div><div className="risk-score"><div className="risk-ring"><span>{score}</span></div><div><h3>Moderate risk</h3><p>Current demo profile · Engine operational</p></div></div><div className="risk-checks"><div className="risk-check"><span className="risk-check-label"><span className="check-icon"><Check size={10} /></span> Position sizing</span><span className="check-state">≤ {shortMoney(risk?.maxPositionValue ?? 5000)} · PASS</span></div><div className="risk-check"><span className="risk-check-label"><span className="check-icon"><Check size={10} /></span> Daily loss limit</span><span className="check-state">1.2% of {shortMoney(risk?.dailyLossLimit ?? 3000)} · PASS</span></div><div className="risk-check"><span className="risk-check-label"><span className="check-icon" style={{ borderColor: "rgba(228,196,118,.45)", color: "#e5c476" }}>!</span> Volatility threshold</span><span className="check-state" style={{ color: "#e5c476" }}>{(risk?.volatilityThreshold ?? "high").toUpperCase()} · WATCH</span></div></div><div style={{ padding: "15px 17px 0" }}><button className="secondary-btn" onClick={onOpen}>Review risk settings <ChevronRight size={13} /></button></div></div>;
}

function ActivityCard({ activities }: { activities: any[] }) {
  const fallback = [
    { eventType: "Market event detected", symbol: "NVDA", title: "Quarterly earnings report", detail: "Positive impact · 72% model confidence", createdAt: new Date() },
    { eventType: "AI analysis completed", symbol: "NVDA", title: "Positive impact assessment", detail: "Momentum confirmation", createdAt: new Date(Date.now() - 60000) },
    { eventType: "Trading decision generated", symbol: "TSLA", title: "BUY · 10 simulated shares suggested", detail: "Awaiting paper-trade review", createdAt: new Date(Date.now() - 120000) },
  ];
  const list = activities.length ? activities.slice(0, 3) : fallback;
  return <div className="card activity-card"><div className="card-head"><div><div className="card-title">Transparent workflow</div><div style={{ marginTop: 6, color: "#e4f0f2", fontSize: 17, letterSpacing: "-.04em" }}>Agent activity</div></div><button className="card-link" onClick={() => toast.info("Activity log is scoped to your account.")}>Open activity log</button></div><div className="activity-list">{list.map((item, index) => <div className="activity-item" key={`${item.id ?? item.title}-${index}`}><div className="activity-pip"><span /></div><div className="activity-copy"><h4>{item.eventType} · {item.symbol}</h4><p>{item.title}<br />{item.detail}</p></div><div className="activity-time">{relativeTime(item.createdAt)}<br />· Demo log</div></div>)}</div></div>;
}

function Metrics({ workspace }: { workspace: any }) {
  const metrics = [
    { label: "Current equity", value: money(workspace?.equity ?? 102485.6), change: "↑ 2.49% vs. $100,000 start", icon: Wallet },
    { label: "Today's P&L", value: `+${money(workspace?.todayPnl ?? 1245.8)}`, change: "↑ 1.23% · Simulated", icon: TrendingUp },
    { label: "Total return", value: `+${((Number(workspace?.realizedPnl ?? 2485.6) / Number(workspace?.startingBalance ?? 100000)) * 100).toFixed(2)}%`, change: "↑ Since demo inception", icon: LineChart },
    { label: "Win rate", value: `${Number(workspace?.winRate ?? 68.4).toFixed(1)}%`, change: `${workspace?.wins ?? 19} wins · ${workspace?.losses ?? 9} losses`, icon: BarChart3 },
  ];
  return <div className="metrics-grid">{metrics.map(({ label, value, change, icon: Icon }) => <div className="card metric-card" key={label}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-change"><Icon size={12} /> {change}</div></div>)}</div>;
}

function Dashboard({ snapshot, onTrade, active, setActive, paused, setPaused, onRefresh }: { snapshot: any; onTrade: (event: EventItem) => void; active: Section; setActive: (section: Section) => void; paused: boolean; setPaused: (value: boolean) => void; onRefresh: () => void }) {
  if (active !== "dashboard") return <WorkspaceSection active={active} snapshot={snapshot} setActive={setActive} onTrade={onTrade} paused={paused} setPaused={setPaused} onRefresh={onRefresh} />;
  return <><div className="page-heading"><div><div className="page-kicker">Friday, September 26, 2026 / New York session</div><h1>Market overview</h1><p>Event-driven intelligence for your simulated portfolio.</p></div><div className="heading-actions"><button className="secondary-btn" onClick={() => toast.success("Demo metrics refreshed.")}><RefreshCw size={13} /> Refresh</button><button className="primary-btn" onClick={() => onTrade(events[0])}><Zap size={13} /> Review signal</button></div></div><Disclaimer /><div style={{ height: 12 }} /><Metrics workspace={snapshot?.workspace} /><div className="dashboard-grid"><div className="left-stack"><ChartCard /><EventFeed onTrade={onTrade} compact /></div><div className="right-stack"><AgentCard snapshot={snapshot} paused={paused} setPaused={setPaused} onRefresh={onRefresh} /><RiskCard snapshot={snapshot} onOpen={() => setActive("risk")} /><ActivityCard activities={snapshot?.activities ?? []} /></div></div></>;
}

function WorkspaceSection({ active, snapshot, setActive, onTrade, paused, setPaused, onRefresh }: { active: Section; snapshot: any; setActive: (section: Section) => void; onTrade: (event: EventItem) => void; paused: boolean; setPaused: (value: boolean) => void; onRefresh: () => void }) {
  const titles: Record<Section, [string, string]> = { dashboard: ["Market overview", "Event-driven intelligence for your simulated portfolio."], events: ["Market events", "Review simulated signals before opening a paper position."], analysis: ["AI analysis", "A transparent view of model confidence and event context."], agent: ["Trading agent", "Monitor the simulated agent without a live market connection."], portfolio: ["Paper portfolio", "Your account-linked simulated exposure and open positions."], history: ["Trade history", "Every simulated decision recorded in your workspace."], analytics: ["Analytics", "Performance telemetry for your educational session."], risk: ["Risk center", "Adjust guardrails before the next simulated order."], settings: ["Settings", "Manage your account view and demo workspace."], };
  const [title, copy] = titles[active];
  if (active === "events") return <><SectionHeading title={title} copy={copy} /><Disclaimer /><div style={{ height: 12 }} /><EventFeed onTrade={onTrade} /></>;
  if (active === "analysis" || active === "agent") return <><SectionHeading title={title} copy={copy} /><div className="section-grid"><ActivityCard activities={snapshot?.activities ?? []} /><AgentCard snapshot={snapshot} paused={paused} setPaused={setPaused} onRefresh={onRefresh} /></div><div style={{ height: 12 }} /><EventFeed onTrade={onTrade} /></>;
  if (active === "portfolio") return <><SectionHeading title={title} copy={copy} /><Portfolio snapshot={snapshot} onTrade={onTrade} /></>;
  if (active === "history") return <><SectionHeading title={title} copy={copy} /><TradeHistory trades={snapshot?.trades ?? []} /></>;
  if (active === "analytics") return <><SectionHeading title={title} copy={copy} /><div className="section-grid"><ChartCard /><div className="card section-card"><div className="card-head"><div className="card-title">Session telemetry</div><span className="signal buy">DEMO ONLY</span></div><div className="section-copy">Your simulated account is currently outperforming its starting balance by <strong className="positive">2.49%</strong>. The model's best-performing signal is event-driven earnings with a 72% average confidence.</div><div className="metrics-grid" style={{ gridTemplateColumns: "repeat(2,1fr)", padding: "18px 17px 0", margin: 0 }}><div className="card metric-card"><div className="metric-label">Events monitored</div><div className="metric-value">{snapshot?.workspace?.eventsScanned ?? 127}</div></div><div className="card metric-card"><div className="metric-label">Decisions approved</div><div className="metric-value">{snapshot?.workspace?.decisions ?? 18}</div></div></div></div></div></>;
  if (active === "risk") return <><SectionHeading title={title} copy={copy} /><RiskCenter snapshot={snapshot} /></>;
  if (active === "settings") return <><SectionHeading title={title} copy={copy} /><SettingsPanel /></>;
  return null;
}

function SectionHeading({ title, copy }: { title: string; copy: string }) { return <div className="page-heading"><div><div className="page-kicker">EventPulse workspace</div><h1>{title}</h1><p>{copy}</p></div></div>; }

function Portfolio({ snapshot, onTrade }: { snapshot: any; onTrade: (event: EventItem) => void }) {
  const positions = snapshot?.positions ?? [];
  return <div className="left-stack"><div className="card section-card"><div className="card-head"><div className="card-title">Open positions</div><button className="primary-btn" onClick={() => onTrade(events[0])}><Zap size={13} /> New paper trade</button></div><div style={{ padding: "14px 17px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 9 }}>{positions.length ? positions.map((position: any) => <div className="position-card card" key={position.id}><div className="position-head"><div><div className="position-symbol">{position.symbol}</div><div className="position-name">{position.name}</div></div><span className="signal buy">OPEN</span></div><div className="position-meta"><span>Qty <strong>{position.quantity}</strong></span><span>Entry <strong>{money(position.entryPrice)}</strong></span><span className="positive">+{money(position.pnl)}</span></div></div>) : <div className="empty-state">No open positions yet. Review a simulated event to get started.</div>}</div></div><TradeHistory trades={snapshot?.trades ?? []} /></div>;
}

function TradeHistory({ trades }: { trades: any[] }) {
  return <div className="card section-card"><div className="card-head"><div className="card-title">Recent paper trades</div><button className="card-link" onClick={() => toast.info("All trades are stored against your account.")}>Account history <ChevronRight size={12} /></button></div>{trades.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Asset</th><th>Signal</th><th>Quantity</th><th>Notional</th><th>Status</th><th>Time</th></tr></thead><tbody>{trades.map((trade) => <tr key={trade.id}><td><strong>{trade.symbol}</strong><br /><span style={{ color: "#6d8792", fontSize: 9 }}>{trade.eventTitle}</span></td><td><span className={`signal ${trade.signal.toLowerCase()}`}>{trade.signal}</span></td><td className="mono">{trade.quantity}</td><td className="mono">{money(trade.notional)}</td><td className={trade.status === "approved" ? "positive mono" : "negative mono"}>{trade.status.toUpperCase()}</td><td className="mono">{relativeTime(trade.createdAt)}</td></tr>)}</tbody></table></div> : <div className="empty-state">No simulated trades recorded yet.</div>}</div>;
}

function RiskCenter({ snapshot }: { snapshot: any }) {
  const risk = snapshot?.risk;
  const [maxPositionValue, setMaxPositionValue] = useState(String(risk?.maxPositionValue ?? 5000));
  const [dailyLossLimit, setDailyLossLimit] = useState(String(risk?.dailyLossLimit ?? 3000));
  const [volatilityThreshold, setVolatilityThreshold] = useState<"low" | "medium" | "high">(risk?.volatilityThreshold ?? "high");
  const update = trpc.workspace.updateRisk.useMutation({ onSuccess: () => toast.success("Risk settings saved to your account."), onError: (error) => toast.error(error.message) });
  return <div className="section-grid"><div className="card section-card"><div className="card-head"><div className="card-title">Guardrail configuration</div><ShieldCheck size={16} color="#27e2d0" /></div><div className="settings-form"><label className="field-label">Max position value<input className="field-input" type="number" value={maxPositionValue} onChange={(event) => setMaxPositionValue(event.target.value)} /><span className="field-hint">Orders above this notional value are blocked before they are recorded.</span></label><label className="field-label">Daily loss limit<input className="field-input" type="number" value={dailyLossLimit} onChange={(event) => setDailyLossLimit(event.target.value)} /><span className="field-hint">A simulated account threshold for the daily review.</span></label><label className="field-label">Volatility threshold<select className="field-input" value={volatilityThreshold} onChange={(event) => setVolatilityThreshold(event.target.value as "low" | "medium" | "high")}><option value="low">Low · tighter review</option><option value="medium">Medium · balanced</option><option value="high">High · event-aware</option></select></label><button className="primary-btn" disabled={update.isPending} onClick={() => update.mutate({ maxPositionValue: Number(maxPositionValue), dailyLossLimit: Number(dailyLossLimit), volatilityThreshold })}>{update.isPending ? "Saving…" : "Save risk settings"}</button></div></div><RiskCard snapshot={snapshot} onOpen={() => toast.info("You are already viewing Risk Center.")} /></div>;
}

function SettingsPanel() {
  const { user } = useAuth();
  const reset = trpc.workspace.reset.useMutation({ onSuccess: () => toast.success("Your simulated workspace was reset."), onError: (error) => toast.error(error.message) });
  return <div className="section-grid"><div className="card section-card"><div className="card-head"><div className="card-title">Account identity</div><UserRound size={16} color="#27e2d0" /></div><div className="settings-form"><div className="field-label">Display name<div className="field-input" style={{ display: "flex", alignItems: "center" }}>{user?.name || "EventPulse member"}</div></div><div className="field-label">Account email<div className="field-input" style={{ display: "flex", alignItems: "center" }}>{user?.email || "Connected through Manus OAuth"}</div></div><div className="field-hint">Your identity is managed by Manus OAuth. Portfolio and settings are stored in the EventPulse database against this authenticated account.</div></div></div><div className="card section-card"><div className="card-head"><div className="card-title">Demo workspace</div><RotateCcw size={16} color="#e5c476" /></div><div className="section-copy">Reset clears your simulated positions, paper-trade history, and agent activity, then starts a fresh educational workspace at $100,000. This does not affect your Manus account.</div><div style={{ padding: "18px 17px" }}><button className="secondary-btn danger-btn" disabled={reset.isPending} onClick={() => reset.mutate()}><RotateCcw size={13} /> {reset.isPending ? "Resetting…" : "Reset simulated workspace"}</button></div></div></div>;
}

function TradeModal({ event, onClose, snapshot }: { event: EventItem; onClose: () => void; snapshot: any }) {
  const [signal, setSignal] = useState<"BUY" | "SELL" | "HOLD">(event.signal as "BUY" | "SELL" | "HOLD");
  const [quantity, setQuantity] = useState("10");
  const trade = trpc.workspace.placeTrade.useMutation({ onSuccess: (result) => { if (result.accepted) { toast.success(result.reason); onClose(); } else toast.error(result.reason); }, onError: (error) => toast.error(error.message) });
  const notional = Number(quantity || 0) * event.price;
  return <div className="trade-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="trade-modal"><div className="trade-modal-head"><div><h3>Review simulated order</h3><p>{event.symbol} · {event.category} · {event.impact}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close trade ticket"><X size={15} /></button></div><div className="trade-modal-body"><div className="trade-price"><div><div className="metric-label">Current simulated price</div><strong>{money(event.price)}</strong></div><span>{event.change} today</span></div><div className="segmented">{["BUY", "HOLD", "SELL"].map((item) => <button key={item} className={signal === item ? "active" : ""} onClick={() => setSignal(item as "BUY" | "SELL" | "HOLD")}>{item}</button>)}</div><label className="field-label">Simulated quantity<input className="field-input" type="number" min="1" max="1000" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label><div className="trade-review"><span>Estimated notional<br /><strong>{money(notional)}</strong></span><span>Risk limit<br /><strong>{shortMoney(snapshot?.risk?.maxPositionValue ?? 5000)}</strong></span><span>Confidence<br /><strong>{Math.round(event.confidence * 100)}%</strong></span></div><Disclaimer /><div className="trade-actions" style={{ marginTop: 16 }}><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={trade.isPending || !Number(quantity)} onClick={() => trade.mutate({ symbol: event.symbol, eventTitle: event.title, signal, quantity: Number(quantity), price: event.price, confidence: event.confidence })}>{trade.isPending ? "Recording…" : "Record paper trade"}</button></div></div></div></div>;
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [active, setActive] = useState<Section>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [paused, setPaused] = useState(false);
  const workspace = trpc.workspace.snapshot.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchOnWindowFocus: false });
  const refreshAgent = trpc.workspace.refreshAgent.useMutation({ onSuccess: () => { workspace.refetch(); toast.success("Demo agent feed refreshed."); }, onError: (error) => toast.error(error.message) });
  const snapshot = workspace.data;
  const displayUser = useMemo(() => ({ name: user?.name, email: user?.email }), [user?.name, user?.email]);

  if (loading) return <div className="loading-shell"><span className="status-dot" style={{ marginRight: 9 }} /> Establishing secure workspace…</div>;
  if (!isAuthenticated || !user) return <SignedOut />;
  if (workspace.isLoading) return <div className="loading-shell"><span className="status-dot" style={{ marginRight: 9 }} /> Syncing your simulated portfolio…</div>;
  if (workspace.error) return <div className="loading-shell"><div style={{ textAlign: "center" }}><AlertTriangle size={24} color="#e5c476" /><p>Workspace data could not be loaded.</p><button className="primary-btn" onClick={() => workspace.refetch()}>Try again</button></div></div>;

  return <div className="app-shell"><Sidebar active={active} setActive={setActive} open={mobileOpen} close={() => setMobileOpen(false)} /><div className="main-shell"><Topbar user={displayUser} onLogout={() => logout()} setOpen={setMobileOpen} /><main className="page-wrap"><Dashboard snapshot={snapshot} onTrade={setSelectedEvent} active={active} setActive={setActive} paused={paused} setPaused={setPaused} onRefresh={() => refreshAgent.mutate()} /></main></div>{selectedEvent && <TradeModal event={selectedEvent} snapshot={snapshot} onClose={() => { setSelectedEvent(null); workspace.refetch(); }} />}</div>;
}
