import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollText, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type MatchPlayerInput = {
  playerName: string;
  team: number;
  champion: string;
  position: string;
};

export default function Matches() {
  const { isAdmin } = useAdminAuth();
  const utils = trpc.useUtils();
  const { data: matchList, isLoading } = trpc.match.list.useQuery();
  const createMutation = trpc.match.create.useMutation({
    onSuccess: () => {
      utils.match.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("경기가 추가되었습니다.");
      setShowAdd(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.match.delete.useMutation({
    onSuccess: () => {
      utils.match.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("경기가 삭제되었습니다.");
    },
    onError: (err) => toast.error(err.message),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [title, setTitle] = useState("");
  const [team1Name, setTeam1Name] = useState("팀 1");
  const [team2Name, setTeam2Name] = useState("팀 2");
  const [winner, setWinner] = useState("1");
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayerInput[]>([
    { playerName: "", team: 1, champion: "", position: "" },
  ]);

  const resetForm = () => {
    setMatchDate(new Date().toISOString().split("T")[0]);
    setTitle("");
    setTeam1Name("팀 1");
    setTeam2Name("팀 2");
    setWinner("1");
    setMatchPlayers([{ playerName: "", team: 1, champion: "", position: "" }]);
  };

  const addPlayer = () => {
    setMatchPlayers([...matchPlayers, { playerName: "", team: 1, champion: "", position: "" }]);
  };

  const removePlayer = (idx: number) => {
    setMatchPlayers(matchPlayers.filter((_, i) => i !== idx));
  };

  const updatePlayer = (idx: number, field: keyof MatchPlayerInput, value: string | number) => {
    const updated = [...matchPlayers];
    (updated[idx] as any)[field] = value;
    setMatchPlayers(updated);
  };

  const handleCreate = () => {
    if (!matchDate) { toast.error("날짜를 입력해주세요."); return; }
    const validPlayers = matchPlayers.filter(p => p.playerName.trim());
    createMutation.mutate({
      matchDate,
      title: title || undefined,
      team1Name,
      team2Name,
      winner: parseInt(winner),
      players: validPlayers.map(p => ({
        playerName: p.playerName.trim(),
        team: p.team,
        champion: p.champion || undefined,
        position: p.position || undefined,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">경기 기록</h1>
          <p className="text-muted-foreground mt-1">날짜별 경기 결과 조회</p>
        </div>
        {isAdmin && (
          <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-gold-dark gap-2">
                <Plus className="h-4 w-4" /> 경기 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">새 경기 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-foreground">날짜 *</Label><Input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="bg-input border-border text-foreground mt-1" /></div>
                  <div><Label className="text-foreground">제목</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="경기 제목 (선택)" className="bg-input border-border text-foreground mt-1" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label className="text-foreground">팀 1 이름</Label><Input value={team1Name} onChange={e => setTeam1Name(e.target.value)} className="bg-input border-border text-foreground mt-1" /></div>
                  <div><Label className="text-foreground">팀 2 이름</Label><Input value={team2Name} onChange={e => setTeam2Name(e.target.value)} className="bg-input border-border text-foreground mt-1" /></div>
                  <div>
                    <Label className="text-foreground">승리 팀 *</Label>
                    <Select value={winner} onValueChange={setWinner}>
                      <SelectTrigger className="bg-input border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="1">{team1Name}</SelectItem>
                        <SelectItem value="2">{team2Name}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Players */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground font-semibold">참가 플레이어</Label>
                    <Button size="sm" variant="outline" onClick={addPlayer} className="border-border text-foreground gap-1 h-7">
                      <Plus className="h-3 w-3" /> 추가
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {matchPlayers.map((mp, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input value={mp.playerName} onChange={e => updatePlayer(idx, "playerName", e.target.value)} placeholder="이름" className="bg-input border-border text-foreground flex-1" />
                        <Select value={String(mp.team)} onValueChange={v => updatePlayer(idx, "team", parseInt(v))}>
                          <SelectTrigger className="bg-input border-border text-foreground w-24"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value="1">팀 1</SelectItem>
                            <SelectItem value="2">팀 2</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input value={mp.champion} onChange={e => updatePlayer(idx, "champion", e.target.value)} placeholder="챔피언" className="bg-input border-border text-foreground w-28" />
                        <Input value={mp.position} onChange={e => updatePlayer(idx, "position", e.target.value)} placeholder="포지션" className="bg-input border-border text-foreground w-20" />
                        {matchPlayers.length > 1 && (
                          <button onClick={() => removePlayer(idx)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }} className="border-border text-foreground">취소</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary text-primary-foreground hover:bg-gold-dark">
                  {createMutation.isPending ? "추가 중..." : "추가"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Match List */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-lol-blue" />
            경기 목록 ({matchList?.length ?? 0}경기)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 bg-muted rounded animate-pulse" />
          ) : !matchList || matchList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>아직 등록된 경기가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matchList.map(match => (
                <MatchItem
                  key={match.id}
                  match={match}
                  isExpanded={expandedMatch === match.id}
                  onToggle={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                  onDelete={() => { if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate({ id: match.id }); }}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MatchItem({ match, isExpanded, onToggle, onDelete, isAdmin }: {
  match: any;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const { data: detail } = trpc.match.detail.useQuery(
    { id: match.id },
    { enabled: isExpanded }
  );

  return (
    <div className="rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4 flex-1">
          <span className="text-sm text-muted-foreground w-24 shrink-0">{match.matchDate}</span>
          <span className="font-medium text-foreground">{match.title || `${match.team1Name} vs ${match.team2Name}`}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${match.winner === 1 ? "badge-win" : "badge-lose"}`}>
            {match.winner === 1 ? match.team1Name : match.team2Name} 승리
          </span>
          {isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {isExpanded && detail?.players && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(teamNum => {
              const teamPlayers = detail.players.filter((p: any) => p.team === teamNum);
              const teamName = teamNum === 1 ? match.team1Name : match.team2Name;
              const isWinner = match.winner === teamNum;
              return (
                <div key={teamNum} className={`rounded-lg p-3 ${isWinner ? "bg-win/5 border border-win/20" : "bg-lose/5 border border-lose/20"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-bold ${isWinner ? "text-win" : "text-lose"}`}>{teamName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isWinner ? "badge-win" : "badge-lose"}`}>
                      {isWinner ? "승리" : "패배"}
                    </span>
                  </div>
                  {teamPlayers.length > 0 ? (
                    <div className="space-y-1">
                      {teamPlayers.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 text-sm">
                          <span className="text-foreground font-medium">{p.playerName}</span>
                          {p.champion && <span className="text-muted-foreground">- {p.champion}</span>}
                          {p.position && <span className="text-xs text-lol-blue-light px-1.5 py-0.5 rounded bg-lol-blue/10">{p.position}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">참가자 정보 없음</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
