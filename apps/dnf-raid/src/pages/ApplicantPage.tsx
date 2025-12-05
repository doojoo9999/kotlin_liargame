import {FormEvent, useMemo, useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {Loader2, Search, Sparkles, Undo2} from "lucide-react";
import {addParticipant, createRaid, getLatestRaid, searchCharacters} from "../services/dnf";
import {useRaidSession} from "../hooks/useRaidSession";
import {CharacterCard} from "../components/CharacterCard";
import type {DnfCharacter} from "../types";

function ApplicantPage() {
  const {raidId, userId, setRaidId, setUserId} = useRaidSession();
  const [raidName, setRaidName] = useState("디레지에 레이드");
  const [characterName, setCharacterName] = useState("");
  const [selected, setSelected] = useState<DnfCharacter | null>(null);
  const [damage, setDamage] = useState("");
  const [buff, setBuff] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const searchMutation = useMutation({
    mutationFn: (keyword: string) => searchCharacters(keyword),
  });

  const createRaidMutation = useMutation({
    mutationFn: () => createRaid({name: raidName, userId}),
    onSuccess: (data) => {
      setRaidId(data.id);
      setMessage("새 레이드가 만들어졌습니다. 지원자를 추가하세요.");
    },
  });

  const latestRaidMutation = useMutation({
    mutationFn: () => getLatestRaid(userId),
    onSuccess: (data) => {
      setRaidId(data.id);
      setMessage("최근 레이드를 불러왔습니다.");
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async () => {
      if (!raidId || !selected) throw new Error("레이드와 캐릭터를 먼저 선택하세요.");
      const damageValue = damage ? Number(damage) : 0;
      const buffValue = buff ? Number(buff) : 0;
      const result = await addParticipant(raidId, {
        serverId: selected.serverId,
        characterId: selected.characterId,
        damage: damageValue,
        buffPower: buffValue,
      });
      return result;
    },
    onSuccess: () => {
      setMessage("지원이 완료되었습니다. 리더 보드에서 확인하세요.");
      setSelected(null);
      setDamage("");
      setBuff("");
    },
  });

  const searchResults = searchMutation.data ?? [];

  const canApply = useMemo(() => selected && raidId, [selected, raidId]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!characterName.trim()) return;
    searchMutation.mutate(characterName.trim());
  };

  return (
    <div className="space-y-8">
      <section className="frosted p-5 grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <p className="text-sm text-white/70">레이드 정보</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-white/70">DnF userId (리더)</span>
              <input
                className="w-full rounded-lg border border-panel-border bg-white/5 px-3 py-2 text-white focus:border-neon-cyan/60 focus:outline-none"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="던파 API에서 제공되는 userId"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-white/70">레이드 이름</span>
              <input
                className="w-full rounded-lg border border-panel-border bg-white/5 px-3 py-2 text-white focus:border-neon-cyan/60 focus:outline-none"
                value={raidName}
                onChange={(e) => setRaidName(e.target.value)}
                placeholder="예: 12/7(토) 오후 레이드"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/70 items-center">
            <span className="pill">현재 레이드: {raidId ?? "미생성"}</span>
            {message && <span className="pill border-neon-cyan/50 text-neon-cyan">{message}</span>}
          </div>
        </div>
        <div className="flex gap-2 justify-end items-end">
          <button
            onClick={() => createRaidMutation.mutate()}
            disabled={!userId || createRaidMutation.isPending}
            className="flex-1 rounded-lg bg-neon-cyan/20 px-4 py-2 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/30 transition disabled:opacity-60"
          >
            {createRaidMutation.isPending ? "생성 중..." : "새 레이드 생성"}
          </button>
          <button
            onClick={() => latestRaidMutation.mutate()}
            disabled={!userId || latestRaidMutation.isPending}
            className="flex-1 rounded-lg border border-panel-border px-4 py-2 text-white hover:bg-white/5 transition disabled:opacity-60"
          >
            최근 레이드 불러오기
          </button>
        </div>
      </section>

      <section className="frosted p-5 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-white/70">캐릭터 검색</p>
            <h3 className="font-display text-xl">이름으로 검색 후 지원하세요.</h3>
          </div>
          <div className="pill border-neon-cyan/40 text-neon-cyan">
            <Sparkles className="h-4 w-4" />
            명성/직업은 자동 입력
          </div>
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-panel-border bg-white/5 px-3 py-2 flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-white/60" />
            <input
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="캐릭터명 입력"
              className="bg-transparent outline-none flex-1 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-panel-border px-4 py-2 hover:bg-white/5 transition text-sm"
          >
            검색
          </button>
        </form>

        {searchMutation.isPending && (
          <div className="flex items-center gap-2 text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            검색 중...
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {searchResults.map((character) => (
            <CharacterCard
              key={character.characterId}
              character={character}
              onAction={() => setSelected(character)}
              actionLabel="이 캐릭터로 지원"
              highlight={selected?.characterId === character.characterId}
            />
          ))}
        </div>

        {selected && (
          <div className="frosted p-4 space-y-4 border border-neon-cyan/30">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg">지원 정보</p>
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1 text-xs text-white/60 hover:text-white"
              >
                <Undo2 className="h-4 w-4" />
                다시 선택
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-white/70">딜 (억 단위)</span>
                <input
                  value={damage}
                  onChange={(e) => setDamage(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full rounded-lg border border-panel-border bg-white/5 px-3 py-2 text-white focus:border-neon-cyan/60 focus:outline-none"
                  placeholder="예: 1200 (억)"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-white/70">버프력 (만 단위)</span>
                <input
                  value={buff}
                  onChange={(e) => setBuff(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full rounded-lg border border-panel-border bg-white/5 px-3 py-2 text-white focus:border-neon-cyan/60 focus:outline-none"
                  placeholder="예: 550 (만)"
                />
              </label>
            </div>
            <button
              onClick={() => addParticipantMutation.mutate()}
              disabled={!canApply || addParticipantMutation.isPending}
              className="w-full rounded-xl bg-neon-cyan/20 border border-neon-cyan/50 py-3 text-neon-cyan hover:bg-neon-cyan/30 transition disabled:opacity-60"
            >
              {addParticipantMutation.isPending ? "지원 중..." : "이 레이드에 지원하기"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default ApplicantPage;
