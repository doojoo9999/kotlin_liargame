import {useEffect, useMemo, useRef, useState} from "react";
import {useMutation, useQuery, useQueryClient, useQueries} from "@tanstack/react-query";
import {CalendarClock, Copy, Loader2, PlugZap, RefreshCw, Search, Sparkles, Telescope, Trash2, Undo2} from "lucide-react";
import {clsx} from "clsx";

import {
    cloneRaid,
    createRaid,
    getLatestRaid,
    getRaid,
    getRecentRaids,
    addParticipant,
    searchCharacters,
    searchCharactersByAdventure,
    updateParticipant,
    updateRaidVisibility,
    deleteParticipant,
    deleteParticipantsByAdventure,
    autoFillRaids,
    autoFillUpdong, addParticipantsBulk,
} from "../services/dnf";
import {useRaidSession} from "../hooks/useRaidSession";
import {PartyBoard} from "../components/PartyBoard";
import {CharacterCard} from "../components/CharacterCard";
import type {DnfCharacter, Participant, RaidDetail, RaidSummary} from "../types";
import {
  DNF_SERVERS,
  RAID_MODES,
  getServerName,
  type DnfServerId,
} from "../constants";
import {SupportModal} from "../components/SupportModal";
import {useRaidMode} from "../hooks/useRaidMode";
import type {PartyTargetConfig} from "../utils/autoAssign";
import {buildLeaderId} from "../hooks/useRaidSession";

function toRaidSummary(data: RaidDetail): RaidSummary {
  return {
    id: data.id,
    name: data.name,
    motherRaidId: data.motherRaidId,
    isPublic: data.isPublic,
    participantCount: data.participants.length,
    createdAt: data.createdAt,
  };
}

function normalizeCohortList(
  list: Array<RaidSummary | null | undefined>,
  fallbackRaid?: RaidDetail | null
): RaidSummary[] {
  const cleaned = list.filter((item): item is RaidSummary => Boolean(item));
  if (cleaned.length === 0 && fallbackRaid) {
    return [toRaidSummary(fallbackRaid)];
  }
  return cleaned;
}

function LeaderDashboard() {
  const {raidId, motherRaidId, leaderId, leaderCharacter, setRaidId, setMotherRaidId, setLeaderCharacter} = useRaidSession();
  const {raidMode: selectedRaidMode, setRaidModeId} = useRaidMode();
  const [raidName, setRaidName] = useState(selectedRaidMode.name);
  const [isPublic, setIsPublic] = useState(false);
  const [cohortCountInput, setCohortCountInput] = useState(1);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderSearchTarget, setLeaderSearchTarget] = useState<string>("adventure");
  const [message, setMessage] = useState<string | null>(null);
  const [addCandidate, setAddCandidate] = useState<DnfCharacter | null>(null);
  const [addDamage, setAddDamage] = useState("");
  const [addBuff, setAddBuff] = useState("");
  const [partyTargets, setPartyTargets] = useState<Array<{damage: string; buff: string}>>(() =>
    Array.from({length: selectedRaidMode.partyCount}, () => ({damage: "", buff: ""}))
  );
  const [cohortRaids, setCohortRaids] = useState<RaidSummary[]>([]);
  const autoLatestRequested = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const leaderSearchMutation = useMutation({
    mutationFn: (payload: {keyword: string; scope: "server" | "adventure"; serverId?: DnfServerId}) => {
      if (payload.scope === "adventure") {
        return searchCharactersByAdventure(payload.keyword);
      }
      if (!payload.serverId) throw new Error("서버를 선택하세요.");
      return searchCharacters(payload.keyword, payload.serverId);
    },
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
      setMotherRaidId(data.motherRaidId);
      setRaidName(data.name);
      setIsPublic(data.isPublic);
      setMessage("최근 레이드를 불러왔습니다.");
      queryClient.setQueryData(["raid", data.id], data);
    },
  });

  const createRaidMutation = useMutation({
    mutationFn: () => {
      if (!leaderId) throw new Error("공대장을 먼저 선택하세요.");
      return createRaid({name: raidName, userId: leaderId, isPublic, motherRaidId: motherRaidId ?? raidId ?? null});
    },
    onSuccess: (data) => {
      setRaidId(data.id);
      setMotherRaidId(data.motherRaidId);
      setIsPublic(data.isPublic);
      setMessage("새 레이드가 만들어졌습니다.");
      queryClient.setQueryData(["raid", data.id], data);
      const summary = toRaidSummary(data);
      setCohortRaids([summary]);
    },
  });

  const createRaidBatchMutation = useMutation({
    mutationFn: async (payload: {count: number; baseName?: string; startIndex?: number}) => {
      if (!leaderId) throw new Error("공대장을 먼저 선택하세요.");
      const {count, baseName, startIndex} = payload;
      const safeCount = Math.min(Math.max(count, 1), 30);
      const safeStart = Math.max(startIndex ?? 1, 1);
      const base = (baseName ?? raidName ?? selectedRaidMode.name).trim() || selectedRaidMode.name;
      const results: RaidDetail[] = [];
      let motherForBatch = motherRaidId ?? raidId ?? null;
      for (let i = 0; i < safeCount; i += 1) {
        const seq = safeStart + i;
        const name = safeCount > 1 || safeStart > 1 ? `${base} ${seq}기` : base;
        const data = await createRaid({name, userId: leaderId, isPublic, motherRaidId: motherForBatch});
        motherForBatch = motherForBatch ?? data.motherRaidId;
        results.push(data);
      }
      return {results, startIndex: safeStart, base, motherRaidId: motherForBatch};
    },
    onSuccess: ({results, startIndex, motherRaidId: batchMotherId}) => {
      const first = results[0];
      if (!first) return;
      setMessage(`${results.length}개 기수를 추가했습니다.`);
      results.forEach((raid) => queryClient.setQueryData(["raid", raid.id], raid));
      latestRaidMutation.reset();
      if (batchMotherId) {
        setMotherRaidId(batchMotherId);
      }
      setCohortRaids((prev) => {
        const base = normalizeCohortList(prev, raid);
        const next = [...base];
        results.forEach((raid, idx) => {
          const pos = startIndex + idx - 1;
          next[pos] = toRaidSummary(raid);
        });
        return next;
      });
      // keep current raid selection; do not force switch
      if (!raidId) {
        setRaidId(first.id);
        setMotherRaidId(batchMotherId ?? first.motherRaidId);
        setRaidName(first.name);
        setIsPublic(first.isPublic);
      }
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (targetRaidId: string) => cloneRaid(targetRaidId, {isPublic}),
    onSuccess: (data) => {
      setRaidId(data.id);
      setMotherRaidId(data.motherRaidId);
      setIsPublic(data.isPublic);
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

  const deleteAdventureMutation = useMutation({
    mutationFn: async (adventureName: string | null) => {
      const targets = normalizedCohorts.length > 0 ? normalizedCohorts : [];
      if (targets.length === 0) throw new Error("레이드를 먼저 선택하세요.");
      const results = await Promise.all(
        targets.map((summary) => deleteParticipantsByAdventure(summary.id, adventureName))
      );
      return results;
    },
    onSuccess: (results, adventureName) => {
      results.forEach((data) => queryClient.setQueryData(["raid", data.id], data));
      setMessage(
        `${adventureName ?? "모험단 미표기"} 모험단 지원자를 ${results.length}개 기수에서 삭제했습니다.`
      );
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: (value: boolean) => {
      if (!raidId) throw new Error("레이드를 먼저 선택하세요.");
      return updateRaidVisibility(raidId, value);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["raid", data.id], data);
      setIsPublic(data.isPublic);
      setMessage(data.isPublic ? "공개 레이드로 전환했습니다." : "비공개 레이드로 전환했습니다.");
    },
  });

  const raid = raidQuery.data ?? null;
  const normalizedCohorts = useMemo(
    () => normalizeCohortList(cohortRaids, raid),
    [cohortRaids, raid]
  );
  const participants = raid?.participants ?? [];
  const leaderSearchResults = leaderSearchMutation.data ?? [];
  const activeRaidMode = selectedRaidMode;
  const minFameRequirement = activeRaidMode.minFame ?? null;
  const recentLimit = 12;
  const [showSupportModal, setShowSupportModal] = useState(false);

  const displayRaidName = raid?.name ?? raidName ?? selectedRaidMode.name;
  const displayRaidId = raid?.motherRaidId ?? motherRaidId ?? raidId ?? "생성 전 (캐릭터 추가 시 자동 생성)";
  const displayLeaderKey = raid?.userId ?? leaderId ?? "자동 생성 예정";

  const filteredLeaderSearchResults = useMemo(
    () =>
      minFameRequirement != null
        ? leaderSearchResults.filter((c) => c.fame >= minFameRequirement)
        : leaderSearchResults,
    [leaderSearchResults, minFameRequirement]
  );

  const partyStats = useMemo(() => {
    const stats: Record<number, {avgDamage: number; avgBuff: number; count: number}> = {};
    const partyNumbers = Array.from({length: activeRaidMode.partyCount}, (_, idx) => idx + 1);
    partyNumbers.forEach((num) => {
      stats[num] = {avgDamage: 0, avgBuff: 0, count: 0};
    });
    participants.forEach((p) => {
      if (!p.partyNumber) return;
      const slot = stats[p.partyNumber];
      if (!slot) return;
      slot.count += 1;
      slot.avgDamage += p.damage;
      slot.avgBuff += p.buffPower;
    });
    Object.keys(stats).forEach((key) => {
      const numKey = Number(key);
      const s = stats[numKey];
      if (s && s.count > 0) {
        s.avgDamage = Math.round(s.avgDamage / s.count);
        s.avgBuff = Math.round(s.avgBuff / s.count);
      }
    });
    return stats;
  }, [activeRaidMode.partyCount, participants]);

  const parseTargetValue = (value: string) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };

  const computedPartyTargets = useMemo<PartyTargetConfig[]>(() => {
    const baseDamageAvg =
      participants.length > 0
        ? participants.reduce((sum, p) => sum + p.damage, 0) / participants.length
        : 0;
    const baseBuffAvg =
      participants.length > 0
        ? participants.reduce((sum, p) => sum + p.buffPower, 0) / participants.length
        : 0;
    const hasUserInput = partyTargets.some(
      (target) => parseTargetValue(target.damage) !== null || parseTargetValue(target.buff) !== null
    );

    return Array.from({length: activeRaidMode.partyCount}, (_, idx) => {
      const target = partyTargets[idx] ?? {damage: "", buff: ""};
      const userDamage = parseTargetValue(target.damage);
      const userBuff = parseTargetValue(target.buff);
      const derivedDamage = hasUserInput ? baseDamageAvg : baseDamageAvg * (idx === 0 ? 1.1 : 0.95);
      const derivedBuff = hasUserInput ? baseBuffAvg : baseBuffAvg * (idx === 0 ? 1.05 : 0.95);

      return {
        damageTarget: Math.max(Math.round((userDamage ?? derivedDamage) || 0), 1),
        buffTarget: Math.max(Math.round((userBuff ?? derivedBuff) || 0), 1),
      };
    });
  }, [activeRaidMode.partyCount, participants, partyTargets]);

  const buildUserPartyTargets = (): PartyTargetConfig[] | undefined => {
    const targets: PartyTargetConfig[] = [];
    for (let idx = 0; idx < activeRaidMode.partyCount; idx += 1) {
      const target = partyTargets[idx];
      if (!target) break;
      const damage = parseTargetValue(target.damage);
      const buff = parseTargetValue(target.buff);
      if (damage == null && buff == null) {
        break; // stop at first blank; rest will use 서버 기본값
      }
      if (damage == null || buff == null) {
        throw new Error("파티 목표는 딜/버프를 모두 입력하거나 비워두세요.");
      }
      targets.push({damageTarget: damage, buffTarget: buff});
    }
    return targets.length > 0 ? targets : undefined;
  };

  const normalizeCohortName = (name?: string | null) => {
    if (!name) return "";
    const trimmed = name.trim();
    const base = trimmed.replace(/\s*\d+\s*기\s*$/i, "").trim();
    return base.length > 0 ? base : trimmed;
  };

  const extractCohortNumber = (name?: string | null): number | null => {
    if (!name) return null;
    const match = name.match(/(\d+)\s*기\s*$/i);
    return match ? Number(match[1]) : null;
  };

  const buildCohortFromList = (target: RaidSummary, list: RaidSummary[]) => {
    const base = normalizeCohortName(target.name);
    const grouped = list.filter((item) => normalizeCohortName(item.name) === base);
    if (grouped.length === 0) return [target];
    return grouped
      .map((item) => ({
        item,
        order: extractCohortNumber(item.name) ?? Number.POSITIVE_INFINITY,
        createdAt: item.createdAt ? new Date(item.createdAt).getTime() : 0,
      }))
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return b.createdAt - a.createdAt;
      })
      .map(({item}) => item);
  };

  const recentRaidsQuery = useQuery({
    queryKey: ["recentRaids", leaderId, recentLimit],
    enabled: Boolean(leaderId),
    queryFn: () => getRecentRaids(leaderId, recentLimit),
  });

  const handleLeaderSearch = () => {
    if (!leaderSearch.trim()) return;
    const scope = leaderSearchTarget === "adventure" ? "adventure" : "server";
    const serverId = scope === "server" ? (leaderSearchTarget as DnfServerId) : undefined;
    leaderSearchMutation.mutate({keyword: leaderSearch.trim(), scope, serverId});
  };

  const ensureRaid = async (character: DnfCharacter) => {
    if (raidId) return raidId;
    const userId = buildLeaderId(character);
    if (!userId) throw new Error("캐릭터 정보가 없습니다.");
    const name = raidName || selectedRaidMode.name;
    const data = await createRaid({name, userId, isPublic, motherRaidId});
    setRaidId(data.id);
    setMotherRaidId(data.motherRaidId);
    setRaidName(data.name);
    setIsPublic(data.isPublic);
    setMessage(`${data.name}을 생성했습니다.`);
    queryClient.setQueryData(["raid", data.id], data);
    setCohortRaids((prev) => {
      if (prev.length === 0) return [toRaidSummary(data)];
      const next = [...prev];
      next[0] = toRaidSummary(data);
      return next;
    });
    return data.id;
  };

  const handleQuickAdd = (character: DnfCharacter) => {
    const duplicateExists = participants.some(
      (p) =>
        p.character.characterId === character.characterId &&
        p.character.serverId === character.serverId
    );
    if (duplicateExists) {
      setMessage("이미 공대에 있는 캐릭터입니다.");
      return;
    }
    if (!leaderCharacter) {
      setLeaderCharacter(character);
    }
    setLeaderSearch(character.characterName);
    setAddCandidate(character);
    setAddDamage(character.damage != null ? String(character.damage) : "");
    setAddBuff(character.buffPower != null ? String(character.buffPower) : "");

    ensureRaid(character)
      .then((targetRaidId) => {
        const hasStats = (character.damage ?? 0) > 0 || (character.buffPower ?? 0) > 0;
        if (hasStats) {
          addParticipantMutation.mutate({
            raidId: targetRaidId,
            candidate: character,
            damage: String(character.damage ?? 0),
            buff: String(character.buffPower ?? 0),
          });
        } else {
          setShowSupportModal(true);
        }
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "레이드를 만들 수 없습니다.");
      });
  };

  const toRaidSummary = (data: RaidDetail): RaidSummary => ({
    id: data.id,
    name: data.name,
    motherRaidId: data.motherRaidId,
    isPublic: data.isPublic,
    participantCount: data.participants.length,
    createdAt: data.createdAt,
  });

  const handleSetCohortCount = () => {
    const target = Math.min(Math.max(cohortCountInput, 1), 30);
    const currentCount = normalizedCohorts.length;
    if (target === currentCount) {
      setMessage(`기수를 ${target}개로 설정했습니다.`);
      return;
    }
    if (target < currentCount) {
      const toRemove = normalizedCohorts.slice(target);
      const nextCohorts = normalizedCohorts.slice(0, target);
      const destination = nextCohorts[0];
      const destDetail = destination ? cohortDetailMap.get(destination.id) : null;
      const existingDest = destDetail?.participants ?? [];
      const existingKey = new Set(existingDest.map((p) => `${p.character.serverId}:${p.character.characterId}`));

      const payloads: Parameters<typeof addParticipantsBulk>[1] = [];
      toRemove.forEach((summary) => {
        const detail = cohortDetailMap.get(summary.id);
        detail?.participants.forEach((p) => {
          const key = `${p.character.serverId}:${p.character.characterId}`;
          if (existingKey.has(key)) return;
          existingKey.add(key);
          payloads.push({
            serverId: p.character.serverId,
            characterId: p.character.characterId,
            damage: p.damage,
            buffPower: p.buffPower,
            partyNumber: null,
            slotIndex: null,
          });
        });
      });

      const movePromise =
        destination && payloads.length > 0
          ? addParticipantsBulk(destination.id, payloads).then((updated) => {
              queryClient.setQueryData(["raid", updated.id], updated);
            })
          : Promise.resolve();

      movePromise
        .then(() => {
          setCohortRaids(nextCohorts);
          if (nextCohorts.length === 0) {
            setRaidId(null);
            setMotherRaidId(null);
          } else if (raidId && !nextCohorts.find((r) => r.id === raidId)) {
            setRaidId(nextCohorts[0].id);
            setMotherRaidId(nextCohorts[0].motherRaidId);
            setRaidName(nextCohorts[0].name);
          }
          setMessage(
            payloads.length > 0
              ? `기수를 ${target}개로 설정하고 ${payloads.length}명을 미배치로 이동했습니다.`
              : `기수를 ${target}개로 설정했습니다.`
          );
        })
        .catch((error) => {
          setMessage(error instanceof Error ? error.message : "기수 축소에 실패했습니다.");
        });
      return;
    }
    const base =
      normalizeCohortName(raidName || normalizedCohorts[0]?.name) ||
      raidName ||
      normalizedCohorts[0]?.name ||
      selectedRaidMode.name;
    const startIndex = currentCount + 1;
    const toCreate = target - currentCount;
    createRaidBatchMutation.mutate({count: toCreate, baseName: base, startIndex});
  };

  const handlePartyTargetChange = (index: number, field: "damage" | "buff", value: string) => {
    setPartyTargets((prev) => {
      const safeValue = value.replace(/[^0-9]/g, "");
      const next = [...prev];
      next[index] = {...(next[index] ?? {damage: "", buff: ""}), [field]: safeValue};
      return next.slice(0, activeRaidMode.partyCount);
    });
  };

  const handleQuickRaidSelect = (raid: RaidSummary, index: number) => {
    setRaidId(raid.id);
    setMotherRaidId(raid.motherRaidId);
    setRaidName(raid.name);
    setIsPublic(raid.isPublic);
    setMessage(`${index + 1}기로 이동했습니다.`);
  };

  const handleVisibilityChange = (value: boolean) => {
    if (value === isPublic) return;
    setIsPublic(value);
    if (raidId) {
      updateVisibilityMutation.mutate(value);
    }
  };

  useEffect(() => {
    setPartyTargets((prev) =>
      Array.from({length: activeRaidMode.partyCount}, (_, idx) => prev[idx] ?? {damage: "", buff: ""})
    );
  }, [activeRaidMode.partyCount]);

  useEffect(() => {
    if (!raidId) {
      setRaidName(selectedRaidMode.name);
      setIsPublic(false);
    }
  }, [raidId, selectedRaidMode.name]);

  useEffect(() => {
    if (raid && raid.id === raidId && raid.name) {
      setRaidName(raid.name);
      setIsPublic(raid.isPublic);
      setMotherRaidId(raid.motherRaidId);
    }
  }, [raid?.id, raid?.name, raid?.isPublic, raid?.motherRaidId, raidId]);

  useEffect(() => {
    if (leaderId && !raidId && autoLatestRequested.current !== leaderId) {
      latestRaidMutation.mutate();
      autoLatestRequested.current = leaderId;
    }
  }, [leaderId, raidId, latestRaidMutation]);

  const resolveTargetSummaries = () => {
    const recentList = recentRaidsQuery.data ?? [];
    const defaultCohort =
      raid && raidId
        ? buildCohortFromList(toRaidSummary(raid), recentList.length > 0 ? recentList : [toRaidSummary(raid)])
        : [];
    const targetSummaries = normalizedCohorts.length > 0 ? normalizedCohorts : defaultCohort;
    return Array.from(new Map(targetSummaries.map((item) => [item.id, item])).values());
  };

  const applyRaidUpdates = (raids: RaidDetail[]) => {
    raids.forEach((updated) => {
      queryClient.setQueryData(["raid", updated.id], updated);
    });
  };

  const autoFillMutation = useMutation({
    mutationFn: async () => {
      const dedupedTargets = resolveTargetSummaries();
      if (dedupedTargets.length === 0) throw new Error("레이드를 먼저 선택하세요.");
      const userTargets = buildUserPartyTargets();
      const response = await autoFillRaids({
        raidIds: dedupedTargets.map((item) => item.id),
        partyCount: activeRaidMode.partyCount,
        slotsPerParty: activeRaidMode.slotsPerParty,
        targets: userTargets,
      });
      const labels = dedupedTargets.map((item, idx) => item.name || `${idx + 1}기`);
      return {response, labels};
    },
    onSuccess: ({response, labels}) => {
      applyRaidUpdates(response.raids);
      const summaryText = response.results
        .map((entry, idx) => {
          const tokens = [`배치 ${entry.usedCount}명`];
          if (entry.duplicateAdventureCount > 0) {
            tokens.push(`모험단 중복 ${entry.duplicateAdventureCount}명 제외`);
          }
          if (entry.unplacedCount > 0) {
            tokens.push(`남은 ${entry.unplacedCount}명 미배치`);
          }
          const label = labels[idx] ?? entry.name;
          return `${label}: ${tokens.join(" · ")}`;
        })
        .join(" / ");
      setMessage(`자동으로 파티를 채웠습니다. ${summaryText}`);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "자동 채우기에 실패했습니다.");
    },
  });

  const autoFillKeepPlacedMutation = useMutation({
    mutationFn: async () => {
      const dedupedTargets = resolveTargetSummaries();
      if (dedupedTargets.length === 0) throw new Error("레이드를 먼저 선택하세요.");
      const userTargets = buildUserPartyTargets();
      const response = await autoFillRaids({
        raidIds: dedupedTargets.map((item) => item.id),
        partyCount: activeRaidMode.partyCount,
        slotsPerParty: activeRaidMode.slotsPerParty,
        targets: userTargets,
        keepPlaced: true,
      });
      const labels = dedupedTargets.map((item, idx) => item.name || `${idx + 1}기`);
      return {response, labels};
    },
    onSuccess: ({response, labels}) => {
      applyRaidUpdates(response.raids);
      const summaryText = response.results
        .map((entry, idx) => {
          const tokens = [`배치 ${entry.usedCount}명`];
          if (entry.unplacedCount > 0) {
            tokens.push(`남은 ${entry.unplacedCount}명 미배치`);
          }
          const label = labels[idx] ?? entry.name;
          return `${label}: ${tokens.join(" · ")}`;
        })
        .join(" / ");
      setMessage(`배치된 인원은 고정하고 빈 자리만 채웠습니다. ${summaryText}`);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "빈 칸 채우기에 실패했습니다.");
    },
  });

  const updongAutoFillMutation = useMutation({
    mutationFn: async () => {
      const dedupedTargets = resolveTargetSummaries();
      if (dedupedTargets.length === 0) throw new Error("레이드를 먼저 선택하세요.");
      const response = await autoFillUpdong({
        raidIds: dedupedTargets.map((item) => item.id),
        partyCount: activeRaidMode.partyCount,
        slotsPerParty: activeRaidMode.slotsPerParty,
      });
      return {response};
    },
    onSuccess: ({response}) => {
      applyRaidUpdates(response.raids);
      const tokens = [`배치 ${response.assignedCount}칸`];
      if (response.missingCount > 0) {
        tokens.push(`미배치 ${response.missingCount}칸 (인원 부족)`);
        if (typeof window !== "undefined") {
          window.alert("업둥이 자동채우기 인원이 부족합니다. 지원자를 추가해 주세요.");
        }
      }
      setMessage(`업둥이 자동채우기를 완료했습니다. ${tokens.join(" · ")}`);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "업둥이 자동채우기에 실패했습니다.");
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (overrides?: {raidId?: string; candidate?: DnfCharacter; damage?: string; buff?: string}) => {
      const targetRaidId = overrides?.raidId ?? raidId;
      const candidate = overrides?.candidate ?? addCandidate;
      if (!targetRaidId) throw new Error("레이드를 먼저 선택하세요.");
      if (!candidate) throw new Error("캐릭터를 선택하세요.");
      const duplicateExists = participants.some(
        (p) =>
          p.character.characterId === candidate.characterId &&
          p.character.serverId === candidate.serverId
      );
      if (duplicateExists) {
        throw new Error("이미 공대에 있는 캐릭터입니다.");
      }
      const damageValue = overrides?.damage !== undefined ? overrides.damage : addDamage;
      const buffValue = overrides?.buff !== undefined ? overrides.buff : addBuff;
      const parsedDamage = damageValue ? Number(damageValue) : 0;
      const parsedBuff = buffValue ? Number(buffValue) : 0;
      await addParticipant(targetRaidId, {
        serverId: candidate.serverId,
        characterId: candidate.characterId,
        damage: parsedDamage,
        buffPower: parsedBuff,
      });
    },
    onSuccess: (_data, variables) => {
      const targetId = variables?.raidId ?? raidId;
      if (targetId) {
        queryClient.invalidateQueries({queryKey: ["raid", targetId]});
      }
      setMessage("공대에 추가했습니다.");
      setAddCandidate(null);
      setAddDamage("");
      setAddBuff("");
      setShowSupportModal(false);
    },
  });

  const resetAssignmentsMutation = useMutation({
    mutationFn: async () => {
      const targets =
        cohortRaidDetails.length > 0
          ? cohortRaidDetails
          : raid
            ? [raid]
            : [];
      if (targets.length === 0) throw new Error("레이드를 먼저 선택하세요.");

      let cleared = 0;
      for (const detail of targets) {
        const updates = detail.participants
          .filter((p) => p.partyNumber !== null || p.slotIndex !== null)
          .map((p) => updateParticipant(detail.id, p.id, {partyNumber: null, slotIndex: null}));
        if (updates.length > 0) {
          await Promise.all(updates);
          cleared += updates.length;
        }
      }
      return {cleared, raidIds: targets.map((r) => r.id)};
    },
    onSuccess: (result) => {
      result.raidIds.forEach((id) => queryClient.invalidateQueries({queryKey: ["raid", id]}));
      setMessage(`배치를 초기화했습니다. 해제 인원 ${result.cleared}명`);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "배치 초기화에 실패했습니다.");
    },
  });

  const recentRaidsList = recentRaidsQuery.data ?? [];
  const cohortCount = Math.max(normalizedCohorts.length, 1);

  useEffect(() => {
    const nextCount = Math.max(normalizedCohorts.length || (raid ? 1 : 0), 1);
    setCohortCountInput(nextCount);
  }, [normalizedCohorts.length, raid]);

  const cohortRaidQueries = useQueries({
    queries: normalizedCohorts.map((summary) => ({
      queryKey: ["raid", summary.id],
      queryFn: () => getRaid(summary.id),
      enabled: normalizedCohorts.length > 0,
    })),
    combine: (results) => results,
  });

  const cohortRaidDetails = useMemo(() => {
    if (normalizedCohorts.length === 0) return raid ? [raid] : [];
    const details = cohortRaidQueries
      .map((q) => q.data)
      .filter((item): item is RaidDetail => Boolean(item));
    // ensure current raid is included if loaded
    if (raid && !details.some((d) => d.id === raid.id)) {
      return [raid, ...details];
    }
    return details;
  }, [cohortRaidQueries, normalizedCohorts.length, raid]);

  const cohortDetailMap = useMemo(() => {
    const map = new Map<string, RaidDetail>();
    cohortRaidDetails.forEach((detail) => map.set(detail.id, detail));
    return map;
  }, [cohortRaidDetails]);

  const pooledParticipants = useMemo(() => {
    const source = cohortRaidDetails.length > 0 ? cohortRaidDetails : raid ? [raid] : [];
    const seen = new Set<string>();
    const list: Participant[] = [];
    source.forEach((detail) => {
      detail.participants.forEach((p) => {
        if (seen.has(p.id)) return;
        seen.add(p.id);
        list.push(p);
      });
    });
    return list;
  }, [cohortRaidDetails, raid]);

  const pooledUnassigned = useMemo(() => {
    const seen = new Set<string>();
    const list: Participant[] = [];
    pooledParticipants
      .filter((p) => !p.partyNumber)
      .forEach((p) => {
        if (seen.has(p.id)) return;
        seen.add(p.id);
        list.push(p);
    });
    return list;
  }, [pooledParticipants]);

  const adventureGroups = useMemo(() => {
    const groups: Record<
      string,
      {key: string; adventureName: string | null; label: string; total: number; assigned: number; characters: string[]}
    > = {};

    pooledParticipants.forEach((p) => {
      const rawName = p.character.adventureName?.trim();
      const adventureName = rawName && rawName.length > 0 ? rawName : null;
      const key = adventureName ?? "__unknown__";
      if (!groups[key]) {
        groups[key] = {
          key,
          adventureName,
          label: adventureName ?? "모험단 미표기",
          total: 0,
          assigned: 0,
          characters: [],
        };
      }
      const group = groups[key];
      group.total += 1;
      if (p.partyNumber) {
        group.assigned += 1;
      }
      if (group.characters.length < 5) {
        group.characters.push(p.character.characterName);
      }
    });

    return Object.values(groups).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.label.localeCompare(b.label);
    });
  }, [pooledParticipants]);

  const groupedRecentRaids = useMemo(() => {
    const list = recentRaidsList;
    if (!list || list.length === 0) return [];
    const groups = new Map<
      string,
      {
        baseName: string;
        raids: RaidSummary[];
        latest: RaidSummary;
        count: number;
      }
    >();
    list.forEach((item) => {
      const base = normalizeCohortName(item.name);
      const existing = groups.get(base);
      if (!existing) {
        groups.set(base, {baseName: base, raids: [item], latest: item, count: 1});
        return;
      }
      existing.raids.push(item);
      existing.count += 1;
      const existingDate = existing.latest.createdAt ? new Date(existing.latest.createdAt).getTime() : 0;
      const currentDate = item.createdAt ? new Date(item.createdAt).getTime() : 0;
      if (currentDate > existingDate) {
        existing.latest = item;
      }
    });
    return Array.from(groups.values()).sort((a, b) => {
      const aDate = a.latest.createdAt ? new Date(a.latest.createdAt).getTime() : 0;
      const bDate = b.latest.createdAt ? new Date(b.latest.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }, [recentRaidsList]);

  const handleRemoveEmptyCohort = (index: number) => {
    setCohortRaids((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const detail = cohortDetailMap.get(target.id);
      if (!detail || detail.participants.length > 0) return prev;
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0) {
        setRaidId(null);
        setMotherRaidId(null);
      } else if (raidId === target.id) {
        setRaidId(next[0].id);
        setMotherRaidId(next[0].motherRaidId);
        setRaidName(next[0].name);
      }
      setMessage("빈 기수를 목록에서 제거했습니다.");
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <section className="frosted p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-text-muted">현재 레이드</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display text-xl text-text">{displayRaidName}</p>
              <span className="pill border-panel-border bg-panel text-xs text-text-muted">
                {activeRaidMode.name} · {activeRaidMode.badge}
              </span>
              <span
                className={`pill text-xs ${isPublic ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-50 text-slate-700"}`}
              >
                {isPublic ? "공개 레이드 (목록 표시)" : "비공개 레이드 (링크/ID 전용)"}
              </span>
            </div>
            <p className="text-xs text-text-subtle">
              공대장 키: {displayLeaderKey} · 공대 ID: {displayRaidId}
            </p>
            {leaderCharacter && (
              <p className="text-xs text-text-subtle">
                공대장 캐릭터: {leaderCharacter.characterName} ({leaderCharacter.adventureName ?? "모험단 미표기"})
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs text-text-subtle bg-panel border border-panel-border rounded-lg px-3 py-1">
              <span>기수 설정</span>
              <input
                type="number"
                min={1}
                max={30}
                value={cohortCountInput}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isNaN(next)) return;
                  setCohortCountInput(Math.min(Math.max(next, 1), 30));
                }}
                className="w-16 rounded border border-panel-border bg-panel px-2 py-1 text-sm text-text focus:border-primary focus:outline-none"
              />
            </label>
            <button
              onClick={handleSetCohortCount}
              disabled={
                !leaderId ||
                createRaidMutation.isPending ||
                createRaidBatchMutation.isPending
              }
              className="pill border-primary/30 bg-primary text-white hover:bg-primary-dark shadow-soft transition disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              기수 설정
            </button>
            <button
              onClick={() => latestRaidMutation.mutate()}
              disabled={!leaderId || latestRaidMutation.isPending}
              className="pill border-panel-border bg-panel text-text hover:bg-panel-muted transition"
            >
              <Telescope className="h-4 w-4" />
              공대장 모험단 최근 레이드
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

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">캐릭터 검색 후 바로 공대에 추가</span>
              <div className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                <Search className="h-4 w-4 text-text-subtle" />
                <select
                  value={leaderSearchTarget}
                  onChange={(e) => setLeaderSearchTarget(e.target.value)}
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
                  value={leaderSearch}
                  onChange={(e) => setLeaderSearch(e.target.value)}
                  placeholder="닉네임 또는 모험단명 입력"
                  className="bg-transparent outline-none flex-1 text-sm text-text placeholder:text-text-subtle"
                />
                <button
                  type="button"
                  onClick={handleLeaderSearch}
                  className="text-sm text-primary hover:text-primary-dark whitespace-nowrap px-2"
                >
                  검색
                </button>
              </div>
              <p className="text-xs text-text-subtle">
                서버를 고르면 닉네임 검색, "모험단"을 고르면 모험단명으로 불러옵니다.
              </p>
            </label>
            {leaderCharacter ? (
              <div className="flex items-center justify-between rounded-lg border border-panel-border bg-panel px-3 py-2 text-sm text-text">
                <div>
                  <p className="font-display">{leaderCharacter.characterName}</p>
                  <p className="text-xs text-text-subtle">
                    모험단 {leaderCharacter.adventureName ?? "-"} · 서버 {getServerName(leaderCharacter.serverId)}
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
              <p className="text-xs text-text-subtle">검색 후 캐릭터를 선택해 바로 공대에 추가할 수 있습니다.</p>
            )}
          </div>

          <label className="space-y-1 text-sm">
            <span className="text-text-muted">레이드 이름 · 모드</span>
            <div className="flex gap-2">
              <select
                value={activeRaidMode.id}
                onChange={(e) => setRaidModeId(e.target.value as (typeof RAID_MODES)[number]["id"])}
                className="rounded-lg border border-panel-border bg-panel px-2 py-2 text-sm text-text focus:border-primary focus:outline-none"
              >
                {RAID_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name} · {mode.badge}
                  </option>
                ))}
              </select>
              <input
                className="flex-1 rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={raidName}
                onChange={(e) => setRaidName(e.target.value)}
                placeholder="예: 12/7(토) 오후 레이드"
              />
            </div>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-text-muted">공개 설정</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleVisibilityChange(true)}
                className={`pill text-sm transition ${
                  isPublic
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800 shadow-soft"
                    : "border-panel-border bg-panel text-text hover:bg-panel-muted"
                }`}
                disabled={updateVisibilityMutation.isPending}
              >
                공개 레이드 (목록 표시)
              </button>
              <button
                type="button"
                onClick={() => handleVisibilityChange(false)}
                className={`pill text-sm transition ${
                  !isPublic
                    ? "border-slate-300 bg-slate-100 text-slate-800 shadow-soft"
                    : "border-panel-border bg-panel text-text hover:bg-panel-muted"
                }`}
                disabled={updateVisibilityMutation.isPending}
              >
                비공개 레이드 (링크/ID 전용)
              </button>
              {updateVisibilityMutation.isPending && raidId && (
                <div className="flex items-center gap-2 text-xs text-text-subtle">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  저장 중...
                </div>
              )}
            </div>
            <p className="text-xs text-text-subtle">
              공개: 공대 목록/검색에 노출 · 비공개: URL 또는 ID를 아는 사람만 지원/조회 가능
            </p>
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-text-muted">공대 ID</span>
            <input
              className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={motherRaidId ?? raidId ?? ""}
              onChange={(e) => {
                const value = e.target.value || null;
                setMotherRaidId(value);
                setRaidId(value);
              }}
              placeholder="공대 ID를 직접 입력하거나 불러오세요"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Sparkles className="h-4 w-4 text-primary" />
            새 레이드는 공대장 페이지에서만 생성합니다.
          </div>
        </div>

        <div className="space-y-2">
          {leaderSearchMutation.isPending && (
            <div className="flex items-center gap-2 text-text-subtle text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              공대장 검색 중...
            </div>
          )}

          {minFameRequirement != null && (
            <div className="text-xs text-text-muted">
              {activeRaidMode.name}: 명성 {minFameRequirement.toLocaleString()} 이상만 검색 결과에 표시됩니다.
            </div>
          )}
        </div>

          {filteredLeaderSearchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-text-muted">검색 결과</p>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredLeaderSearchResults.map((character: DnfCharacter) => (
                  <div key={character.characterId} className="space-y-2">
                    <CharacterCard
                      character={character}
                      onAction={() => handleQuickAdd(character)}
                      actionLabel="공대에 추가"
                      highlight={leaderCharacter?.characterId === character.characterId}
                      subtitle={character.adventureName ? `모험단 ${character.adventureName}` : undefined}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
      </section>

      {leaderId && (
        <section className="frosted p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm text-text-muted">최근 {recentLimit}개 레이드</p>
              <p className="font-display text-xl text-text">지난 레이드 불러오기</p>
              <p className="text-xs text-text-subtle">리더(모험단) 기준으로 최근 {recentLimit}개를 불러옵니다.</p>
            </div>
            {recentRaidsQuery.isFetching && (
              <div className="flex items-center gap-2 text-xs text-text-subtle">
                <Loader2 className="h-4 w-4 animate-spin" />
                불러오는 중...
              </div>
            )}
          </div>

          {groupedRecentRaids.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {groupedRecentRaids.map((group) => (
                <div
                  key={group.baseName}
                  className="rounded-xl border border-panel-border bg-panel p-4 shadow-soft space-y-3"
                >
                  {(() => {
                    const formattedDate = group.latest.createdAt ? new Date(group.latest.createdAt).toLocaleDateString() : "날짜 미표기";
                    return (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                        <p
                          className="font-display text-lg text-text"
                          title={group.baseName}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {group.baseName}
                        </p>
                            <p className="text-xs text-text-subtle">
                              기수 {group.count}개 · 최신 {formattedDate}
                            </p>
                          </div>
                          <span
                            className={`pill text-[11px] ${
                              group.latest.isPublic
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-300 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {group.latest.isPublic ? "공개" : "비공개"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cohort = buildCohortFromList(group.latest, recentRaidsList);
                        setCohortRaids(cohort);
                        setRaidId(group.latest.id);
                        setMotherRaidId(group.latest.motherRaidId);
                        setRaidName(group.latest.name);
                        setIsPublic(group.latest.isPublic);
                        setMessage(`${cohort.length}기 레이드를 불러왔습니다.`);
                      }}
                      className="pill border-panel-border bg-panel text-text hover:bg-panel-muted transition text-sm"
                    >
                      불러오기
                    </button>
                    <button
                      type="button"
                      onClick={() => cloneMutation.mutate(group.latest.id)}
                      disabled={cloneMutation.isPending}
                      className="pill border-panel-border bg-panel text-text hover:bg-panel-muted transition text-sm disabled:opacity-60"
                    >
                      <Copy className="h-4 w-4" />
                      복사해서 새 레이드
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-subtle">최근 레이드가 없습니다.</p>
          )}
        </section>
      )}

      {raid && (
        <section className="frosted p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm text-text-muted">신청자 모험단</p>
              <p className="font-display text-xl text-text">모험단별 인원 관리</p>
              <p className="text-xs text-text-subtle">모험단 삭제 시 배치된 캐릭터도 함께 제거됩니다.</p>
            </div>
            {deleteAdventureMutation.isPending && (
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                삭제 중...
              </div>
            )}
          </div>
          {adventureGroups.length === 0 ? (
            <p className="text-sm text-text-subtle">신청한 모험단이 없습니다.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {adventureGroups.map((group) => (
                <div
                  key={group.key}
                  className="rounded-xl border border-panel-border bg-panel p-4 shadow-soft space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg text-text">{group.label}</p>
                      <p className="text-xs text-text-subtle">
                        신청 {group.total}명 · 배치 {group.assigned}명
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAdventureMutation.mutate(group.adventureName)}
                      disabled={!raidId || deleteAdventureMutation.isPending}
                      className="pill border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition text-xs disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      모험단 삭제
                    </button>
                  </div>
                  {group.characters.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-[11px] text-text-subtle">
                      {group.characters.map((name) => (
                        <span
                          key={name}
                          className="pill border-panel-border bg-panel-muted text-text-subtle"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {raid && (
        <section className="frosted p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm text-text-muted">자동 채우기</p>
              <p className="font-display text-xl text-text">딜/버프 평균에 맞춰 배치</p>
              <p className="text-xs text-text-subtle">
                값이 비어 있으면 레드 &gt; 옐로 ≈ 그린 기준으로 자동 배치합니다. 같은 모험단은 한 번만 배치됩니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(autoFillMutation.isPending || autoFillKeepPlacedMutation.isPending || updongAutoFillMutation.isPending) && (
                <div className="flex items-center gap-2 text-xs text-text-subtle">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  자동 채우는 중...
                </div>
              )}
              <button
                type="button"
                onClick={() => autoFillMutation.mutate()}
                disabled={!raidId || autoFillMutation.isPending}
                className="pill border-primary/30 bg-primary text-white hover:bg-primary-dark transition shadow-soft disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                자동 채우기
              </button>
              <button
                type="button"
                onClick={() => updongAutoFillMutation.mutate()}
                disabled={!raidId || updongAutoFillMutation.isPending}
                className="pill border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition shadow-soft text-sm disabled:opacity-60"
              >
                <PlugZap className="h-4 w-4" />
                업둥이 자동채우기
              </button>
              <button
                type="button"
                onClick={() => autoFillKeepPlacedMutation.mutate()}
                disabled={!raidId || autoFillKeepPlacedMutation.isPending}
                className="pill border-panel-border bg-panel text-text hover:bg-panel-muted transition shadow-soft disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                빈칸만 채우기
              </button>
            </div>
          </div>

          <div
            className={`grid gap-3 sm:grid-cols-2 ${
              activeRaidMode.partyCount === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            {Array.from({length: activeRaidMode.partyCount}, (_, idx) => {
              const label = ["레드", "옐로", "그린", "블루"][idx] ?? `파티 ${idx + 1}`;
              const target = partyTargets[idx] ?? {damage: "", buff: ""};
              const computed = computedPartyTargets[idx];
              const badgeClass =
                idx === 0
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : idx === 1
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700";
              return (
                <div
                  key={label}
                  className="rounded-xl border border-panel-border bg-panel p-4 shadow-soft space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`pill text-xs ${badgeClass}`}>{label} 파티</span>
                      <span className="text-[11px] text-text-subtle">
                        목표: 딜 {computed?.damageTarget.toLocaleString()}억 · 버프{" "}
                        {computed?.buffTarget.toLocaleString()}만
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="space-y-1 text-sm">
                      <span className="text-text-muted">평균 딜 (억)</span>
                      <input
                        value={target.damage}
                        onChange={(e) => handlePartyTargetChange(idx, "damage", e.target.value)}
                        placeholder="비우면 자동"
                        className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="text-text-muted">평균 버프력 (만)</span>
                      <input
                        value={target.buff}
                        onChange={(e) => handlePartyTargetChange(idx, "buff", e.target.value)}
                        placeholder="비우면 자동"
                        className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-text-subtle">
                    빈칸이면 전체 평균을 기준으로 레드는 높게, 옐로·그린은 비슷하게 맞춥니다.
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="rounded-xl border border-panel-border bg-panel px-3 py-2 shadow-soft space-y-2">
        <div className="flex items-center gap-2 text-xs text-text-subtle">
          <CalendarClock className="h-3.5 w-3.5 text-primary" />
          기수 선택
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {Array.from({length: cohortCount}, (_, idx) => {
              const raid = normalizedCohorts[idx];
              const active = raid && raidId === raid.id;
              const disabled = !raid;
              const detail = raid ? cohortDetailMap.get(raid.id) : null;
              const canRemove = detail && detail.participants.length === 0;
              return (
                <div
                  key={idx}
                  className={clsx(
                    "flex min-w-[110px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition",
                    active
                      ? "border-primary bg-primary text-white shadow-soft"
                      : disabled
                        ? "border-dashed border-panel-border/70 bg-panel text-text-subtle"
                        : "border-panel-border bg-panel text-text hover:bg-panel-muted"
                  )}
                  title={raid?.name ?? "레이드를 생성하거나 불러오세요."}
                  role={disabled ? undefined : "button"}
                  tabIndex={disabled ? -1 : 0}
                  onClick={() => raid && handleQuickRaidSelect(raid, idx)}
                  onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      raid && handleQuickRaidSelect(raid, idx);
                    }
                  }}
                >
                  <span className="font-display text-sm">{idx + 1}기</span>
                  <span
                    className={clsx(
                      "truncate text-[11px] text-left",
                      active ? "text-white/80" : "text-text-subtle"
                    )}
                  >
                    {raid?.name ?? "미지정"}
                  </span>
                  {canRemove && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveEmptyCohort(idx);
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-700 underline-offset-2 underline"
                      aria-label={`${idx + 1}기 삭제`}
                    >
                      삭제
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="pill border-primary/30 bg-primary-muted text-text">
            <CalendarClock className="h-4 w-4" />
            파티에 배치하면 즉시 저장됩니다.
          </div>
          <button
            type="button"
            onClick={() => resetAssignmentsMutation.mutate()}
            disabled={resetAssignmentsMutation.isPending || (!raidId && cohortRaidDetails.length === 0)}
            className="pill border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition text-sm disabled:opacity-60"
          >
            배치 초기화
          </button>
          <div className="text-sm text-text-subtle">
            평균 딜/버프는 단순 산술 평균 (딜=억, 버프=만)
          </div>
        </div>

        {raidId ? (
          <PartyBoard
            participants={participants}
            unassignedParticipants={pooledUnassigned}
            activeRaidId={raidId}
            partyCount={activeRaidMode.partyCount}
            slotsPerParty={activeRaidMode.slotsPerParty}
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
            {Array.from({length: activeRaidMode.partyCount}, (_, idx) => idx + 1).map((party) => (
              <div key={party} className="rounded-xl border border-panel-border bg-panel p-4 shadow-soft">
                <p className="text-text-muted text-sm">파티 {party}</p>
                <p className="font-display text-2xl text-text">
                  딜 {partyStats[party]?.avgDamage.toLocaleString() ?? 0}억
                </p>
                <p className="text-sm text-amber-600">
                  버프 {partyStats[party]?.avgBuff.toLocaleString() ?? 0}만
                </p>
                <p className="text-xs text-text-subtle">
                  인원 {partyStats[party]?.count ?? 0} / {activeRaidMode.slotsPerParty}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {addCandidate && showSupportModal && (
        <SupportModal
          character={addCandidate}
          damage={addDamage}
          buff={addBuff}
          onChangeDamage={setAddDamage}
          onChangeBuff={setAddBuff}
          onSubmit={() => addParticipantMutation.mutate(undefined)}
          onClose={() => {
            setAddCandidate(null);
            setAddDamage("");
            setAddBuff("");
            setShowSupportModal(false);
          }}
          isSubmitting={addParticipantMutation.isPending}
          canSubmit={Boolean(raidId) && !addParticipantMutation.isPending}
          actionLabel="이 캐릭터를 공대에 추가"
        />
      )}
    </div>
  );
}

export default LeaderDashboard;
