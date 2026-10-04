import { double, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing Manus OAuth and application ownership. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workspaces = mysqlTable(
  "workspaces",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    startingBalance: double("startingBalance").notNull().default(100000),
    cashBalance: double("cashBalance").notNull().default(100000),
    equity: double("equity").notNull().default(100000),
    todayPnl: double("todayPnl").notNull().default(0),
    realizedPnl: double("realizedPnl").notNull().default(0),
    winRate: double("winRate").notNull().default(0),
    totalTrades: int("totalTrades").notNull().default(0),
    wins: int("wins").notNull().default(0),
    losses: int("losses").notNull().default(0),
    eventsScanned: int("eventsScanned").notNull().default(0),
    analyses: int("analyses").notNull().default(0),
    decisions: int("decisions").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({ userIdx: uniqueIndex("workspaces_user_id_unique").on(table.userId) }),
);

export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 16 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  side: mysqlEnum("side", ["long", "short"]).notNull().default("long"),
  quantity: int("quantity").notNull(),
  entryPrice: double("entryPrice").notNull(),
  markPrice: double("markPrice").notNull(),
  pnl: double("pnl").notNull().default(0),
  status: mysqlEnum("status", ["open", "closed"]).notNull().default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 16 }).notNull(),
  eventTitle: varchar("eventTitle", { length: 180 }).notNull(),
  signal: varchar("signal", { length: 16 }).notNull(),
  quantity: int("quantity").notNull(),
  price: double("price").notNull(),
  notional: double("notional").notNull(),
  confidence: double("confidence").notNull().default(0),
  status: mysqlEnum("status", ["approved", "rejected"]).notNull().default("approved"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const riskSettings = mysqlTable(
  "riskSettings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    maxPositionValue: double("maxPositionValue").notNull().default(5000),
    dailyLossLimit: double("dailyLossLimit").notNull().default(3000),
    volatilityThreshold: mysqlEnum("volatilityThreshold", ["low", "medium", "high"]).notNull().default("high"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({ userIdx: uniqueIndex("risk_settings_user_id_unique").on(table.userId) }),
);

export const agentActivities = mysqlTable("agentActivities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  symbol: varchar("symbol", { length: 16 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail").notNull(),
  confidence: double("confidence").notNull().default(0),
  decision: varchar("decision", { length: 32 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type RiskSettings = typeof riskSettings.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type AgentActivity = typeof agentActivities.$inferSelect;
