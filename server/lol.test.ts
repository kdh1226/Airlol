import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Dashboard API", () => {
  it("should return dashboard summary with public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.summary();
    
    expect(result).toBeDefined();
    expect(typeof result.totalPlayers).toBe("number");
    expect(typeof result.totalChampions).toBe("number");
    expect(typeof result.totalMatches).toBe("number");
    expect(result.totalPlayers).toBeGreaterThanOrEqual(0);
    expect(result.totalChampions).toBeGreaterThanOrEqual(0);
    expect(result.totalMatches).toBeGreaterThanOrEqual(0);
  });
});

describe("Player API", () => {
  it("should list players with public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return player ranking with public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.ranking();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return player ranking with series stats fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.ranking();
    
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const player = result[0];
      expect(player).toHaveProperty("seriesWins");
      expect(player).toHaveProperty("seriesLosses");
      expect(player).toHaveProperty("seriesTotal");
      expect(player).toHaveProperty("seriesWinRate");
      expect(typeof player.seriesWins).toBe("number");
      expect(typeof player.seriesLosses).toBe("number");
      expect(typeof player.seriesTotal).toBe("number");
      expect(typeof player.seriesWinRate).toBe("number");
    }
  });

  it("should create a player with authenticated access", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const uniqueName = `테스트플레이어_${Date.now()}`;
    const result = await caller.player.create({
      name: uniqueName,
      wins: 10,
      losses: 5,
      mainPosition: "미드",
    });
    
    expect(result).toBeDefined();
  });

  it("should create a player with series stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const uniqueName = `시리즈테스트_${Date.now()}`;
    const result = await caller.player.create({
      name: uniqueName,
      wins: 20,
      losses: 10,
      seriesWins: 8,
      seriesLosses: 4,
      mainPosition: "정글",
    });
    
    expect(result).toBeDefined();
    expect(result.seriesWins).toBe(8);
    expect(result.seriesLosses).toBe(4);
  });

  it("should reject player creation without auth", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.player.create({
        name: "무인증플레이어",
        wins: 0,
        losses: 0,
      })
    ).rejects.toThrow();
  });
});

describe("Champion API", () => {
  it("should list champions with public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.champion.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return champion ranking sorted by total games descending", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.champion.ranking();
    
    expect(Array.isArray(result)).toBe(true);
    if (result.length >= 2) {
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i].total !== result[i + 1].total) {
          expect(result[i].total).toBeGreaterThanOrEqual(result[i + 1].total);
        }
      }
    }
  });

  it("should create a champion with authenticated access", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const uniqueName = `가렌_${Date.now()}`;
    const result = await caller.champion.create({
      name: uniqueName,
      wins: 15,
      losses: 8,
    });
    
    expect(result).toBeDefined();
  });

  it("should reject champion creation without auth", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.champion.create({
        name: "무인증챔피언",
        wins: 0,
        losses: 0,
      })
    ).rejects.toThrow();
  });
});

describe("Match API", () => {
  it("should list matches with public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.match.list();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject match creation without auth", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.match.create({
        matchDate: "2026-04-25",
        winner: 1,
        players: [
          { playerName: "플레이어1", team: 1, champion: "가렌", position: "탑" },
          { playerName: "플레이어2", team: 2, champion: "다리우스", position: "탑" },
        ],
      })
    ).rejects.toThrow();
  });
});

describe("Sync API", () => {
  it("should list sync logs with public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sync.logs();
    
    expect(Array.isArray(result)).toBe(true);
  });

  it("should reject sync trigger without auth", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.sync.trigger({
        sheetUrl: "https://docs.google.com/spreadsheets/d/test",
      })
    ).rejects.toThrow();
  });
});
