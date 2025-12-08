import {FormEvent, useMemo, useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {Loader2, Search, Sparkles} from "lucide-react";

import {registerCharacter, searchCharacters, searchCharactersByAdventure} from "../services/dnf";
import type {DnfCharacter} from "../types";
import {DNF_SERVERS, type DnfServerId} from "../constants";
import {CharacterCard} from "../components/CharacterCard";
import {SupportModal} from "../components/SupportModal";

const BUFFER_KEYWORDS = ["크루세이더", "인챈트리스", "뮤즈", "패러메딕"];

function isBufferJob(character: DnfCharacter | null) {
  if (!character) return false;
  const normalize = (value?: string | null) => value?.toLowerCase().replace(/\s+/g, "") ?? "";
  const job = normalize(character.jobName);
  const grow = normalize(character.jobGrowName);
  return BUFFER_KEYWORDS.some((keyword) => job.includes(keyword) || grow.includes(keyword));
}

function RegisterCharacterPage() {
  const [characterName, setCharacterName] = useState("");
  const [adventureName, setAdventureName] = useState("");
  const [damage, setDamage] = useState("0");
  const [buff, setBuff] = useState("0");
  const [selected, setSelected] = useState<DnfCharacter | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [serverId, setServerId] = useState<DnfServerId>(DNF_SERVERS[0].id);

  const searchMutation = useMutation({
    mutationFn: (payload: {keyword: string; serverId: DnfServerId}) =>
      searchCharacters(payload.keyword, payload.serverId),
  });

  const adventureSearchMutation = useMutation({
    mutationFn: (keyword: string) => searchCharactersByAdventure(keyword),
  });

  const openModalForCharacter = (character: DnfCharacter) => {
    setSelected(character);
    setDamage(character.damage != null ? String(character.damage) : "0");
    setBuff(character.buffPower != null ? String(character.buffPower) : "0");
    setShowModal(true);
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("캐릭터를 먼저 선택하세요.");
      const buffer = isBufferJob(selected);
      const safeDamage = damage ? Number(damage) : 0;
      const safeBuff = buff ? Number(buff) : 0;
      const damageValue = buffer ? 0 : safeDamage;
      const buffValue = buffer ? safeBuff : 0;
      return registerCharacter({
        serverId: selected.serverId,
        characterId: selected.characterId,
        damage: damageValue,
        buffPower: buffValue,
      });
    },
    onSuccess: (data) => {
      setMessage(`등록 완료: ${data.characterName} (딜 ${data.damage} / 버프 ${data.buffPower})`);
      setShowModal(false);
    },
  });

  const searchResults = searchMutation.data ?? [];
  const adventureResults = adventureSearchMutation.data ?? [];

  const filteredSearchResults = useMemo(
    () => searchResults,
    [searchResults]
  );
  const filteredAdventureResults = useMemo(
    () => adventureResults,
    [adventureResults]
  );

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
      <section className="frosted p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="font-display text-xl text-text">캐릭터 등록</p>
        </div>
        <p className="text-sm text-text-subtle">
          검색으로 캐릭터를 불러온 뒤, 기본 딜/버프 값을 저장합니다. 이후 지원 시 자동으로 캐시에 저장된 값을 사용할 수 있습니다.
        </p>
        {message && <span className="pill border-primary/40 bg-primary-muted text-primary text-xs">{message}</span>}
      </section>

      <section className="frosted p-5 space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <form onSubmit={handleSearch} className="space-y-2">
            <p className="text-sm text-text-muted">서버+닉네임으로 검색</p>
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
              <button type="submit" className="text-sm text-primary hover:text-primary-dark whitespace-nowrap px-2">
                검색
              </button>
            </div>
            <p className="text-xs text-text-subtle">서버를 선택해 닉네임 중복을 구분합니다.</p>
          </form>

          <form onSubmit={handleAdventureSearch} className="space-y-2">
            <p className="text-sm text-text-muted">모험단명으로 불러오기</p>
            <div className="flex items-center gap-2 rounded-xl border border-panel-border bg-panel px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
              <Search className="h-4 w-4 text-text-subtle" />
              <input
                value={adventureName}
                onChange={(e) => setAdventureName(e.target.value)}
                placeholder="모험단명 입력"
                className="bg-transparent outline-none flex-1 text-sm text-text placeholder:text-text-subtle"
              />
              <button type="submit" className="text-sm text-primary hover:text-primary-dark whitespace-nowrap px-2">
                검색
              </button>
            </div>
            <p className="text-xs text-text-subtle">이미 등록된 캐릭터 캐시에서 모험단명으로 검색합니다.</p>
          </form>
        </div>

        <div className="space-y-2 text-sm text-text-subtle">
          {searchMutation.isPending && (
            <div className="flex items-center gap-2 text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              닉네임 검색 중...
            </div>
          )}
          {adventureSearchMutation.isPending && (
            <div className="flex items-center gap-2 text-text-muted">
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
                    onAction={() => openModalForCharacter(character)}
                    actionLabel="선택"
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
                    onAction={() => openModalForCharacter(character)}
                    actionLabel="선택"
                    highlight={selected?.characterId === character.characterId}
                    subtitle={character.adventureName ? `모험단 ${character.adventureName}` : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-panel-border bg-panel p-4 space-y-3">
          <p className="text-sm text-text-muted">선택된 캐릭터</p>
          {selected ? (
            <div className="space-y-2">
              <p className="font-display text-lg text-text">{selected.characterName}</p>
              <p className="text-xs text-text-subtle">딜/버프 입력은 선택 시 뜨는 모달에서 진행합니다.</p>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <span>딜 {damage || 0}억</span>
                <span className="text-text-subtle">·</span>
                <span>버프 {buff || 0}만</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="pill border-panel-border bg-panel text-text hover:bg-panel-muted transition"
                >
                  딜/버프 수정
                </button>
                <button
                  type="button"
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending}
                  className="pill border-primary/30 bg-primary text-white hover:bg-primary-dark shadow-soft transition disabled:opacity-60"
                >
                  {registerMutation.isPending ? (
                    <span className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      저장 중...
                    </span>
                  ) : (
                    "캐릭터 등록/업데이트"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-subtle">검색 후 캐릭터를 선택하세요.</p>
          )}
        </div>
      </section>

      {selected && showModal && (
        <SupportModal
          character={selected}
          damage={damage}
          buff={buff}
          onChangeDamage={(value) => setDamage(value)}
          onChangeBuff={(value) => setBuff(value)}
          onSubmit={() => registerMutation.mutate()}
          onClose={() => setShowModal(false)}
          isSubmitting={registerMutation.isPending}
          canSubmit={!registerMutation.isPending}
          actionLabel="캐릭터 등록/업데이트"
          showDamage={!isBufferJob(selected)}
          showBuff={isBufferJob(selected)}
        />
      )}
    </div>
  );
}

export default RegisterCharacterPage;
