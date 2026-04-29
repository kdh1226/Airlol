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

// Admin context with admin_mode cookie (new password-based auth)
function createAdminCookieContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie: "admin_mode=true",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

// Legacy auth context (OAuth user) - still supported
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

describe("Admin Auth API", () => {
  it("should check admin status as false for public user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.adminCheck();
    expect(result.isAdmin).toBe(false);
  });

  it("should check admin status as true when admin_mode cookie is set", async () => {
    const ctx = createAdminCookieContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.adminCheck();
    expect(result.isAdmin).toBe(true);
  });

  it("should reject adminLogin with wrong password", async () => {
    const ctx = createPublicContext();
    (ctx.res as any).cookie = () => {};
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.adminLogin({ password: "wrong" })
    ).rejects.toThrow();
  });

  it("should accept adminLogin with correct password", async () => {
    const ctx = createPublicContext();
    let cookieSet = false;
    (ctx.res as any).cookie = () => { cookieSet = true; };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.adminLogin({ password: "777" });
    expect(result.success).toBe(true);
    expect(cookieSet).toBe(true);
  });

  it("should clear admin_mode cookie on adminLogout", async () => {
    const ctx = createAdminCookieContext();
    let cookieCleared = false;
    (ctx.res as any).clearCookie = (name: string) => { if (name === "admin_mode") cookieCleared = true; };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.adminLogout();
    expect(result.success).toBe(true);
    expect(cookieCleared).toBe(true);
  });
});

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

  it("should create a player with admin_mode cookie", async () => {
    const ctx = createAdminCookieContext();
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

  it("should create a player with series stats via admin cookie", async () => {
    const ctx = createAdminCookieContext();
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

  it("should also allow player creation with OAuth user (backward compat)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const uniqueName = `OAuth테스트_${Date.now()}`;
    const result = await caller.player.create({
      name: uniqueName,
      wins: 5,
      losses: 3,
    });
    
    expect(result).toBeDefined();
  });

  it("should reject player creation without any auth", async () => {
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

  it("should create a champion with admin cookie", async () => {
    const ctx = createAdminCookieContext();
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

describe("Player Detail API", () => {
  it("should return player detail with position/matchup/champion stats", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.detail({ name: "김도형" });
    
    expect(result).toBeDefined();
    if (result) {
      expect(result.name).toBe("김도형");
      expect(typeof result.wins).toBe("number");
      expect(typeof result.losses).toBe("number");
      expect(typeof result.total).toBe("number");
      expect(typeof result.winRate).toBe("number");
      expect(typeof result.seriesTotal).toBe("number");
      expect(typeof result.seriesWinRate).toBe("number");
      expect(Array.isArray(result.positionStats)).toBe(true);
      expect(Array.isArray(result.matchupStats)).toBe(true);
      expect(Array.isArray(result.championStats)).toBe(true);
    }
  });

  it("should return position stats with correct fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.detail({ name: "김도형" });
    
    if (result && result.positionStats.length > 0) {
      const stat = result.positionStats[0];
      expect(stat).toHaveProperty("position");
      expect(stat).toHaveProperty("wins");
      expect(stat).toHaveProperty("losses");
      expect(typeof stat.position).toBe("string");
      expect(typeof stat.wins).toBe("number");
      expect(typeof stat.losses).toBe("number");
    }
  });

  it("should return champion stats with correct fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.detail({ name: "김도형" });
    
    if (result && result.championStats.length > 0) {
      const stat = result.championStats[0];
      expect(stat).toHaveProperty("championName");
      expect(stat).toHaveProperty("position");
      expect(stat).toHaveProperty("wins");
      expect(stat).toHaveProperty("losses");
    }
  });

  it("should return null for non-existent player", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.detail({ name: "존재하지않는플레이어" });
    expect(result).toBeNull();
  });
});

describe("PS Score Ranking", () => {
  it("should return player ranking sorted by PS score descending", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.ranking();
    
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const firstPlayer = result[0];
      expect(firstPlayer).toHaveProperty("psScore");
    }
    // Verify PS score descending order
    if (result.length >= 2) {
      for (let i = 0; i < result.length - 1; i++) {
        const scoreA = Number(result[i].psScore) || 0;
        const scoreB = Number(result[i + 1].psScore) || 0;
        if (scoreA !== scoreB) {
          expect(scoreA).toBeGreaterThanOrEqual(scoreB);
        }
      }
    }
  });

  it("should include PS score in player detail", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.player.detail({ name: "김도형" });
    
    if (result) {
      expect(result).toHaveProperty("psScore");
      const score = Number(result.psScore) || 0;
      expect(score).toBeGreaterThan(0);
    }
  });
});

describe("Dashboard Top Players PS Score", () => {
  it("should return top players sorted by PS score in dashboard summary", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.summary();
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.topPlayers)).toBe(true);
    if (result.topPlayers.length >= 2) {
      for (let i = 0; i < result.topPlayers.length - 1; i++) {
        const scoreA = Number((result.topPlayers[i] as any).psScore) || 0;
        const scoreB = Number((result.topPlayers[i + 1] as any).psScore) || 0;
        if (scoreA !== scoreB) {
          expect(scoreA).toBeGreaterThanOrEqual(scoreB);
        }
      }
    }
  });

  it("should include psScore field in top players", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.summary();
    
    if (result.topPlayers.length > 0) {
      const topPlayer = result.topPlayers[0] as any;
      expect(topPlayer).toHaveProperty("psScore");
    }
  });
});

describe("Sync Service", () => {
  it("should export parseCSV function correctly", async () => {
    const { parseCSV } = await import("./syncService");
    const result = parseCSV("a,b,c\n1,2,3");
    expect(result).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
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

  it("should merge duplicate champions by name when retrieving ranking", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // ranking 조회 - 중복 챔피언이 있으면 병합되어야 함
    const ranking = await caller.champion.ranking();
    
    // 챔피언 이름별 개수 확인 - 중복이 없어야 함
    const nameMap = new Map<string, number>();
    for (const champ of ranking) {
      nameMap.set(champ.name, (nameMap.get(champ.name) || 0) + 1);
    }
    
    // 모든 챔피언이 1번만 나타나야 함
    for (const [name, count] of nameMap) {
      expect(count).toBe(1);
    }
  });

  it("should merge duplicate champions by name when retrieving list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    
    // list 조회 - 중복 챔피언이 있으면 병합되어야 함
    const list = await caller.champion.list();
    
    // 챔피언 이름별 개수 확인 - 중복이 없어야 함
    const nameMap = new Map<string, number>();
    for (const champ of list) {
      nameMap.set(champ.name, (nameMap.get(champ.name) || 0) + 1);
    }
    
    // 모든 챔피언이 1번만 나타나야 함
    for (const [name, count] of nameMap) {
      expect(count).toBe(1);
    }
  });
});
