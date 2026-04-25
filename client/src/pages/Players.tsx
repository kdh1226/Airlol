import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const POSITIONS = ["탑", "정글", "미드", "원딜", "서포터", "필"];

export default function Players() {
  const { isAdmin } = useAdminAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: players, isLoading } = trpc.player.list.useQuery();
  const createMutation = trpc.player.create.useMutation({
    onSuccess: () => { utils.player.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("플레이어가 추가되었습니다."); setShowAdd(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.player.update.useMutation({
    onSuccess: () => { utils.player.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("플레이어가 수정되었습니다."); setEditId(null); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.player.delete.useMutation({
    onSuccess: () => { utils.player.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("플레이어가 삭제되었습니다."); },
    onError: (err) => toast.error(err.message),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [seriesWins, setSeriesWins] = useState(0);
  const [seriesLosses, setSeriesLosses] = useState(0);
  const [mainPosition, setMainPosition] = useState("");
  const [memo, setMemo] = useState("");

  const resetForm = () => { setName(""); setWins(0); setLosses(0); setSeriesWins(0); setSeriesLosses(0); setMainPosition(""); setMemo(""); };

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    if (!search) return players;
    return players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [players, search]);

  const startEdit = (player: any) => {
    setEditId(player.id);
    setName(player.name);
    setWins(player.wins);
    setLosses(player.losses);
    setSeriesWins(player.seriesWins || 0);
    setSeriesLosses(player.seriesLosses || 0);
    setMainPosition(player.mainPosition || "");
    setMemo(player.memo || "");
  };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("이름을 입력해주세요."); return; }
    createMutation.mutate({ name: name.trim(), wins, losses, seriesWins, seriesLosses, mainPosition: mainPosition || undefined, memo: memo || undefined });
  };

  const handleUpdate = () => {
    if (editId === null) return;
    if (!name.trim()) { toast.error("이름을 입력해주세요."); return; }
    updateMutation.mutate({ id: editId, name: name.trim(), wins, losses, seriesWins, seriesLosses, mainPosition: mainPosition || undefined, memo: memo || undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">플레이어 관리</h1>
          <p className="text-muted-foreground mt-1">플레이어 추가, 수정, 삭제</p>
        </div>
        {isAdmin && (
          <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-gold-dark gap-2">
                <Plus className="h-4 w-4" /> 플레이어 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">새 플레이어 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div><Label className="text-foreground">이름 *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="플레이어 이름" className="bg-input border-border text-foreground mt-1" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-foreground">승</Label><Input type="number" min={0} value={wins} onChange={e => setWins(Number(e.target.value))} className="bg-input border-border text-foreground mt-1" /></div>
                  <div><Label className="text-foreground">패</Label><Input type="number" min={0} value={losses} onChange={e => setLosses(Number(e.target.value))} className="bg-input border-border text-foreground mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-foreground">시리즈 승</Label><Input type="number" min={0} value={seriesWins} onChange={e => setSeriesWins(Number(e.target.value))} className="bg-input border-border text-foreground mt-1" /></div>
                  <div><Label className="text-foreground">시리즈 패</Label><Input type="number" min={0} value={seriesLosses} onChange={e => setSeriesLosses(Number(e.target.value))} className="bg-input border-border text-foreground mt-1" /></div>
                </div>
                <div>
                  <Label className="text-foreground">주 포지션</Label>
                  <Select value={mainPosition} onValueChange={setMainPosition}>
                    <SelectTrigger className="bg-input border-border text-foreground mt-1"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-foreground">메모</Label><Input value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모 (선택)" className="bg-input border-border text-foreground mt-1" /></div>
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="플레이어 검색..." className="pl-10 bg-input border-border text-foreground" />
      </div>

      {/* Player List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="bg-card border-border animate-pulse"><CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">{search ? "검색 결과가 없습니다." : "아직 등록된 플레이어가 없습니다."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map(player => {
            const total = player.wins + player.losses;
            const winRate = total > 0 ? (player.wins / total) * 100 : 0;
            const isEditing = editId === player.id;

            if (isEditing && isAdmin) {
              return (
                <Card key={player.id} className="bg-card border-primary/50">
                  <CardContent className="p-4 space-y-3">
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="이름" className="bg-input border-border text-foreground" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" min={0} value={wins} onChange={e => setWins(Number(e.target.value))} placeholder="승" className="bg-input border-border text-foreground" />
                      <Input type="number" min={0} value={losses} onChange={e => setLosses(Number(e.target.value))} placeholder="패" className="bg-input border-border text-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" min={0} value={seriesWins} onChange={e => setSeriesWins(Number(e.target.value))} placeholder="시리즈 승" className="bg-input border-border text-foreground" />
                      <Input type="number" min={0} value={seriesLosses} onChange={e => setSeriesLosses(Number(e.target.value))} placeholder="시리즈 패" className="bg-input border-border text-foreground" />
                    </div>
                    <Select value={mainPosition} onValueChange={setMainPosition}>
                      <SelectTrigger className="bg-input border-border text-foreground"><SelectValue placeholder="포지션" /></SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {POSITIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모" className="bg-input border-border text-foreground" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending} className="flex-1 bg-primary text-primary-foreground hover:bg-gold-dark">저장</Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditId(null); resetForm(); }} className="flex-1 border-border text-foreground">취소</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={player.id} className="bg-card border-border hover:border-primary/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg cursor-pointer hover:text-primary transition-colors" onClick={() => setLocation(`/player/${encodeURIComponent(player.name)}`)}>{player.name}</h3>
                      {player.mainPosition && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-lol-blue/10 text-lol-blue-light mt-1 inline-block">{player.mainPosition}</span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(player)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate({ id: player.id }); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-win font-medium">{player.wins}승</span>
                    <span className="text-lose font-medium">{player.losses}패</span>
                    <span className={`font-bold ${winRate >= 60 ? "text-win" : winRate >= 50 ? "text-primary" : "text-lose"}`}>
                      {winRate.toFixed(1)}%
                    </span>
                  </div>
                  {(player.seriesWins > 0 || player.seriesLosses > 0) && (
                    <div className="flex items-center gap-2 text-xs mt-1.5">
                      <span className="text-lol-blue-light font-medium">시리즈</span>
                      <span className="text-win">{player.seriesWins}승</span>
                      <span className="text-lose">{player.seriesLosses}패</span>
                      <span className={`font-bold ${(player.seriesWins / (player.seriesWins + player.seriesLosses)) * 100 >= 50 ? "text-lol-blue-light" : "text-lose"}`}>
                        {((player.seriesWins / (player.seriesWins + player.seriesLosses)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="stat-bar mt-2">
                    <div
                      className="stat-bar-fill"
                      style={{
                        width: `${winRate}%`,
                        background: winRate >= 60 ? "oklch(0.65 0.18 155)" : winRate >= 50 ? "oklch(0.82 0.12 85)" : "oklch(0.6 0.2 25)",
                      }}
                    />
                  </div>
                  {player.memo && <p className="text-xs text-muted-foreground mt-2 truncate">{player.memo}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
