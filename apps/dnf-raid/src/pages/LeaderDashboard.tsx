import {useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {CalendarClock, Copy, Loader2, RefreshCw, Search, Sparkles, Telescope, Undo2} from "lucide-react";

import {
  cloneRaid,
  createRaid,
  getLatestRaid,
  getRaid,
  searchCharacters,
  updateParticipant,
} from "../services/dnf";
import {useRaidSession} from "../hooks/useRaidSession";
import {PartyBoard} from "../components/PartyBoard";
import {CharacterCard} from "../components/CharacterCard";
import type {DnfCharacter, RaidDetail} from "../types";

function LeaderDashboard() {
  const {raidId, leaderId, leaderCharacter, setRaidId, setLeaderCharacter} = useRaidSession();
  const [cloneName, setCloneName] = useState("");
  const [raidName, setRaidName] = useState("디레지에 레이드");
  const [leaderSearch, setLeaderSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const leaderSearchMutation = useMutation({
    mutationFn: (keyword: string) => searchCharacters(keyword),
  });

  const raidQuery = useQuery<RaidDetail | null>({
    queryKey: ["raid", raidId],
    enabled: Boolean(raidId),
    queryFn: () => (raidId ? getRaid(raidId) : Promise.resolve(null)),
  });

  const latestRaidMutation = useMutation({
    mutationFn: () => {
      if (!leaderId) throw new Error("공대장을 먼저 선택하세요.");
      return getLatestRaid(leaderId);
    },
    onSuccess: (data) => {
      setRaidId(data.id);
      setMessage("최근 레이드를 불러왔습니다.");
      queryClient.setQueryData(["raid", data.id], data);
    },
  });

  const createRaidMutation = useMutation({
    mutationFn: () => {
      if (!leaderId) throw new Error("공대장을 먼저 선택하세요.");
      return createRaid({name: raidName, userId: leaderId});
    },
    onSuccess: (data) => {
      setRaidId(data.id);
      setMessage("새 레이드가 만들어졌습니다.");
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
      setMessage("지난 레이드를 복사했습니다.");
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
  const leaderSearchResults = leaderSearchMutation.data ?? [];

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

  const handleLeaderSearch = () => {
    if (!leaderSearch.trim()) return;
    leaderSearchMutation.mutate(leaderSearch.trim());
  };

  return (
    <div className="space-y-6">
      <section className="frosted p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-text-muted">현재 레이드</p>
            <p className="font-display text-xl text-text">{raid?.name ?? "선택되지 않음"}</p>
            <p className="text-xs text-text-subtle">
              공대장 키: {(raid?.userId ?? leaderId) || "미지정"} · Raid ID: {raidId ?? "-"}
            </p>
            {leaderCharacter && (
              <p className="text-xs text-text-subtle">
                공대장 캐릭터: {leaderCharacter.characterName} ({leaderCharacter.adventureName ?? "모험단 미표기"})
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => createRaidMutation.mutate()}
              disabled={!leaderId || createRaidMutation.isPending}
              className="pill border-primary/30 bg-primary text-white hover:bg-primary-dark shadow-soft transition disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              새 레이드 생성
            </button>
            <button
              onClick={() => latestRaidMutation.mutate()}
              disabled={!leaderId || latestRaidMutation.isPending}
              className="pill border-panel-border bg-panel text-text hover:bg-panel-muted transition"
            >
              <Telescope className="h-4 w-4" />
              최근 레이드
            </button>
            <button
              onClick={() => raidId && raidQuery.refetch()}
              disabled={!raidId || raidQuery.isFetching}
              className="pill border-panel-border bg-panel text-text hover:bg-panel-muted transition"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
          </div>
        </div>

        {message && (
          <div className="flex flex-wrap gap-2 text-xs text-primary">
            <span className="pill border-primary/40 bg-primary-muted text-primary">{message}</span>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">공대장 캐릭터 검색</span>
              <div className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                <Search className="h-4 w-4 text-text-subtle" />
                <input
                  value={leaderSearch}
                  onChange={(e) => setLeaderSearch(e.target.value)}
                  placeholder="닉네임 입력"
                  className="bg-transparent outline-none flex-1 text-sm text-text placeholder:text-text-subtle"
                />
                <button
                  type="button"
                  onClick={handleLeaderSearch}
                  className="text-sm text-primary hover:text-primary-dark"
                >
                  검색
                </button>
              </div>
            </label>
            {leaderCharacter ? (
              <div className="flex items-center justify-between rounded-lg border border-panel-border bg-panel px-3 py-2 text-sm text-text">
                <div>
                  <p className="font-display">{leaderCharacter.characterName}</p>
                  <p className="text-xs text-text-subtle">
                    모험단 {leaderCharacter.adventureName ?? "-"} · 서버 {leaderCharacter.serverId}
                  </p>
                </div>
                <button
                  onClick={() => setLeaderCharacter(null)}
                  className="flex items-center gap-1 text-xs text-text-subtle hover:text-text"
                >
                  <Undo2 className="h-4 w-4" />
                  교체
                </button>
              </div>
            ) : (
              <p className="text-xs text-text-subtle">닉네임 검색 후 공대장을 지정하세요.</p>
            )}
          </div>

          <label className="space-y-1 text-sm">
            <span className="text-text-muted">레이드 이름</span>
            <input
              className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={raidName}
              onChange={(e) => setRaidName(e.target.value)}
              placeholder="예: 12/7(토) 오후 레이드"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-text-muted">레이드 ID</span>
            <input
              className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={raidId ?? ""}
              onChange={(e) => setRaidId(e.target.value || null)}
              placeholder="직접 입력 또는 불러오기"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-text-muted">지난 레이드 복사 이름</span>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="예: 지난주 복사본"
              />
              <button
                onClick={() => cloneMutation.mutate()}
                disabled={!raidId || cloneMutation.isPending}
                className="pill border-panel-border bg-panel text-text hover:bg-panel-muted transition"
              >
                <Copy className="h-4 w-4" />
                복사
              </button>
            </div>
          </label>
          <div className="flex items-center gap-2 text-sm text-text-subtle">
            <Sparkles className="h-4 w-4 text-primary" />
            새 레이드는 공대장 페이지에서만 생성합니다.
          </div>
        </div>

        {leaderSearchMutation.isPending && (
          <div className="flex items-center gap-2 text-text-subtle text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            공대장 검색 중...
          </div>
        )}

        {leaderSearchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-text-muted">공대장 후보</p>
            <div className="grid gap-4 md:grid-cols-2">
              {leaderSearchResults.map((character: DnfCharacter) => (
                <CharacterCard
                  key={character.characterId}
                  character={character}
                  onAction={() => {
                    setLeaderCharacter(character);
                    setLeaderSearch(character.characterName);
                  }}
                  actionLabel="공대장으로 지정"
                  highlight={leaderCharacter?.characterId === character.characterId}
                  subtitle={character.adventureName ? `모험단 ${character.adventureName}` : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="pill border-primary/30 bg-primary-muted text-text">
            <CalendarClock className="h-4 w-4" />
            파티에 배치하면 즉시 저장됩니다.
          </div>
          <div className="text-sm text-text-subtle">
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
          <div className="frosted p-6 text-text-muted">레이드를 선택하거나 불러오세요.</div>
        )}
      </section>

      {raid && (
        <section className="frosted p-5 space-y-3">
          <p className="text-sm text-text-muted">파티별 평균</p>
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map((party) => (
              <div key={party} className="rounded-xl border border-panel-border bg-panel p-4 shadow-soft">
                <p className="text-text-muted text-sm">파티 {party}</p>
                <p className="font-display text-2xl text-text">
                  딜 {partyStats[party].avgDamage.toLocaleString()}억
                </p>
                <p className="text-sm text-amber-600">
                  버프 {partyStats[party].avgBuff.toLocaleString()}만
                </p>
                <p className="text-xs text-text-subtle">
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
