import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const riskInput = z.object({
  maxPositionValue: z.number().min(500).max(100000),
  dailyLossLimit: z.number().min(100).max(100000),
  volatilityThreshold: z.enum(["low", "medium", "high"]),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    snapshot: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await db.getWorkspaceSnapshot(ctx.user.id);
      } catch (error) {
        console.error("[Workspace] Failed to load snapshot:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Workspace data is temporarily unavailable." });
      }
    }),
    updateRisk: protectedProcedure.input(riskInput).mutation(({ ctx, input }) => db.updateUserRisk(ctx.user.id, input)),
    placeTrade: protectedProcedure.input(z.object({
      symbol: z.string().min(1).max(16),
      eventTitle: z.string().min(1).max(180),
      signal: z.enum(["BUY", "SELL", "HOLD"]),
      quantity: z.number().int().min(1).max(1000),
      price: z.number().positive(),
      confidence: z.number().min(0).max(1),
    })).mutation(({ ctx, input }) => db.recordPaperTrade(ctx.user.id, input)),
    reset: protectedProcedure.mutation(({ ctx }) => db.resetUserWorkspace(ctx.user.id)),
    refreshAgent: protectedProcedure.mutation(({ ctx }) => db.addAgentRefresh(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
