import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";
import { Link } from "wouter";

export default function Ranking() {
  const { data: players, isLoading } = trpc.player.ranking.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">순위 랭킹</h1>
          <p className="text-muted-foreground mt-1">PS 점수 기준 플레이어 순위</p>
        </div>
        <Card className="bg-card border-border animate-pulse"><CardContent className="p-6"><div className="h-64 bg-muted rounded" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">순위 랭킹</h1>
        <p className="text-muted-foreground mt-1">객관적 티어표 (PS 점수) 기준 순위</p>
      </div>

      {/* Top 3 Podium */}
      {players && players.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[1, 0, 2].map(idx => {
            const player = players[idx];
            if (!player) return null;
            const isFirst = idx === 0;
            const psScore = Number(player.psScore) || 0;
            return (
              <div key={player.id} className={`flex flex-col items-center ${isFirst ? "order-1 -mt-4" : idx === 1 ? "order-0 mt-4" : "order-2 mt-4"}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                  isFirst ? "bg-primary/20 border-2 border-primary" : "bg-secondary border border-border"
                }`}>
                  <span className={`text-2xl font-black ${isFirst ? "text-primary" : "text-muted-foreground"}`}>
                    {idx + 1}
                  </span>
                </div>
                <Link href={`/player/${encodeURIComponent(player.name)}`} className={`font-bold text-center hover:text-gold transition-colors ${isFirst ? "text-primary text-lg" : "text-foreground"}`}>{player.name}</Link>
                <p className={`text-sm font-semibold ${psScore >= 110 ? "text-win" : psScore >= 100 ? "text-primary" : psScore >= 90 ? "text-foreground" : "text-lose"}`}>
                  {psScore.toFixed(1)}점
                </p>
                <p className="text-xs text-muted-foreground">{player.wins}승 {player.losses}패 ({player.winRate.toFixed(1)}%)</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Ranking Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            전체 순위
          </CardTitle>
        </CardHeader>
        <CardContent>
          {players && players.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">순위</th>
                    <th className="text-left py-3 px-3 text-sm font-semibold text-muted-foreground whitespace-nowrap min-w-[80px]">이름</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">PS 점수</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">포지션</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold text-win whitespace-nowrap">승</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold text-lose whitespace-nowrap">패</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">판수</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold text-muted-foreground whitespace-nowrap">승률</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold text-lol-blue-light whitespace-nowrap">시리즈</th>
                    <th className="text-center py-3 px-3 text-sm font-semibold text-lol-blue-light whitespace-nowrap">시리즈 승률</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, idx) => {
                    const psScore = Number(player.psScore) || 0;
                    return (
                      <tr key={player.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                            idx === 0 ? "bg-primary/20 text-primary" :
                            idx === 1 ? "bg-muted text-foreground" :
                            idx === 2 ? "bg-muted text-foreground" :
                            "text-muted-foreground"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">
                          <Link href={`/player/${encodeURIComponent(player.name)}`} className="hover:text-gold transition-colors underline-offset-2 hover:underline">
                            {player.name}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`font-bold ${psScore >= 110 ? "text-win" : psScore >= 100 ? "text-primary" : psScore >= 90 ? "text-foreground" : psScore >= 80 ? "text-muted-foreground" : "text-lose"}`}>
                            {psScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {player.mainPosition ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-lol-blue/10 text-lol-blue-light">{player.mainPosition}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-win font-medium whitespace-nowrap">{player.wins}</td>
                        <td className="py-3 px-3 text-center text-lose font-medium whitespace-nowrap">{player.losses}</td>
                        <td className="py-3 px-3 text-center text-muted-foreground whitespace-nowrap">{player.total}</td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`font-bold ${player.winRate >= 60 ? "text-win" : player.winRate >= 50 ? "text-primary" : "text-lose"}`}>
                            {player.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {player.seriesTotal > 0 ? (
                            <span className="text-sm text-lol-blue-light">
                              {player.seriesWins}승 {player.seriesLosses}패
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {player.seriesTotal > 0 ? (
                            <span className={`font-bold text-sm ${player.seriesWinRate >= 60 ? "text-win" : player.seriesWinRate >= 50 ? "text-primary" : "text-lose"}`}>
                              {player.seriesWinRate.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Medal className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>아직 등록된 플레이어가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
