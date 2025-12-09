import {FormEvent, useMemo, useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {Loader2, Search, Sparkles} from "lucide-react";
import {
  addParticipantByMother,
  addParticipantsBulkByMother,
  searchCharacters,
  searchCharactersByAdventure,
  searchRaidsByName,
} from "../services/dnf";
import {useRaidSession} from "../hooks/useRaidSession";
import {CharacterCard} from "../components/CharacterCard";
import type {CohortPreference, DnfCharacter, RaidSummary} from "../types";
import {DNF_SERVERS, type DnfServerId} from "../constants";
import {SupportModal} from "../components/SupportModal";
import {useRaidMode} from "../hooks/useRaidMode";

type SearchTarget = "adventure" | DnfServerId;

function ApplicantPage() {
  const {raidId, motherRaidId, setRaidId, setMotherRaidId} = useRaidSession();
  const [currentRaidName, setCurrentRaidName] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [adventureName, setAdventureName] = useState("");
  const [selected, setSelected] = useState<DnfCharacter | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<DnfCharacter[]>([]);
  const [damage, setDamage] = useState("");
  const [buff, setBuff] = useState("");
  const [cohortPreference, setCohortPreference] = useState<CohortPreference | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [raidNameSearch, setRaidNameSearch] = useState("");
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("adventure");
  const {raidMode} = useRaidMode();
  const queryClient = useQueryClient();
  const groupId = motherRaidId ?? raidId;

  const searchMutation = useMutation({
    mutationFn: (payload: {keyword: string; serverId: DnfServerId}) =>
      searchCharacters(payload.keyword, payload.serverId),
  });

  const adventureSearchMutation = useMutation({
    mutationFn: (keyword: string) => searchCharactersByAdventure(keyword),
  });

  const raidSearchMutation = useMutation<RaidSummary[], Error, string>({
    mutationFn: (keyword: string) => searchRaidsByName(keyword, 10),
  });

  const addParticipantMutation = useMutation({
    mutationFn: async () => {
      if (!groupId || !selected) throw new Error("공대 ID와 캐릭터를 먼저 선택하세요.");
      const damageValue = damage.trim() !== "" ? Number(damage) : selected.damage ?? 0;
      const buffValue = buff.trim() !== "" ? Number(buff) : selected.buffPower ?? 0;
      const result = await addParticipantByMother(groupId, {
        serverId: selected.serverId,
        characterId: selected.characterId,
        damage: damageValue,
        buffPower: buffValue,
        cohortPreference,
      });
      return result;
    },
    onSuccess: () => {
      setMessage("지원이 완료되었습니다. 공대장 보드에서 확인하세요.");
      setSelected(null);
      setDamage("");
      setBuff("");
    },
  });

  const bulkApplyMutation = useMutation({
    mutationFn: async () => {
      if (!groupId) throw new Error("공대 ID를 먼저 선택하세요.");
      if (selectedBatch.length === 0) throw new Error("일괄 지원할 캐릭터를 선택하세요.");
      const payload = selectedBatch.map((c) => ({
        serverId: c.serverId,
        characterId: c.characterId,
        damage: c.damage ?? undefined,
        buffPower: c.buffPower ?? undefined,
        cohortPreference,
      }));
      return addParticipantsBulkByMother(groupId, payload);
    },
    onSuccess: () => {
      setMessage(`${selectedBatch.length}명 일괄 지원 완료 (저장된 딜/버프 자동 적용)`);
      setSelectedBatch([]);
      if (groupId) {
        queryClient.invalidateQueries({queryKey: ["raidGroup", groupId]});
      }
    },
  });

  const searchResults = searchMutation.data ?? [];
  const adventureResults = adventureSearchMutation.data ?? [];
  const raidSearchResults = raidSearchMutation.data ?? [];

  const dedupedRaidSearchResults = useMemo(() => {
    const seen = new Set<string>();
    return raidSearchResults.filter((raid) => {
      const key = raid.motherRaidId ?? raid.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [raidSearchResults]);

  const filteredSearchResults = useMemo(
    () =>
      raidMode?.minFame ? searchResults.filter((c) => c.fame >= raidMode.minFame) : searchResults,
    [raidMode?.minFame, searchResults]
  );
  const filteredAdventureResults = useMemo(
    () =>
      raidMode?.minFame
        ? adventureResults.filter((c) => c.fame >= raidMode.minFame)
        : adventureResults,
    [raidMode?.minFame, adventureResults]
  );

  const canApply = useMemo(() => Boolean(selected && groupId), [selected, groupId]);
  const closeModal = () => {
    setSelected(null);
    setDamage("");
    setBuff("");
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const keyword = characterName.trim();
    if (!keyword) return;
    if (searchTarget === "adventure") {
      setAdventureName(keyword);
      adventureSearchMutation.mutate(keyword);
      return;
    }
    searchMutation.mutate({keyword, serverId: searchTarget});
  };

  const handleRaidSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!raidNameSearch.trim()) return;
    raidSearchMutation.mutate(raidNameSearch.trim());
  };

  const handleAdventureSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!adventureName.trim()) return;
    adventureSearchMutation.mutate(adventureName.trim());
  };

  const toggleBatchSelection = (character: DnfCharacter) => {
    setSelectedBatch((prev) => {
      const exists = prev.some((c) => c.characterId === character.characterId);
      if (exists) {
        return prev.filter((c) => c.characterId !== character.characterId);
      }
      return [...prev, character];
    });
  };

  const applyStatsFromCharacter = (character: DnfCharacter | null) => {
    if (!character) return;
    const nextDamage = character.damage != null ? String(character.damage) : "";
    const nextBuff = character.buffPower != null ? String(character.buffPower) : "";
    setDamage(nextDamage);
    setBuff(nextBuff);
  };

  return (
    <div className="space-y-8">
      <section className="frosted p-5 space-y-4">
        <p className="text-sm text-text-muted">지원할 레이드</p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">공대 ID</span>
              <input
                className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={groupId ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setMotherRaidId(value ? value : null);
                  setRaidId(null);
                  setCurrentRaidName(null);
                }}
                placeholder="공대장이 공유한 공대 ID"
              />
            </label>
            <p className="text-xs text-text-subtle">공대 ID 하나로 모든 기수를 받습니다.</p>
          </div>

          <form onSubmit={handleRaidSearch} className="space-y-1 text-sm">
            <span className="text-text-muted">공대 이름으로 검색</span>
            <div className="flex gap-2 rounded-lg border border-panel-border bg-panel px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <Search className="h-4 w-4 text-text-subtle" />
              <input
                value={raidNameSearch}
                onChange={(e) => setRaidNameSearch(e.target.value)}
                placeholder="예: 부욤공대, 태초공대, 샛별공대"
                className="bg-transparent outline-none flex-1 text-sm text-text placeholder:text-text-subtle"
              />
              <button type="submit" className="text-sm text-primary hover:text-primary-dark whitespace-nowrap px-2">
                검색
              </button>
            </div>
            <p className="text-xs text-text-subtle">공대명이 일부만 맞아도 검색됩니다.</p>
          </form>
        </div>
        <div className="space-y-2 text-xs text-text-subtle">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="pill">
              현재 공대:{" "}
              {groupId ? currentRaidName ?? "(공대명 미표기)" : "미지정"}
            </span>
            {message && <span className="pill border-primary/40 bg-primary-muted text-primary">{message}</span>}
          </div>
          {raidSearchMutation.isPending && (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              공대 검색 중...
            </div>
          )}
          {raidSearchMutation.data && raidSearchMutation.data.length === 0 && (
            <div className="text-xs text-text-muted">검색 결과가 없습니다.</div>
          )}
          {dedupedRaidSearchResults.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {dedupedRaidSearchResults.map((raid) => (
                <div key={raid.id} className="rounded-lg border border-panel-border bg-panel px-3 py-2 text-sm shadow-soft">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-display text-text">{raid.name}</p>
                      <p className="text-[11px] text-text-subtle">
                        인원 {raid.participantCount} · {raid.createdAt ? new Date(raid.createdAt).toLocaleString() : "시간 미표기"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMotherRaidId(raid.motherRaidId ?? raid.id);
                        setRaidId(raid.id);
                        setCurrentRaidName(raid.name);
                        setMessage("공대 ID가 설정되었습니다.");
                      }}
                      className="pill border-panel-border bg-panel text-text hover:bg-panel-muted text-xs"
                    >
                      이 공대로 지원
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-text-subtle">새 레이드는 공대장 페이지에서 생성해주세요.</p>
      </section>

      <section className="frosted p-5 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-text-muted">캐릭터 등록 · 검색</p>
            <h3 className="font-display text-xl text-text">
              닉네임으로 등록하고 모험단으로 불러오세요.
            </h3>
          </div>
          <div className="pill border-primary/30 bg-primary-muted text-text">
            <Sparkles className="h-4 w-4 text-primary" />
            명성/직업은 자동 입력
          </div>
          <p className="text-xs text-text-subtle">캐릭터를 선택하면 저장된 딜/버프 수치를 자동으로 불러옵니다.</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-text-muted">기수 배치 선호도</p>
          <div className="flex flex-wrap items-center gap-2">
            {[
              {label: "상관없음", value: null},
              {label: "앞기수 선호", value: "FRONT" as CohortPreference | null},
              {label: "뒷기수 선호", value: "BACK" as CohortPreference | null},
            ].map((option) => {
              const isActive = cohortPreference === option.value;
              return (
                <button
                  type="button"
                  key={option.label}
                  onClick={() => setCohortPreference(option.value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    isActive
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-panel-border bg-panel text-text hover:bg-panel-muted"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
            <span className="text-xs text-text-subtle">단일/일괄 지원 모두에 적용됩니다.</span>
          </div>
        </div>
        {raidMode?.minFame && (
          <div className="text-xs text-text-muted">
            {raidMode.name}: 명성 {raidMode.minFame.toLocaleString()} 이상만 검색 결과에 표시됩니다.
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <form onSubmit={handleSearch} className="space-y-2">
            <p className="text-sm text-text-muted">닉네임/모험단으로 신규 등록</p>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-panel-border bg-panel px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <Search className="h-4 w-4 text-text-subtle" />
              <select
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value as SearchTarget)}
                className="rounded-lg border border-panel-border bg-panel-muted px-2 py-1 text-sm text-text focus:border-primary focus:outline-none"
              >
                <option value="adventure">모험단</option>
                {DNF_SERVERS.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
              <input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="닉네임 또는 모험단명 입력"
                className="bg-transparent outline-none flex-1 text-sm text-text placeholder:text-text-subtle"
              />
              <button type="submit" className="text-sm text-primary hover:text-primary-dark">
                검색
              </button>
            </div>
            <p className="text-xs text-text-subtle">
              모험단을 선택하면 모험단명으로, 서버를 선택하면 닉네임으로 검색합니다. 네오플 API에서 조회 후 DB에 저장합니다.
            </p>
          </form>

          <form onSubmit={handleAdventureSearch} className="space-y-2">
            <p className="text-sm text-text-muted">모험단명으로 검색 (예: 모험단 000)</p>
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
                    onAction={() => {
                      setSelected(character);
                      applyStatsFromCharacter(character);
                    }}
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
                <div key={character.characterId} className="space-y-2">
                  <CharacterCard
                    character={character}
                    onAction={() => {
                      setSelected(character);
                      applyStatsFromCharacter(character);
                    }}
                    actionLabel="이 캐릭터로 지원"
                    highlight={selected?.characterId === character.characterId}
                    subtitle={character.adventureName ? `모험단 ${character.adventureName}` : undefined}
                  />
                    <button
                      type="button"
                      onClick={() => toggleBatchSelection(character)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm transition ${
                        selectedBatch.some((c) => c.characterId === character.characterId)
                          ? "border-primary/50 bg-primary-muted text-primary"
                          : "border-panel-border bg-panel text-text hover:bg-panel-muted"
                      }`}
                    >
                      {selectedBatch.some((c) => c.characterId === character.characterId) ? "일괄 선택 해제" : "일괄 선택"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedBatch.length > 0 && (
          <div className="rounded-lg border border-panel-border bg-panel p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-text">선택한 캐릭터 {selectedBatch.length}명 (모험단 일괄 지원)</p>
              <button
                type="button"
                onClick={() => setSelectedBatch([])}
                className="text-xs text-text-subtle hover:text-text"
              >
                선택 모두 해제
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-text-subtle">
              {selectedBatch.map((c) => (
                <span key={c.characterId} className="pill border-panel-border bg-panel-muted">
                  {c.characterName}
                </span>
              ))}
            </div>
            <p className="text-xs text-text-subtle">등록해둔 딜/버프 수치를 그대로 사용합니다.</p>
            <button
              type="button"
              onClick={() => bulkApplyMutation.mutate()}
              disabled={!groupId || bulkApplyMutation.isPending}
              className="pill border-primary/30 bg-primary text-white hover:bg-primary-dark transition disabled:opacity-60"
            >
              {bulkApplyMutation.isPending ? (
                <span className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  일괄 지원 중...
                </span>
              ) : (
                `선택한 ${selectedBatch.length}명 일괄 지원`
              )}
            </button>
            {!groupId && <p className="text-xs text-amber-600">공대 ID를 먼저 선택하세요.</p>}
          </div>
        )}

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
          />
        )}
      </section>
    </div>
  );
}

export default ApplicantPage;
