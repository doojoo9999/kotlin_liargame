import {FormEvent, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {AlertTriangle, Loader2, Search, Sparkles, Undo2} from "lucide-react";

import {addParticipant, getRaid, searchCharacters, searchCharactersByAdventure} from "../services/dnf";
import type {DnfCharacter, Participant} from "../types";
import {StatBadge} from "../components/StatBadge";
import {CharacterCard} from "../components/CharacterCard";

function SharePage() {
  const {raidId} = useParams<{raidId: string}>();
  const queryClient = useQueryClient();

  const [characterName, setCharacterName] = useState("");
  const [adventureName, setAdventureName] = useState("");
  const [selected, setSelected] = useState<DnfCharacter | null>(null);
  const [damage, setDamage] = useState("");
  const [buff, setBuff] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const raidQuery = useQuery({
    queryKey: ["raid", raidId],
    enabled: Boolean(raidId),
    queryFn: () => (raidId ? getRaid(raidId) : Promise.resolve(null)),
  });

  const searchMutation = useMutation({
    mutationFn: (keyword: string) => searchCharacters(keyword),
  });

  const adventureSearchMutation = useMutation({
    mutationFn: (keyword: string) => searchCharactersByAdventure(keyword),
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
      setMessage("지원이 완료되었습니다. 공대장 화면에 즉시 반영됩니다.");
      setSelected(null);
      setDamage("");
      setBuff("");
      queryClient.invalidateQueries({queryKey: ["raid", raidId]});
    },
  });

  const searchResults = searchMutation.data ?? [];
  const adventureResults = adventureSearchMutation.data ?? [];
  const canApply = useMemo(() => Boolean(selected && raidId), [selected, raidId]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!characterName.trim()) return;
    searchMutation.mutate(characterName.trim());
  };

  const handleAdventureSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!adventureName.trim()) return;
    adventureSearchMutation.mutate(adventureName.trim());
  };

  if (raidQuery.isPending) {
    return (
      <div className="frosted p-6 flex items-center gap-2 text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        불러오는 중...
      </div>
    );
  }

  if (!raidQuery.data) {
    return (
      <div className="frosted p-6 flex items-center gap-3 text-text-muted">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        레이드를 찾을 수 없습니다.
      </div>
    );
  }

  const participants = raidQuery.data.participants;
  const slots: Record<number, Array<Participant | null>> = {
    1: [null, null, null, null],
    2: [null, null, null, null],
    3: [null, null, null, null],
  };
  const waiting: Participant[] = [];

  participants.forEach((p) => {
    if (p.partyNumber && p.slotIndex !== null && p.slotIndex !== undefined) {
      const party = slots[p.partyNumber];
      if (party && party[p.slotIndex] === null) {
        party[p.slotIndex] = p;
        return;
      }
    }
    waiting.push(p);
  });

  return (
    <div className="space-y-8">
      <div className="frosted p-5 space-y-2">
        <p className="text-sm text-text-muted">{raidQuery.data.name}</p>
        <p className="font-display text-2xl text-text">공대 페이지</p>
        <p className="text-xs text-text-subtle">파티 배치와 지원을 모두 확인할 수 있습니다.</p>
        {message && (
          <span className="pill border-primary/40 bg-primary-muted text-primary text-xs">{message}</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((party) => (
          <div key={party} className="frosted p-4 space-y-3">
            <p className="text-text-muted text-sm">파티 {party}</p>
            <div className="space-y-2">
              {slots[party].map((p, idx) => (
                <div
                  key={`${party}-${idx}`}
                  className="rounded-xl border border-panel-border bg-panel p-3 min-h-[90px] shadow-soft"
                >
                  <p className="text-[11px] text-text-subtle mb-1">슬롯 {idx + 1}</p>
                  {p ? (
                    <div>
                      <p className="font-display">{p.character.characterName}</p>
                      <p className="text-xs text-text-subtle">
                        {p.character.jobGrowName} · 명성 {p.character.fame.toLocaleString()}
                      </p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <StatBadge label="딜" value={p.damage} unit="억" />
                        <StatBadge label="버프" value={p.buffPower} unit="만" tone="amber" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-subtle">비어 있음</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="frosted p-4 space-y-2">
        <p className="text-sm text-text-muted">미배치</p>
        {waiting.length === 0 ? (
          <p className="text-sm text-text-subtle">모두 배치되었습니다.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {waiting.map((p) => (
              <div key={p.id} className="rounded-xl border border-panel-border bg-panel p-3 shadow-soft">
                <p className="font-display">{p.character.characterName}</p>
                <p className="text-xs text-text-subtle">
                  {p.character.jobGrowName} · 명성 {p.character.fame.toLocaleString()}
                </p>
                <div className="flex gap-2 mt-2 text-xs">
                  <StatBadge label="딜" value={p.damage} unit="억" />
                  <StatBadge label="버프" value={p.buffPower} unit="만" tone="amber" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="frosted p-5 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-text-muted">이 공대에 지원하기</p>
            <h3 className="font-display text-xl text-text">닉네임 또는 모험단으로 검색 후 지원하세요.</h3>
          </div>
          <div className="pill border-primary/30 bg-primary-muted text-text">
            <Sparkles className="h-4 w-4 text-primary" />
            명성/직업 자동 입력
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <form onSubmit={handleSearch} className="space-y-2">
            <p className="text-sm text-text-muted">닉네임으로 신규 등록</p>
            <div className="flex items-center gap-2 rounded-xl border border-panel-border bg-panel px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <Search className="h-4 w-4 text-text-subtle" />
              <input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="캐릭터명 입력"
                className="bg-transparent outline-none flex-1 text-sm text-text placeholder:text-text-subtle"
              />
              <button type="submit" className="text-sm text-primary hover:text-primary-dark">
                검색
              </button>
            </div>
            <p className="text-xs text-text-subtle">네오플 API로 검색하며 캐릭터를 DB에 저장합니다.</p>
          </form>

          <form onSubmit={handleAdventureSearch} className="space-y-2">
            <p className="text-sm text-text-muted">모험단으로 불러오기</p>
            <div className="flex items-center gap-2 rounded-xl border border-panel-border bg-panel px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <Search className="h-4 w-4 text-text-subtle" />
              <input
                value={adventureName}
                onChange={(e) => setAdventureName(e.target.value)}
                placeholder="모험단명 입력"
                className="bg-transparent outline-none flex-1 text-sm text-text placeholder:text-text-subtle"
              />
              <button type="submit" className="text-sm text-primary hover:text-primary-dark">
                검색
              </button>
            </div>
            <p className="text-xs text-text-subtle">이미 등록된 캐릭터의 모험단명을 기준으로 검색합니다.</p>
          </form>
        </div>

        <div className="space-y-2 text-sm text-text-subtle">
          {searchMutation.isPending && (
            <div className="flex items-center gap-2 text-text-subtle">
              <Loader2 className="h-4 w-4 animate-spin" />
              닉네임 검색 중...
            </div>
          )}
          {adventureSearchMutation.isPending && (
            <div className="flex items-center gap-2 text-text-subtle">
              <Loader2 className="h-4 w-4 animate-spin" />
              모험단 검색 중...
            </div>
          )}
        </div>

        <div className="space-y-6">
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">닉네임 검색 결과</p>
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
            </div>
          )}

          {adventureResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">모험단 검색 결과</p>
              <div className="grid gap-4 md:grid-cols-2">
                {adventureResults.map((character) => (
                  <CharacterCard
                    key={character.characterId}
                    character={character}
                    onAction={() => setSelected(character)}
                    actionLabel="이 캐릭터로 지원"
                    highlight={selected?.characterId === character.characterId}
                    subtitle={character.adventureName ? `모험단 ${character.adventureName}` : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {selected && (
          <div className="frosted p-4 space-y-4 border border-primary/30">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg text-text">지원 정보</p>
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1 text-xs text-text-subtle hover:text-text"
              >
                <Undo2 className="h-4 w-4" />
                다시 선택
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-text-muted">딜 (억 단위)</span>
                <input
                  value={damage}
                  onChange={(e) => setDamage(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="예: 1200 (억)"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-text-muted">버프력 (만 단위)</span>
                <input
                  value={buff}
                  onChange={(e) => setBuff(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="예: 550 (만)"
                />
              </label>
            </div>
            <button
              onClick={() => addParticipantMutation.mutate()}
              disabled={!canApply || addParticipantMutation.isPending}
              className="w-full rounded-xl bg-primary text-white border border-primary py-3 shadow-soft hover:bg-primary-dark transition disabled:opacity-60"
            >
              {addParticipantMutation.isPending ? "지원 중..." : "이 공대에 지원하기"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default SharePage;
