import {FormEvent, useMemo, useState} from "react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {Loader2, Search, Sparkles} from "lucide-react";
import {addParticipant, getRaid, searchCharacters, searchCharactersByAdventure} from "../services/dnf";
import {useRaidSession} from "../hooks/useRaidSession";
import {CharacterCard} from "../components/CharacterCard";
import type {DnfCharacter} from "../types";
import {DNF_SERVERS, DIREGIE_MIN_FAME, isDiregieRaid, type DnfServerId} from "../constants";
import {SupportModal} from "../components/SupportModal";

function ApplicantPage() {
  const {raidId, setRaidId} = useRaidSession();
  const [characterName, setCharacterName] = useState("");
  const [adventureName, setAdventureName] = useState("");
  const [selected, setSelected] = useState<DnfCharacter | null>(null);
  const [damage, setDamage] = useState("");
  const [buff, setBuff] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [serverId, setServerId] = useState<DnfServerId>(DNF_SERVERS[0].id);

  const searchMutation = useMutation({
    mutationFn: (payload: {keyword: string; serverId: DnfServerId}) =>
      searchCharacters(payload.keyword, payload.serverId),
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
      setMessage("지원이 완료되었습니다. 공대장 보드에서 확인하세요.");
      setSelected(null);
      setDamage("");
      setBuff("");
    },
  });

  const searchResults = searchMutation.data ?? [];
  const adventureResults = adventureSearchMutation.data ?? [];

  const raidQuery = useQuery({
    queryKey: ["raid", raidId],
    enabled: Boolean(raidId),
    queryFn: () => (raidId ? getRaid(raidId) : Promise.resolve(null)),
  });

  const isDiregie = isDiregieRaid(raidQuery.data?.name);
  const filteredSearchResults = useMemo(
    () => (isDiregie ? searchResults.filter((c) => c.fame >= DIREGIE_MIN_FAME) : searchResults),
    [isDiregie, searchResults]
  );
  const filteredAdventureResults = useMemo(
    () => (isDiregie ? adventureResults.filter((c) => c.fame >= DIREGIE_MIN_FAME) : adventureResults),
    [isDiregie, adventureResults]
  );

  const canApply = useMemo(() => Boolean(selected && raidId), [selected, raidId]);
  const closeModal = () => {
    setSelected(null);
    setDamage("");
    setBuff("");
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

  return (
    <div className="space-y-8">
      <section className="frosted p-5 space-y-4">
        <p className="text-sm text-text-muted">지원할 레이드</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-text-muted">레이드 ID</span>
            <input
              className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={raidId ?? ""}
              onChange={(e) => setRaidId(e.target.value ? e.target.value : null)}
              placeholder="공대장이 공유한 레이드 ID"
            />
          </label>
          <div className="space-y-1 text-sm">
            <span className="text-text-muted">상태</span>
            <div className="flex flex-wrap gap-2 text-xs text-text-muted items-center">
              <span className="pill">현재 레이드: {raidId ?? "미지정"}</span>
              {message && <span className="pill border-primary/40 bg-primary-muted text-primary">{message}</span>}
            </div>
          </div>
        </div>
        <p className="text-xs text-text-subtle">새 레이드는 공대장 페이지에서 생성해주세요.</p>
      </section>

      <section className="frosted p-5 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-text-muted">캐릭터 등록 · 검색</p>
            <h3 className="font-display text-xl text-text">닉네임으로 등록하고 모험단으로 불러오세요.</h3>
          </div>
          <div className="pill border-primary/30 bg-primary-muted text-text">
            <Sparkles className="h-4 w-4 text-primary" />
            명성/직업은 자동 입력
          </div>
        </div>
        {isDiregie && (
          <div className="text-xs text-text-muted">
            디레지에 레이드: 명성 {DIREGIE_MIN_FAME.toLocaleString()} 이상만 검색 결과에 표시됩니다.
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
              서버를 지정해 닉네임 중복을 구분합니다. 네오플 API에서 조회 후 DB에 저장합니다.
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
          />
        )}
      </section>
    </div>
  );
}

export default ApplicantPage;
