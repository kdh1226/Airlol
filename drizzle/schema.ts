import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 플레이어 테이블 - 내전방 참가자 정보
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  mainPosition: varchar("mainPosition", { length: 50 }),
  memo: text("memo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * 챔피언 통계 테이블
 */
export const champions = mysqlTable("champions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Champion = typeof champions.$inferSelect;
export type InsertChampion = typeof champions.$inferInsert;

/**
 * 경기 기록 테이블
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  matchDate: varchar("matchDate", { length: 20 }).notNull(),
  title: varchar("title", { length: 200 }),
  team1Name: varchar("team1Name", { length: 100 }).default("팀 1").notNull(),
  team2Name: varchar("team2Name", { length: 100 }).default("팀 2").notNull(),
  winner: int("winner").notNull(), // 1 or 2
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * 경기 참가 플레이어 테이블
 */
export const matchPlayers = mysqlTable("match_players", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  team: int("team").notNull(), // 1 or 2
  champion: varchar("champion", { length: 100 }),
  position: varchar("position", { length: 50 }),
});

export type MatchPlayer = typeof matchPlayers.$inferSelect;
export type InsertMatchPlayer = typeof matchPlayers.$inferInsert;

/**
 * 동기화 로그 테이블
 */
export const syncLogs = mysqlTable("sync_logs", {
  id: int("id").autoincrement().primaryKey(),
  syncType: varchar("syncType", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  message: text("message"),
  playersCount: int("playersCount").default(0),
  championsCount: int("championsCount").default(0),
  matchesCount: int("matchesCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SyncLog = typeof syncLogs.$inferSelect;
