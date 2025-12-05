import {useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {CalendarClock, Copy, RefreshCw, Telescope} from "lucide-react";

import {cloneRaid, getLatestRaid, getRaid, updateParticipant} from "../services/dnf";
import {useRaidSession} from "../hooks/useRaidSession";
import {PartyBoard} from "../components/PartyBoard";
import type {RaidDetail} from "../types";

function LeaderDashboard() {
  const {raidId, userId, setRaidId, setUserId} = useRaidSession();
  const [cloneName, setCloneName] = useState("");
  const queryClient = useQueryClient();

  const raidQuery = useQuery<RaidDetail | null>({
    queryKey: ["raid", raidId],
    enabled: Boolean(raidId),
    queryFn: () => (raidId ? getRaid(raidId) : Promise.resolve(null)),
  });

  const latestRaidMutation = useMutation({
    mutationFn: () => getLatestRaid(userId),
    onSuccess: (data) => {
      setRaidId(data.id);
      queryClient.setQueryData(["raid", data.id], data);
    },
  });

  const cloneMutation = useMutation({
    mutationFn: () => {
      if (!raidId) throw new Error("클론할 레이드가 없습니다.");
      return cloneRaid(raidId, cloneName || undefined);
    },
    onSuccess: (data) => {
      setRaidId(data.id);
      setCloneName("");
      queryClient.setQueryData(["raid", data.id], data);
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (payload: {participantId: string; partyNumber: number | null; slotIndex: number | null}) => {
      if (!raidId) throw new Error("레이드를 먼저 선택하세요.");
      const {participantId, partyNumber, slotIndex} = payload;
      await updateParticipant(raidId, participantId, {
        partyNumber,
        slotIndex,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["raid", raidId]});
    },
  });

  const raid = raidQuery.data ?? null;
  const participants = raid?.participants ?? [];

  const partyStats = useMemo(() => {
    const stats: Record<number, {avgDamage: number; avgBuff: number; count: number}> = {
      1: {avgDamage: 0, avgBuff: 0, count: 0},
      2: {avgDamage: 0, avgBuff: 0, count: 0},
      3: {avgDamage: 0, avgBuff: 0, count: 0},
    };
    participants.forEach((p) => {
      if (!p.partyNumber) return;
      const slot = stats[p.partyNumber];
      slot.count += 1;
      slot.avgDamage += p.damage;
      slot.avgBuff += p.buffPower;
    });
    [1, 2, 3].forEach((k) => {
      const s = stats[k];
      if (s.count > 0) {
        s.avgDamage = Math.round(s.avgDamage / s.count);
        s.avgBuff = Math.round(s.avgBuff / s.count);
      }
    });
    return stats;
  }, [participants]);

  return (
    <div className="space-y-6">
      <section className="frosted p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white/70">현재 레이드</p>
            <p className="font-display text-xl">
              {raid?.name ?? "선택되지 않음"}
            </p>
            <p className="text-xs text-white/60">
              userId: {raid?.userId ?? userId ?? "미지정"} · Raid ID: {raidId ?? "-"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => latestRaidMutation.mutate()}
              disabled={!userId || latestRaidMutation.isPending}
              className="pill border-panel-border hover:bg-white/5 transition text-white"
            >
              <Telescope className="h-4 w-4" />
              최근 레이드 불러오기
            </button>
            <button
              onClick={() => raidId && raidQuery.refetch()}
              disabled={!raidId || raidQuery.isFetching}
              className="pill border-panel-border hover:bg-white/5 transition text-white"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-white/70">DnF userId</span>
            <input
              className="w-full rounded-lg border border-panel-border bg-white/5 px-3 py-2 text-white focus:border-neon-cyan/60 focus:outline-none"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="던파 API userId"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-white/70">레이드 ID</span>
            <input
              className="w-full rounded-lg border border-panel-border bg-white/5 px-3 py-2 text-white focus:border-neon-cyan/60 focus:outline-none"
              value={raidId ?? ""}
              onChange={(e) => setRaidId(e.target.value || null)}
              placeholder="직접 입력 또는 불러오기"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-white/70">지난 레이드 복사 이름</span>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-panel-border bg-white/5 px-3 py-2 text-white focus:border-neon-cyan/60 focus:outline-none"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="예: 지난주 복사본"
              />
              <button
                onClick={() => cloneMutation.mutate()}
                disabled={!raidId || cloneMutation.isPending}
                className="pill border-panel-border text-white hover:bg-white/5 transition"
              >
                <Copy className="h-4 w-4" />
                복사
              </button>
            </div>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="pill border-neon-cyan/40 text-neon-cyan">
            <CalendarClock className="h-4 w-4" />
            파티에 배치하면 즉시 저장됩니다.
          </div>
          <div className="text-sm text-white/60">
            평균 딜/버프는 단순 산술 평균 (딜=억, 버프=만)
          </div>
        </div>

        {raidId ? (
          <PartyBoard
            participants={participants}
            onAssign={(participantId, partyNumber, slotIndex) =>
              assignMutation.mutate({participantId, partyNumber, slotIndex})
            }
          />
        ) : (
          <div className="frosted p-6 text-white/70">레이드를 선택하거나 불러오세요.</div>
        )}
      </section>

      {raid && (
        <section className="frosted p-5 space-y-3">
          <p className="text-sm text-white/70">파티별 평균</p>
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map((party) => (
              <div key={party} className="rounded-xl border border-panel-border bg-white/5 p-4">
                <p className="text-white/70 text-sm">파티 {party}</p>
                <p className="font-display text-2xl">
                  딜 {partyStats[party].avgDamage.toLocaleString()}억
                </p>
                <p className="text-sm text-neon-amber">
                  버프 {partyStats[party].avgBuff.toLocaleString()}만
                </p>
                <p className="text-xs text-white/60">
                  인원 {partyStats[party].count} / 4
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default LeaderDashboard;
