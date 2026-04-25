import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Swords, Shield, Target, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";

const POSITION_ICONS: Record<string, string> = {
  "탑": "🛡️",
  "정글": "🌿",
  "미드": "⚡",
  "원딜": "🎯",
  "서폿": "💚",
};

const POSITION_ORDER = ["탑", "정글", "미드", "원딜", "서폿"];

function WinRateBar({ wins, losses, size = "md" }: { wins: number; losses: number; size?: "sm" | "md" }) {
  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={`w-full ${h} rounded-full bg-secondary overflow-hidden`}>
      <div
        className={`${h} rounded-full transition-all duration-500`}
        style={{
          width: `${winRate}%`,
          background: winRate >= 60 ? "oklch(0.65 0.18 155)" : winRate >= 50 ? "oklch(0.82 0.12 85)" : "oklch(0.6 0.2 25)",
        }}
      />
    </div>
  );
}

function WinRateText({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const color = winRate >= 60 ? "text-win" : winRate >= 50 ? "text-primary" : "text-lose";
  return <span className={`font-bold ${color}`}>{winRate.toFixed(1)}%</span>;
}

export default function PlayerDetail() {
  const [, params] = useRoute("/player/:name");
  const playerName = params?.name ? decodeURIComponent(params.name) : "";
  const { data: player, isLoading } = trpc.player.detail.useQuery(
    { name: playerName },
    { enabled: !!playerName }
  );
  const [activePosition, setActivePosition] = useState<string>("all");

  const sortedPositions = useMemo(() => {
    if (!player?.positionStats) return [];
    return [...player.positionStats].sort((a, b) => {
      const aIdx = POSITION_ORDER.indexOf(a.position);
      const bIdx = POSITION_ORDER.indexOf(b.position);
      return aIdx - bIdx;
    });
  }, [player?.positionStats]);

  const filteredMatchups = useMemo(() => {
    if (!player?.matchupStats) return [];
    if (activePosition === "all") return player.matchupStats;
    return player.matchupStats.filter(m => m.position === activePosition);
  }, [player?.matchupStats, activePosition]);

  const filteredChampions = useMemo(() => {
    if (!player?.championStats) return [];
    if (activePosition === "all") return player.championStats;
    return player.championStats.filter(c => c.position === activePosition);
  }, [player?.championStats, activePosition]);

  const sortedMatchups = useMemo(() => {
    return [...filteredMatchups].sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
  }, [filteredMatchups]);

  const sortedChampions = useMemo(() => {
    return [...filteredChampions].sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
  }, [filteredChampions]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="p-6">
        <Link href="/ranking" className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold mb-4">
          <ArrowLeft className="w-4 h-4" /> 순위 랭킹으로 돌아가기
        </Link>
        <p className="text-muted-foreground">플레이어를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Back button */}
      <Link href="/ranking" className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors">
        <ArrowLeft className="w-4 h-4" /> 순위 랭킹
      </Link>

      {/* Player header */}
      <div className="card-lol p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-2xl font-bold text-background">
            {player.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gold-gradient">{player.name}</h1>
            {player.mainPosition && (
              <p className="text-muted-foreground mt-1">
                {POSITION_ICONS[player.mainPosition] || ""} {player.mainPosition}
              </p>
            )}
          </div>
          <div className="flex gap-6 md:gap-8">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">총 전적</p>
              <p className="text-lg font-bold">
                <span className="text-win">{player.wins}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-lose">{player.losses}</span>
              </p>
              <WinRateText wins={player.wins} losses={player.losses} />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">시리즈</p>
              <p className="text-lg font-bold">
                <span className="text-win">{player.seriesWins}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-lose">{player.seriesLosses}</span>
              </p>
              <WinRateText wins={player.seriesWins} losses={player.seriesLosses} />
            </div>
          </div>
        </div>
      </div>

      {/* Position stats */}
      {sortedPositions.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold" /> 포지션별 전적
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {sortedPositions.map(pos => {
                const total = pos.wins + pos.losses;
                const winRate = total > 0 ? (pos.wins / total) * 100 : 0;
                return (
                  <div key={pos.position} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {POSITION_ICONS[pos.position] || ""} {pos.position}
                      </span>
                      <span className="text-xs text-muted-foreground">{total}판</span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm">
                        <span className="text-win">{pos.wins}승</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-lose">{pos.losses}패</span>
                      </span>
                      <WinRateText wins={pos.wins} losses={pos.losses} />
                    </div>
                    <WinRateBar wins={pos.wins} losses={pos.losses} size="sm" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for matchups and champions */}
      <Tabs defaultValue="champions" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <TabsList className="bg-secondary">
            <TabsTrigger value="champions">챔피언별 전적</TabsTrigger>
            <TabsTrigger value="matchups">상대전적</TabsTrigger>
          </TabsList>

          {/* Position filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setActivePosition("all")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activePosition === "all"
                  ? "bg-gold text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              전체
            </button>
            {sortedPositions.map(pos => (
              <button
                key={pos.position}
                onClick={() => setActivePosition(pos.position)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activePosition === pos.position
                    ? "bg-gold text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {POSITION_ICONS[pos.position]} {pos.position}
              </button>
            ))}
          </div>
        </div>

        {/* Champions tab */}
        <TabsContent value="champions">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Swords className="w-5 h-5 text-gold" /> 챔피언별 전적
                <span className="text-sm font-normal text-muted-foreground">({sortedChampions.length}개)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedChampions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">데이터가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-3 whitespace-nowrap">챔피언</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">포지션</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">승</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">패</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">판수</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">승률</th>
                        <th className="py-2 px-2 w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedChampions.map((champ, i) => {
                        const total = champ.wins + champ.losses;
                        const winRate = total > 0 ? (champ.wins / total) * 100 : 0;
                        return (
                          <tr key={`${champ.position}-${champ.championName}-${i}`} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-2 px-3 font-medium whitespace-nowrap">{champ.championName}</td>
                            <td className="py-2 px-2 text-center text-xs text-muted-foreground whitespace-nowrap">
                              {POSITION_ICONS[champ.position]} {champ.position}
                            </td>
                            <td className="py-2 px-2 text-center text-win">{champ.wins}</td>
                            <td className="py-2 px-2 text-center text-lose">{champ.losses}</td>
                            <td className="py-2 px-2 text-center">{total}</td>
                            <td className="py-2 px-2 text-center">
                              <WinRateText wins={champ.wins} losses={champ.losses} />
                            </td>
                            <td className="py-2 px-2">
                              <WinRateBar wins={champ.wins} losses={champ.losses} size="sm" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matchups tab */}
        <TabsContent value="matchups">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-gold" /> 상대전적
                <span className="text-sm font-normal text-muted-foreground">({sortedMatchups.length}개)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedMatchups.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">데이터가 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-3 whitespace-nowrap">상대</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">포지션</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">승</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">패</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">판수</th>
                        <th className="text-center py-2 px-2 whitespace-nowrap">승률</th>
                        <th className="py-2 px-2 w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMatchups.map((matchup, i) => {
                        const total = matchup.wins + matchup.losses;
                        return (
                          <tr key={`${matchup.position}-${matchup.opponentName}-${i}`} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-2 px-3 font-medium whitespace-nowrap">
                              <Link href={`/player/${encodeURIComponent(matchup.opponentName)}`} className="hover:text-gold transition-colors">
                                {matchup.opponentName}
                              </Link>
                            </td>
                            <td className="py-2 px-2 text-center text-xs text-muted-foreground whitespace-nowrap">
                              {POSITION_ICONS[matchup.position]} {matchup.position}
                            </td>
                            <td className="py-2 px-2 text-center text-win">{matchup.wins}</td>
                            <td className="py-2 px-2 text-center text-lose">{matchup.losses}</td>
                            <td className="py-2 px-2 text-center">{total}</td>
                            <td className="py-2 px-2 text-center">
                              <WinRateText wins={matchup.wins} losses={matchup.losses} />
                            </td>
                            <td className="py-2 px-2">
                              <WinRateBar wins={matchup.wins} losses={matchup.losses} size="sm" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
