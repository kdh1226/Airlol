import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllPlayers, getPlayerRanking, createPlayer, updatePlayer, deletePlayer,
  getAllChampions, getChampionRanking, createChampion, updateChampion, deleteChampion,
  getAllMatches, getMatchWithPlayers, createMatch, deleteMatch,
  upsertPlayerBulk, upsertChampionBulk, createSyncLog, getRecentSyncLogs,
  getDashboardSummary,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
    create: protectedProcedure
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
    update: protectedProcedure
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
    delete: protectedProcedure
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
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        wins: z.number().int().min(0).optional(),
        losses: z.number().int().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        return createChampion(input);
      }),
    update: protectedProcedure
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
    delete: protectedProcedure
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
    create: protectedProcedure
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
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteMatch(input.id);
      }),
  }),

  sync: router({
    logs: publicProcedure.query(async () => {
      return getRecentSyncLogs();
    }),
    trigger: protectedProcedure
      .input(z.object({
        sheetUrl: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        // Extract spreadsheet ID from URL
        const match = input.sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        const spreadsheetId = match ? match[1] : input.sheetUrl;
        const sheetGid = "0";
        try {
          const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetGid}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch spreadsheet: ${response.status}`);
          const csvText = await response.text();
          const rows = parseCSV(csvText);

          // Parse player data from columns (index 14-16: name, wins, losses)
          const playerData: { name: string; wins: number; losses: number }[] = [];
          const championData: { name: string; wins: number; losses: number }[] = [];

          // Try to detect player data and champion data from the CSV
          let inChampionSection = false;
          for (const row of rows) {
            // Check for champion section header
            if (row[0] && row[0].includes("챔피언별 승률")) {
              inChampionSection = true;
              continue;
            }

            if (inChampionSection && row[0] && row[0].trim()) {
              const wins = parseInt(row[1]) || 0;
              const losses = parseInt(row[2]) || 0;
              if (wins > 0 || losses > 0) {
                championData.push({ name: row[0].trim(), wins, losses });
              }
            }

            // Player data from right side columns
            if (row.length > 16 && row[14] && row[14].trim()) {
              const wins = parseInt(row[15]) || 0;
              const losses = parseInt(row[16]) || 0;
              if (wins > 0 || losses > 0) {
                playerData.push({ name: row[14].trim(), wins, losses });
              }
            }
          }

          let playersCount = 0;
          let championsCount = 0;

          if (playerData.length > 0) {
            playersCount = await upsertPlayerBulk(playerData);
          }
          if (championData.length > 0) {
            championsCount = await upsertChampionBulk(championData);
          }

          await createSyncLog({
            syncType: "spreadsheet",
            status: "success",
            message: `Synced from spreadsheet ${spreadsheetId}`,
            playersCount,
            championsCount,
          });

          return { success: true, playersUpdated: playersCount, championsUpdated: championsCount };
        } catch (error: any) {
          await createSyncLog({
            syncType: "spreadsheet",
            status: "error",
            message: error.message,
          });
          throw error;
        }
      }),
  }),
});

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current);
        current = "";
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(current);
        current = "";
        rows.push(row);
        row = [];
      } else {
        current += ch;
      }
    }
  }
  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }
  return rows;
}

export type AppRouter = typeof appRouter;
