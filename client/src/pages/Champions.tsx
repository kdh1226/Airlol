import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Swords, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Champions() {
  const utils = trpc.useUtils();
  const { data: champions, isLoading } = trpc.champion.ranking.useQuery();
  const createMutation = trpc.champion.create.useMutation({
    onSuccess: () => { utils.champion.ranking.invalidate(); utils.champion.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("챔피언이 추가되었습니다."); setShowAdd(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.champion.update.useMutation({
    onSuccess: () => { utils.champion.ranking.invalidate(); utils.champion.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("챔피언이 수정되었습니다."); setEditId(null); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.champion.delete.useMutation({
    onSuccess: () => { utils.champion.ranking.invalidate(); utils.champion.list.invalidate(); utils.dashboard.summary.invalidate(); toast.success("챔피언이 삭제되었습니다."); },
    onError: (err) => toast.error(err.message),
  });

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  const resetForm = () => { setName(""); setWins(0); setLosses(0); };

  const filteredChampions = useMemo(() => {
    if (!champions) return [];
    if (!search) return champions;
    return champions.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [champions, search]);

  const startEdit = (champ: any) => { setEditId(champ.id); setName(champ.name); setWins(champ.wins); setLosses(champ.losses); };

  const handleCreate = () => {
    if (!name.trim()) { toast.error("챔피언 이름을 입력해주세요."); return; }
    createMutation.mutate({ name: name.trim(), wins, losses });
  };

  const handleUpdate = () => {
    if (editId === null) return;
    updateMutation.mutate({ id: editId, name: name.trim(), wins, losses });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">챔피언 통계</h1>
          <p className="text-muted-foreground mt-1">챔피언별 승률 통계</p>
        </div>
        <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-gold-dark gap-2">
              <Plus className="h-4 w-4" /> 챔피언 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">새 챔피언 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label className="text-foreground">챔피언 이름 *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="챔피언 이름" className="bg-input border-border text-foreground mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-foreground">승</Label><Input type="number" min={0} value={wins} onChange={e => setWins(Number(e.target.value))} className="bg-input border-border text-foreground mt-1" /></div>
                <div><Label className="text-foreground">패</Label><Input type="number" min={0} value={losses} onChange={e => setLosses(Number(e.target.value))} className="bg-input border-border text-foreground mt-1" /></div>
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
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="챔피언 검색..." className="pl-10 bg-input border-border text-foreground" />
      </div>

      {/* Champion Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            챔피언 승률 ({filteredChampions.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 bg-muted rounded animate-pulse" />
          ) : filteredChampions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Swords className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{search ? "검색 결과가 없습니다." : "아직 등록된 챔피언이 없습니다."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground w-16">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">챔피언</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-win">승</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-lose">패</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">총 게임</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground">승률</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground w-32 hidden md:table-cell">승률 바</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground w-20">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChampions.map((champ, idx) => {
                    const isEditing = editId === champ.id;
                    if (isEditing) {
                      return (
                        <tr key={champ.id} className="border-b border-primary/30 bg-secondary/30">
                          <td className="py-2 px-4 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-4"><Input value={name} onChange={e => setName(e.target.value)} className="bg-input border-border text-foreground h-8 w-40" /></td>
                          <td className="py-2 px-4"><Input type="number" min={0} value={wins} onChange={e => setWins(Number(e.target.value))} className="bg-input border-border text-foreground h-8 w-16 mx-auto text-center" /></td>
                          <td className="py-2 px-4"><Input type="number" min={0} value={losses} onChange={e => setLosses(Number(e.target.value))} className="bg-input border-border text-foreground h-8 w-16 mx-auto text-center" /></td>
                          <td colSpan={2} className="py-2 px-4" />
                          <td className="py-2 px-4 hidden md:table-cell" />
                          <td className="py-2 px-4 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending} className="h-7 bg-primary text-primary-foreground text-xs">저장</Button>
                              <Button size="sm" variant="outline" onClick={() => { setEditId(null); resetForm(); }} className="h-7 border-border text-xs">취소</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={champ.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors group">
                        <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{champ.name}</td>
                        <td className="py-3 px-4 text-center text-win font-medium">{champ.wins}</td>
                        <td className="py-3 px-4 text-center text-lose font-medium">{champ.losses}</td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{champ.total}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-bold ${champ.winRate >= 60 ? "text-win" : champ.winRate >= 50 ? "text-primary" : "text-lose"}`}>
                            {champ.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="stat-bar">
                            <div className="stat-bar-fill" style={{ width: `${champ.winRate}%`, background: champ.winRate >= 60 ? "oklch(0.65 0.18 155)" : champ.winRate >= 50 ? "oklch(0.82 0.12 85)" : "oklch(0.6 0.2 25)" }} />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(champ)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate({ id: champ.id }); }} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
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
    </div>
  );
}
