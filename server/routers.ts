import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import type { TrpcContext } from "./_core/context";

// Admin middleware: checks admin_mode cookie
const t = initTRPC.context<TrpcContext>().create();
const adminModeProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const cookieHeader = ctx.req.headers.cookie || "";
  const isAdmin = cookieHeader.includes("admin_mode=true");
  if (!isAdmin) {
    // Also allow if user is logged in via OAuth (backward compat)
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "관리자 로그인이 필요합니다." });
    }
  }
  return next({ ctx });
});
import { z } from "zod";
import {
  getAllPlayers, getPlayerRanking, createPlayer, updatePlayer, deletePlayer,
  getAllChampions, getChampionRanking, createChampion, updateChampion, deleteChampion,
  getAllMatches, getMatchWithPlayers, createMatch, deleteMatch,
  getRecentSyncLogs,
  getDashboardSummary,
} from "./db";
import { syncFromSpreadsheet } from "./syncService";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("admin_mode", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    adminLogin: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { ENV } = await import("./_core/env");
        if (input.password !== ENV.adminPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "비밀번호가 틀렸습니다." });
        }
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("admin_mode", "true", { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 }); // 7 days
        return { success: true } as const;
      }),
    adminCheck: publicProcedure.query(({ ctx }) => {
      const cookieHeader = ctx.req.headers.cookie || "";
      const isAdmin = cookieHeader.includes("admin_mode=true");
      return { isAdmin };
    }),
    adminLogout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie("admin_mode", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  dashboard: router({
    summary: publicProcedure.query(async () => {
      return getDashboardSummary();
    }),
  }),

  player: router({
    list: publicProcedure.query(async () => {
      return getAllPlayers();
    }),
    ranking: publicProcedure.query(async () => {
      return getPlayerRanking();
    }),
    create: adminModeProcedure
      .input(z.object({
        name: z.string().min(1),
        wins: z.number().int().min(0).optional(),
        losses: z.number().int().min(0).optional(),
        seriesWins: z.number().int().min(0).optional(),
        seriesLosses: z.number().int().min(0).optional(),
        mainPosition: z.string().optional(),
        memo: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createPlayer(input);
      }),
    update: adminModeProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        wins: z.number().int().min(0).optional(),
        losses: z.number().int().min(0).optional(),
        seriesWins: z.number().int().min(0).optional(),
        seriesLosses: z.number().int().min(0).optional(),
        mainPosition: z.string().optional(),
        memo: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePlayer(id, data);
      }),
    delete: adminModeProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePlayer(input.id);
      }),
  }),

  champion: router({
    list: publicProcedure.query(async () => {
      return getAllChampions();
    }),
    ranking: publicProcedure.query(async () => {
      return getChampionRanking();
    }),
    create: adminModeProcedure
      .input(z.object({
        name: z.string().min(1),
        wins: z.number().int().min(0).optional(),
        losses: z.number().int().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        return createChampion(input);
      }),
    update: adminModeProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        wins: z.number().int().min(0).optional(),
        losses: z.number().int().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateChampion(id, data);
      }),
    delete: adminModeProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteChampion(input.id);
      }),
  }),

  match: router({
    list: publicProcedure.query(async () => {
      return getAllMatches();
    }),
    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getMatchWithPlayers(input.id);
      }),
    create: adminModeProcedure
      .input(z.object({
        matchDate: z.string().min(1),
        title: z.string().optional(),
        team1Name: z.string().optional(),
        team2Name: z.string().optional(),
        winner: z.number().min(1).max(2),
        players: z.array(z.object({
          playerName: z.string().min(1),
          team: z.number().min(1).max(2),
          champion: z.string().optional(),
          position: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        return createMatch(input);
      }),
    delete: adminModeProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteMatch(input.id);
      }),
  }),

  sync: router({
    logs: publicProcedure.query(async () => {
      return getRecentSyncLogs();
    }),
    trigger: adminModeProcedure
      .input(z.object({
        sheetUrl: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return syncFromSpreadsheet(input.sheetUrl);
      }),
  }),
});



export type AppRouter = typeof appRouter;
