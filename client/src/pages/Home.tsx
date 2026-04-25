import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Swords, ScrollText, Trophy } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { data, isLoading } = trpc.dashboard.summary.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">대시보드</h1>
          <p className="text-muted-foreground mt-1">내전 전적 요약</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "총 플레이어", value: data?.totalPlayers ?? 0, icon: Users, color: "text-lol-blue-light", bg: "bg-lol-blue/10", path: "/players" },
    { label: "총 챔피언", value: data?.totalChampions ?? 0, icon: Swords, color: "text-primary", bg: "bg-primary/10", path: "/champions" },
    { label: "총 경기 수", value: data?.totalMatches ?? 0, icon: ScrollText, color: "text-win", bg: "bg-win/10", path: "/matches" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">대시보드</h1>
        <p className="text-muted-foreground mt-1">내전 전적 요약</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(stat => (
          <Card
            key={stat.label}
            className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setLocation(stat.path)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1 text-foreground">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Players */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              상위 플레이어
            </CardTitle>
            <button
              onClick={() => setLocation("/ranking")}
              className="text-sm text-primary hover:text-gold-light transition-colors"
            >
              전체 보기 →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.topPlayers && data.topPlayers.length > 0 ? (
            <div className="space-y-3">
              {data.topPlayers.map((player, idx) => {
                const total = player.wins + player.losses;
                const winRate = total > 0 ? (player.wins / total) * 100 : 0;
                return (
                  <div key={player.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer" onClick={() => setLocation(`/player/${encodeURIComponent(player.name)}`)}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? "bg-primary/20 text-primary" :
                      idx === 1 ? "bg-muted text-muted-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.wins}승 {player.losses}패</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">
                        {Number((player as any).psScore) > 0 ? `${Number((player as any).psScore).toFixed(1)}점` : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">{player.wins}승 {player.losses}패</p>
                    </div>
                    <div className="w-24 hidden sm:block">
                      <div className="stat-bar">
                        <div
                          className="stat-bar-fill"
                          style={{
                            width: `${winRate}%`,
                            background: winRate >= 60
                              ? "oklch(0.65 0.18 155)"
                              : winRate >= 50
                              ? "oklch(0.82 0.12 85)"
                              : "oklch(0.6 0.2 25)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>아직 등록된 플레이어가 없습니다.</p>
              <button
                onClick={() => setLocation("/players")}
                className="text-primary hover:text-gold-light mt-2 text-sm transition-colors"
              >
                플레이어 추가하기 →
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Matches */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-lol-blue" />
              최근 경기
            </CardTitle>
            <button
              onClick={() => setLocation("/matches")}
              className="text-sm text-primary hover:text-gold-light transition-colors"
            >
              전체 보기 →
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.recentMatches && data.recentMatches.length > 0 ? (
            <div className="space-y-2">
              {data.recentMatches.map(match => (
                <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20">{match.matchDate}</span>
                    <span className="font-medium text-foreground">{match.title || `${match.team1Name} vs ${match.team2Name}`}</span>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    match.winner === 1 ? "badge-win" : "badge-lose"
                  }`}>
                    {match.winner === 1 ? match.team1Name : match.team2Name} 승리
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>아직 등록된 경기가 없습니다.</p>
              <button
                onClick={() => setLocation("/matches")}
                className="text-primary hover:text-gold-light mt-2 text-sm transition-colors"
              >
                경기 기록 추가하기 →
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
