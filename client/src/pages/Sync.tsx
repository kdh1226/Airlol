import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, CheckCircle, AlertCircle, Clock, Link } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1bUqPV6mcmbo3XlSD7kOg2JR_jexMk1rYspTrl7otNWA";

export default function Sync() {
  const utils = trpc.useUtils();
  const { data: syncLogs, isLoading: logsLoading } = trpc.sync.logs.useQuery();
  const syncMutation = trpc.sync.trigger.useMutation({
    onSuccess: (result: any) => {
      utils.sync.logs.invalidate();
      utils.player.list.invalidate();
      utils.player.ranking.invalidate();
      utils.champion.list.invalidate();
      utils.champion.ranking.invalidate();
      utils.dashboard.summary.invalidate();
      utils.match.list.invalidate();
      toast.success(`동기화 완료! 플레이어 ${result.playersUpdated}명, 챔피언 ${result.championsUpdated}개 업데이트`);
    },
    onError: (err: any) => toast.error(`동기화 실패: ${err.message}`),
  });

  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);

  const handleSync = () => {
    if (!sheetUrl.trim()) {
      toast.error("스프레드시트 URL을 입력해주세요.");
      return;
    }
    syncMutation.mutate({ sheetUrl: sheetUrl.trim() });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">데이터 동기화</h1>
        <p className="text-muted-foreground mt-1">구글 스프레드시트에서 데이터 가져오기</p>
      </div>

      {/* Sync Form */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Link className="h-5 w-5 text-primary" />
            구글 스프레드시트 연결
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-foreground">스프레드시트 URL</Label>
            <Input
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="bg-input border-border text-foreground mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              구글 스프레드시트의 공유 URL을 입력하세요. 스프레드시트는 "링크가 있는 모든 사용자에게 공개"로 설정되어야 합니다.
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-gold-dark gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "동기화 중..." : "지금 동기화"}
          </Button>

          {syncMutation.isPending && (
            <div className="p-4 rounded-lg bg-lol-blue/10 border border-lol-blue/20">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-lol-blue animate-spin" />
                <div>
                  <p className="text-sm font-medium text-foreground">동기화 진행 중...</p>
                  <p className="text-xs text-muted-foreground">구글 스프레드시트에서 데이터를 가져오고 있습니다.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            동기화 기록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="h-32 bg-muted rounded animate-pulse" />
          ) : !syncLogs || syncLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>아직 동기화 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {syncLogs.map(log => (
                <div key={log.id} className={`flex items-center justify-between p-3 rounded-lg ${
                  log.status === "success" ? "bg-win/5 border border-win/10" : "bg-lose/5 border border-lose/10"
                }`}>
                  <div className="flex items-center gap-3">
                    {log.status === "success" ? (
                      <CheckCircle className="h-5 w-5 text-win shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-lose shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {log.status === "success" ? "동기화 성공" : "동기화 실패"}
                      </p>
                      {log.message && <p className="text-xs text-muted-foreground mt-0.5">{log.message}</p>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.createdAt).toLocaleString("ko-KR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
