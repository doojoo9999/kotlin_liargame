import {FormEvent, useMemo, useState} from "react";
import {useParams} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {AlertTriangle, Loader2, Search, Sparkles} from "lucide-react";

import {
  addParticipantByMother,
  getRaidGroup,
  searchCharacters,
  searchCharactersByAdventure,
} from "../services/dnf";
import type {CohortPreference, DnfCharacter, Participant} from "../types";
import {StatBadge} from "../components/StatBadge";
import {CharacterCard} from "../components/CharacterCard";
import {DNF_SERVERS, type DnfServerId} from "../constants";
import {SupportModal} from "../components/SupportModal";
import {useRaidMode} from "../hooks/useRaidMode";

function SharePage() {
  const {raidId} = useParams<{raidId: string}>();
  const queryClient = useQueryClient();

  const [characterName, setCharacterName] = useState("");
  const [adventureName, setAdventureName] = useState("");
  const [selected, setSelected] = useState<DnfCharacter | null>(null);
  const [damage, setDamage] = useState("");
  const [buff, setBuff] = useState("");
  const [cohortPreference, setCohortPreference] = useState<CohortPreference | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [serverId, setServerId] = useState<DnfServerId>(DNF_SERVERS[0].id);
  const {raidMode} = useRaidMode();

  const raidGroupQuery = useQuery({
    queryKey: ["raidGroup", raidId],
    enabled: Boolean(raidId),
    queryFn: () => (raidId ? getRaidGroup(raidId) : Promise.resolve(null)),
  });

  const raidGroup = raidGroupQuery.data ?? null;
  const activeRaid = raidGroup?.primaryRaid ?? null;
  const motherRaidId = raidGroup?.motherRaidId ?? raidId ?? null;

  const searchMutation = useMutation({
    mutationFn: (payload: {keyword: string; serverId: DnfServerId}) =>
      searchCharacters(payload.keyword, payload.serverId),
  });

  const adventureSearchMutation = useMutation({
    mutationFn: (keyword: string) => searchCharactersByAdventure(keyword),
  });

  const addParticipantMutation = useMutation({
    mutationFn: async () => {
      if (!motherRaidId || !selected) throw new Error("모공 ID와 캐릭터를 먼저 선택하세요.");
      const damageValue = damage ? Number(damage) : 0;
      const buffValue = buff ? Number(buff) : 0;
      const result = await addParticipantByMother(motherRaidId, {
        serverId: selected.serverId,
        characterId: selected.characterId,
        damage: damageValue,
        buffPower: buffValue,
        cohortPreference,
      });
      return result;
    },
    onSuccess: () => {
      setMessage("지원이 완료되었습니다. 공대장 화면에 즉시 반영됩니다.");
      setSelected(null);
      setDamage("");
      setBuff("");
      setCohortPreference(null);
      if (motherRaidId) {
        queryClient.invalidateQueries({queryKey: ["raidGroup", motherRaidId]});
      }
    },
  });

  const searchResults = searchMutation.data ?? [];
  const adventureResults = adventureSearchMutation.data ?? [];

  const normalizeAdventure = (value?: string | null) => value?.trim().toLowerCase() ?? "";
  const normalizedAdventureQuery = normalizeAdventure(adventureName);

  const filteredSearchResults = useMemo(
    () =>
      raidMode?.minFame ? searchResults.filter((c) => c.fame >= raidMode.minFame) : searchResults,
    [raidMode?.minFame, searchResults]
  );
  const filteredAdventureResults = useMemo(
    () => {
      const byAdventure =
        normalizedAdventureQuery.length > 0
          ? adventureResults.filter(
              (c) => normalizeAdventure(c.adventureName) === normalizedAdventureQuery
            )
          : adventureResults;
      return raidMode?.minFame ? byAdventure.filter((c) => c.fame >= raidMode.minFame) : byAdventure;
    },
    [normalizedAdventureQuery, raidMode?.minFame, adventureResults]
  );
  const canApply = useMemo(() => Boolean(selected && motherRaidId), [selected, motherRaidId]);
  const closeModal = () => {
    setSelected(null);
    setDamage("");
    setBuff("");
    setCohortPreference(null);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!characterName.trim()) return;
    searchMutation.mutate({keyword: characterName.trim(), serverId});
  };

  const handleAdventureSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!adventureName.trim()) return;
    adventureSearchMutation.mutate(adventureName.trim());
  };

  if (raidGroupQuery.isPending) {
    return (
      <div className="frosted p-6 flex items-center gap-2 text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        불러오는 중...
      </div>
    );
  }

  if (!activeRaid) {
    return (
      <div className="frosted p-6 flex items-center gap-3 text-text-muted">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        레이드를 찾을 수 없습니다.
      </div>
    );
  }

  const participants = activeRaid.participants;
  const partyCount = raidMode?.partyCount ?? 3;
  const slotsPerParty = raidMode?.slotsPerParty ?? 4;
  const partyNumbers = Array.from({length: partyCount}, (_, idx) => idx + 1);
  const slots: Record<number, Array<Participant | null>> = {};
  partyNumbers.forEach((party) => {
    slots[party] = Array.from({length: slotsPerParty}, () => null);
  });
  const waiting: Participant[] = [];

  participants.forEach((p) => {
    if (p.partyNumber && p.slotIndex !== null && p.slotIndex !== undefined) {
      const partySlots = slots[p.partyNumber];
      if (partySlots && p.slotIndex < partySlots.length && partySlots[p.slotIndex] === null) {
        partySlots[p.slotIndex] = p;
        return;
      }
    }
    waiting.push(p);
  });

  return (
    <div className="space-y-8">
      <div className="frosted p-5 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-text-muted">{activeRaid.name}</p>
          {raidMode && (
            <span className="pill border-panel-border bg-panel text-xs text-text-muted">
              {raidMode.name} · {raidMode.badge} · {raidMode.partyCount}파티
            </span>
          )}
          <span
            className={`pill text-[11px] ${
              activeRaid.isPublic
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-slate-50 text-slate-700"
            }`}
          >
            {activeRaid.isPublic ? "공개 레이드" : "비공개 레이드"}
          </span>
        </div>
        <p className="font-display text-2xl text-text">공대 페이지</p>
        <p className="text-xs text-text-subtle">
          파티 배치와 지원을 모두 확인할 수 있습니다. 슬롯 {slotsPerParty}인 기준으로 표시됩니다.
        </p>
        {message && (
          <span className="pill border-primary/40 bg-primary-muted text-primary text-xs">{message}</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {partyNumbers.map((party) => (
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
        {raidMode?.minFame && (
          <div className="text-xs text-text-muted">
            {raidMode.name}: 명성 {raidMode.minFame.toLocaleString()} 이상만 검색 결과에 표시됩니다.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <form onSubmit={handleSearch} className="space-y-2">
            <p className="text-sm text-text-muted">서버+닉네임으로 신규 등록</p>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-panel-border bg-panel px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <Search className="h-4 w-4 text-text-subtle" />
              <select
                value={serverId}
                onChange={(e) => setServerId(e.target.value as DnfServerId)}
                className="rounded-lg border border-panel-border bg-panel-muted px-2 py-1 text-sm text-text focus:border-primary focus:outline-none"
              >
                {DNF_SERVERS.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
              <input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="닉네임 입력"
                className="bg-transparent outline-none flex-1 text-sm text-text placeholder:text-text-subtle"
              />
              <button type="submit" className="text-sm text-primary hover:text-primary-dark">
                검색
              </button>
            </div>
            <p className="text-xs text-text-subtle">
              서버를 선택해 닉네임 중복을 구분합니다. 네오플 API로 검색하며 DB에 저장합니다.
            </p>
          </form>

          <form onSubmit={handleAdventureSearch} className="space-y-2">
            <p className="text-sm text-text-muted">모험단명으로 불러오기 (예: 모험단 000)</p>
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
          {filteredSearchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">닉네임 검색 결과</p>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredSearchResults.map((character) => (
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

          {filteredAdventureResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">모험단 검색 결과</p>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredAdventureResults.map((character) => (
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
          <SupportModal
            character={selected}
            damage={damage}
            buff={buff}
            onChangeDamage={setDamage}
            onChangeBuff={setBuff}
            onSubmit={() => addParticipantMutation.mutate()}
            onClose={closeModal}
            isSubmitting={addParticipantMutation.isPending}
            canSubmit={canApply && !addParticipantMutation.isPending}
            showCohortPreference
            cohortPreference={cohortPreference}
            onChangeCohortPreference={setCohortPreference}
          />
        )}
      </section>
    </div>
  );
}

export default SharePage;
