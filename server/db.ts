import { eq, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  players, InsertPlayer,
  champions, InsertChampion,
  matches, InsertMatch,
  matchPlayers, InsertMatchPlayer,
  syncLogs,
} from "../drizzle/schema";
import { ENV } from './_core/env';

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

// ─── User helpers ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Player helpers ───
export async function getAllPlayers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(players).orderBy(asc(players.name));
}

export async function getPlayerRanking() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(players);
  return result
    .map(p => ({
      ...p,
      total: p.wins + p.losses,
      winRate: p.wins + p.losses > 0 ? (p.wins / (p.wins + p.losses)) * 100 : 0,
      seriesTotal: p.seriesWins + p.seriesLosses,
      seriesWinRate: p.seriesWins + p.seriesLosses > 0 ? (p.seriesWins / (p.seriesWins + p.seriesLosses)) * 100 : 0,
    }))
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.total - a.total;
    });
}

export async function createPlayer(data: { name: string; wins?: number; losses?: number; seriesWins?: number; seriesLosses?: number; mainPosition?: string; memo?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(players).values({
    name: data.name,
    wins: data.wins ?? 0,
    losses: data.losses ?? 0,
    seriesWins: data.seriesWins ?? 0,
    seriesLosses: data.seriesLosses ?? 0,
    mainPosition: data.mainPosition ?? null,
    memo: data.memo ?? null,
  });
  const result = await db.select().from(players).where(eq(players.name, data.name)).limit(1);
  return result[0];
}

export async function updatePlayer(id: number, data: { name?: string; wins?: number; losses?: number; seriesWins?: number; seriesLosses?: number; mainPosition?: string; memo?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.wins !== undefined) updateData.wins = data.wins;
  if (data.losses !== undefined) updateData.losses = data.losses;
  if (data.seriesWins !== undefined) updateData.seriesWins = data.seriesWins;
  if (data.seriesLosses !== undefined) updateData.seriesLosses = data.seriesLosses;
  if (data.mainPosition !== undefined) updateData.mainPosition = data.mainPosition;
  if (data.memo !== undefined) updateData.memo = data.memo;
  await db.update(players).set(updateData).where(eq(players.id, id));
  const result = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return result[0];
}

export async function deletePlayer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(players).where(eq(players.id, id));
  return { success: true };
}

// ─── Champion helpers ───
export async function getAllChampions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(champions).orderBy(asc(champions.name));
}

export async function getChampionRanking() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(champions);
  return result
    .map(c => ({
      ...c,
      total: c.wins + c.losses,
      winRate: c.wins + c.losses > 0 ? (c.wins / (c.wins + c.losses)) * 100 : 0,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return b.winRate - a.winRate;
    });
}

export async function createChampion(data: { name: string; wins?: number; losses?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(champions).values({
    name: data.name,
    wins: data.wins ?? 0,
    losses: data.losses ?? 0,
  });
  const result = await db.select().from(champions).where(eq(champions.name, data.name)).limit(1);
  return result[0];
}

export async function updateChampion(id: number, data: { name?: string; wins?: number; losses?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.wins !== undefined) updateData.wins = data.wins;
  if (data.losses !== undefined) updateData.losses = data.losses;
  await db.update(champions).set(updateData).where(eq(champions.id, id));
  const result = await db.select().from(champions).where(eq(champions.id, id)).limit(1);
  return result[0];
}

export async function deleteChampion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(champions).where(eq(champions.id, id));
  return { success: true };
}

// ─── Match helpers ───
export async function getAllMatches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(matches).orderBy(desc(matches.id));
}

export async function getMatchWithPlayers(matchId: number) {
  const db = await getDb();
  if (!db) return null;
  const matchResult = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (matchResult.length === 0) return null;
  const playersResult = await db.select().from(matchPlayers).where(eq(matchPlayers.matchId, matchId));
  return {
    ...matchResult[0],
    players: playersResult,
  };
}

export async function createMatch(data: {
  matchDate: string;
  title?: string;
  team1Name?: string;
  team2Name?: string;
  winner: number;
  players: { playerName: string; team: number; champion?: string; position?: string }[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const matchInsert = await db.insert(matches).values({
    matchDate: data.matchDate,
    title: data.title ?? null,
    team1Name: data.team1Name ?? "팀 1",
    team2Name: data.team2Name ?? "팀 2",
    winner: data.winner,
  });
  const matchId = (matchInsert as any)[0].insertId;
  if (data.players && data.players.length > 0) {
    await db.insert(matchPlayers).values(
      data.players.map(p => ({
        matchId,
        playerName: p.playerName,
        team: p.team,
        champion: p.champion ?? null,
        position: p.position ?? null,
      }))
    );
  }
  return getMatchWithPlayers(matchId);
}

export async function deleteMatch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(matchPlayers).where(eq(matchPlayers.matchId, id));
  await db.delete(matches).where(eq(matches.id, id));
  return { success: true };
}

// ─── Sync helpers ───
export async function upsertPlayerBulk(data: { name: string; wins: number; losses: number; seriesWins?: number; seriesLosses?: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let count = 0;
  for (const p of data) {
    const values: any = { name: p.name, wins: p.wins, losses: p.losses };
    const updateSet: any = { wins: p.wins, losses: p.losses };
    if (p.seriesWins !== undefined) { values.seriesWins = p.seriesWins; updateSet.seriesWins = p.seriesWins; }
    if (p.seriesLosses !== undefined) { values.seriesLosses = p.seriesLosses; updateSet.seriesLosses = p.seriesLosses; }
    await db.insert(players).values(values)
      .onDuplicateKeyUpdate({ set: updateSet });
    count++;
  }
  return count;
}

export async function upsertChampionBulk(data: { name: string; wins: number; losses: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let count = 0;
  for (const c of data) {
    await db.insert(champions).values({ name: c.name, wins: c.wins, losses: c.losses })
      .onDuplicateKeyUpdate({ set: { wins: c.wins, losses: c.losses } });
    count++;
  }
  return count;
}

export async function createSyncLog(data: { syncType: string; status: string; message?: string; playersCount?: number; championsCount?: number; matchesCount?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(syncLogs).values({
    syncType: data.syncType,
    status: data.status,
    message: data.message ?? null,
    playersCount: data.playersCount ?? 0,
    championsCount: data.championsCount ?? 0,
    matchesCount: data.matchesCount ?? 0,
  });
}

export async function getRecentSyncLogs(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(syncLogs).orderBy(desc(syncLogs.id)).limit(limit);
}

// ─── Dashboard summary ───
export async function getDashboardSummary() {
  const db = await getDb();
  if (!db) return { totalPlayers: 0, totalChampions: 0, totalMatches: 0, topPlayers: [], recentMatches: [] };
  const [playerCount] = await db.select({ count: sql<number>`count(*)` }).from(players);
  const [championCount] = await db.select({ count: sql<number>`count(*)` }).from(champions);
  const [matchCount] = await db.select({ count: sql<number>`count(*)` }).from(matches);
  const allPlayers = await db.select().from(players);
  const topPlayers = allPlayers
    .map(p => ({
      ...p,
      total: p.wins + p.losses,
      winRate: p.wins + p.losses > 0 ? (p.wins / (p.wins + p.losses)) * 100 : 0,
      seriesTotal: p.seriesWins + p.seriesLosses,
      seriesWinRate: p.seriesWins + p.seriesLosses > 0 ? (p.seriesWins / (p.seriesWins + p.seriesLosses)) * 100 : 0,
    }))
    .sort((a, b) => b.winRate !== a.winRate ? b.winRate - a.winRate : b.total - a.total)
    .slice(0, 5);
  const recentMatches = await db.select().from(matches).orderBy(desc(matches.id)).limit(5);
  return {
    totalPlayers: playerCount.count,
    totalChampions: championCount.count,
    totalMatches: matchCount.count,
    topPlayers,
    recentMatches,
  };
}
