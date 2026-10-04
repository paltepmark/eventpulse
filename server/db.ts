import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  AgentActivity,
  agentActivities,
  InsertUser,
  positions,
  riskSettings,
  trades,
  users,
  workspaces,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

const seedActivities = [
  {
    eventType: "Market event detected",
    symbol: "NVDA",
    title: "Quarterly earnings report",
    detail: "Revenue beat consensus; data center demand remains strong.",
    confidence: 0.72,
    decision: "WATCH",
  },
  {
    eventType: "AI analysis completed",
    symbol: "NVDA",
    title: "Positive impact assessment",
    detail: "Momentum and guidance support a measured long bias.",
    confidence: 0.72,
    decision: "BUY",
  },
  {
    eventType: "Trading decision generated",
    symbol: "TSLA",
    title: "Production timeline signal",
    detail: "Agent recommends waiting for confirmation before adding exposure.",
    confidence: 0.64,
    decision: "HOLD",
  },
];

export async function ensureUserWorkspace(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const existingWorkspace = await db.select().from(workspaces).where(eq(workspaces.userId, userId)).limit(1);
  if (existingWorkspace.length === 0) {
    await db.insert(workspaces).values({
      userId,
      startingBalance: 100000,
      cashBalance: 98450.4,
      equity: 102485.6,
      todayPnl: 1245.8,
      realizedPnl: 2485.6,
      winRate: 68.4,
      totalTrades: 28,
      wins: 19,
      losses: 9,
      eventsScanned: 127,
      analyses: 43,
      decisions: 18,
    });
  }

  const existingRisk = await db.select().from(riskSettings).where(eq(riskSettings.userId, userId)).limit(1);
  if (existingRisk.length === 0) {
    await db.insert(riskSettings).values({
      userId,
      maxPositionValue: 5000,
      dailyLossLimit: 3000,
      volatilityThreshold: "high",
    });
  }

  const existingPositions = await db.select({ id: positions.id }).from(positions).where(eq(positions.userId, userId)).limit(1);
  if (existingPositions.length === 0) {
    await db.insert(positions).values([
      { userId, symbol: "NVDA", name: "NVIDIA Corporation", side: "long", quantity: 10, entryPrice: 138.62, markPrice: 142.55, pnl: 39.3, status: "open" },
      { userId, symbol: "AAPL", name: "Apple Inc.", side: "long", quantity: 8, entryPrice: 251.18, markPrice: 254.63, pnl: 27.6, status: "open" },
    ]);
  }

  const existingActivity = await db.select({ id: agentActivities.id }).from(agentActivities).where(eq(agentActivities.userId, userId)).limit(1);
  if (existingActivity.length === 0) {
    await db.insert(agentActivities).values(seedActivities.map((item) => ({ userId, ...item })));
  }
}

export async function getWorkspaceSnapshot(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await ensureUserWorkspace(userId);

  const [workspaceRows, riskRows, positionRows, tradeRows, activityRows] = await Promise.all([
    db.select().from(workspaces).where(eq(workspaces.userId, userId)).limit(1),
    db.select().from(riskSettings).where(eq(riskSettings.userId, userId)).limit(1),
    db.select().from(positions).where(and(eq(positions.userId, userId), eq(positions.status, "open"))).orderBy(desc(positions.updatedAt)),
    db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.createdAt)).limit(8),
    db.select().from(agentActivities).where(eq(agentActivities.userId, userId)).orderBy(desc(agentActivities.createdAt)).limit(8),
  ]);

  return {
    workspace: workspaceRows[0],
    risk: riskRows[0],
    positions: positionRows,
    trades: tradeRows,
    activities: activityRows,
  };
}

export async function updateUserRisk(userId: number, values: { maxPositionValue: number; dailyLossLimit: number; volatilityThreshold: "low" | "medium" | "high" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await ensureUserWorkspace(userId);
  await db.update(riskSettings).set(values).where(eq(riskSettings.userId, userId));
  const updated = await db.select().from(riskSettings).where(eq(riskSettings.userId, userId)).limit(1);
  return updated[0];
}

export async function recordPaperTrade(userId: number, input: { symbol: string; eventTitle: string; signal: string; quantity: number; price: number; confidence: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await ensureUserWorkspace(userId);
  const [risk] = await db.select().from(riskSettings).where(eq(riskSettings.userId, userId)).limit(1);
  const notional = input.quantity * input.price;
  if (risk && notional > risk.maxPositionValue) {
    await db.insert(trades).values({ userId, ...input, notional, status: "rejected" });
    return { accepted: false as const, reason: `Simulated position exceeds your $${risk.maxPositionValue.toLocaleString()} max position limit.` };
  }

  await db.insert(trades).values({ userId, ...input, notional, status: "approved" });
  await db.insert(positions).values({
    userId,
    symbol: input.symbol,
    name: input.eventTitle,
    side: input.signal === "SELL" ? "short" : "long",
    quantity: input.quantity,
    entryPrice: input.price,
    markPrice: input.price,
    pnl: 0,
    status: "open",
  });

  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.userId, userId)).limit(1);
  if (workspace) {
    const totalTrades = workspace.totalTrades + 1;
    const wins = workspace.wins + (input.signal === "BUY" ? 1 : 0);
    const losses = workspace.losses + (input.signal === "SELL" ? 1 : 0);
    await db.update(workspaces).set({ totalTrades, wins, losses, winRate: totalTrades ? (wins / totalTrades) * 100 : 0, decisions: workspace.decisions + 1 }).where(eq(workspaces.userId, userId));
  }
  await db.insert(agentActivities).values({
    userId,
    eventType: "Paper trade approved",
    symbol: input.symbol,
    title: input.eventTitle,
    detail: `${input.signal} ${input.quantity} simulated shares recorded after risk review.`,
    confidence: input.confidence,
    decision: input.signal,
  });
  return { accepted: true as const, reason: "Simulated order recorded in your workspace." };
}

export async function resetUserWorkspace(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(positions).where(eq(positions.userId, userId));
  await db.delete(trades).where(eq(trades.userId, userId));
  await db.delete(agentActivities).where(eq(agentActivities.userId, userId));
  await db.update(workspaces).set({ cashBalance: 100000, equity: 100000, todayPnl: 0, realizedPnl: 0, winRate: 0, totalTrades: 0, wins: 0, losses: 0, eventsScanned: 0, analyses: 0, decisions: 0 }).where(eq(workspaces.userId, userId));
  await ensureUserWorkspace(userId);
  return getWorkspaceSnapshot(userId);
}

export async function addAgentRefresh(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await ensureUserWorkspace(userId);
  await db.insert(agentActivities).values({
    userId,
    eventType: "Demo feed refreshed",
    symbol: "AAPL",
    title: "Services guidance update",
    detail: "New simulated context queued for the agent to review.",
    confidence: 0.69,
    decision: "WATCH",
  });
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.userId, userId)).limit(1);
  if (workspace) await db.update(workspaces).set({ eventsScanned: workspace.eventsScanned + 1, analyses: workspace.analyses + 1 }).where(eq(workspaces.userId, userId));
  return getWorkspaceSnapshot(userId);
}

export type WorkspaceSnapshot = Awaited<ReturnType<typeof getWorkspaceSnapshot>>;
export type ActivityWithUser = AgentActivity;
