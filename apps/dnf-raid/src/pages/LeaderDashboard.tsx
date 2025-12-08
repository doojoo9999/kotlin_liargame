import {useEffect, useMemo, useRef, useState} from "react";
import {useMutation, useQuery, useQueryClient, useQueries} from "@tanstack/react-query";
import {CalendarClock, Copy, Loader2, RefreshCw, Search, Sparkles, Telescope, Trash2, Undo2} from "lucide-react";
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
  deleteParticipantsByAdventure,
} from "../services/dnf";
import {useRaidSession} from "../hooks/useRaidSession";
import {PartyBoard} from "../components/PartyBoard";
import {CharacterCard} from "../components/CharacterCard";
import type {DnfCharacter, RaidDetail, RaidSummary} from "../types";
import {
  DNF_SERVERS,
  RAID_MODES,
  getServerName,
  type DnfServerId,
} from "../constants";
import {SupportModal} from "../components/SupportModal";
import {useRaidMode} from "../hooks/useRaidMode";
import {autoAssignParticipants, type PartyTargetConfig, type AutoAssignResult} from "../utils/autoAssign";
import {buildLeaderId} from "../hooks/useRaidSession";

function LeaderDashboard() {
  const {raidId, leaderId, leaderCharacter, setRaidId, setLeaderCharacter} = useRaidSession();
  const {raidMode: selectedRaidMode, setRaidModeId} = useRaidMode();
  const [raidName, setRaidName] = useState(selectedRaidMode.name);
  const [isPublic, setIsPublic] = useState(false);
  const [batchCount, setBatchCount] = useState(1);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [leaderSearchTarget, setLeaderSearchTarget] = useState<string>(DNF_SERVERS[0].id);
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
      setRaidName(data.name);
      setIsPublic(data.isPublic);
      setMessage("최근 레이드를 불러왔습니다.");
      queryClient.setQueryData(["raid", data.id], data);
    },
  });

  const createRaidMutation = useMutation({
    mutationFn: () => {
      if (!leaderId) throw new Error("공대장을 먼저 선택하세요.");
      return createRaid({name: raidName, userId: leaderId, isPublic});
    },
    onSuccess: (data) => {
      setRaidId(data.id);
      setIsPublic(data.isPublic);
      setMessage("새 레이드가 만들어졌습니다.");
      queryClient.setQueryData(["raid", data.id], data);
      const summary = toRaidSummary(data);
      setCohortRaids([summary]);
    },
  });

  const createRaidBatchMutation = useMutation({
    mutationFn: async (count: number) => {
      if (!leaderId) throw new Error("공대장을 먼저 선택하세요.");
      const safeCount = Math.min(Math.max(count, 1), 30);
      const results: RaidDetail[] = [];
      for (let i = 1; i <= safeCount; i += 1) {
        const name = safeCount > 1 ? `${raidName} ${i}기` : raidName;
        const data = await createRaid({name, userId: leaderId, isPublic});
        results.push(data);
      }
      return results;
    },
    onSuccess: (results) => {
      const last = results[results.length - 1];
      setRaidId(last.id);
      setRaidName(last.name);
      setIsPublic(last.isPublic);
      setMessage(`${results.length}개 레이드를 생성했습니다.`);
      results.forEach((raid) => queryClient.setQueryData(["raid", raid.id], raid));
      latestRaidMutation.reset();
      setCohortRaids(results.map(toRaidSummary));
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (targetRaidId: string) => cloneRaid(targetRaidId, {isPublic}),
    onSuccess: (data) => {
      setRaidId(data.id);
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
    mutationFn: (adventureName: string | null) => {
      if (!raidId) throw new Error("레이드를 먼저 선택하세요.");
      return deleteParticipantsByAdventure(raidId, adventureName);
    },
    onSuccess: (data, adventureName) => {
      queryClient.setQueryData(["raid", data.id], data);
      setMessage(`${adventureName ?? "모험단 미표기"} 모험단 지원자를 삭제했습니다.`);
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
  const participants = raid?.participants ?? [];
  const leaderSearchResults = leaderSearchMutation.data ?? [];
  const activeRaidMode = selectedRaidMode;
  const recentLimit = 12;
  const [showSupportModal, setShowSupportModal] = useState(false);

  const displayRaidName = raid?.name ?? raidName ?? selectedRaidMode.name;
  const displayRaidId = raidId ?? "생성 전 (캐릭터 추가 시 자동 생성)";
  const displayLeaderKey = raid?.userId ?? leaderId ?? "자동 생성 예정";

  const filteredLeaderSearchResults = useMemo(
    () =>
      activeRaidMode.minFame
        ? leaderSearchResults.filter((c) => c.fame >= activeRaidMode.minFame)
        : leaderSearchResults,
    [activeRaidMode.minFame, leaderSearchResults]
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

  const adventureGroups = useMemo(() => {
    const groups: Record<
      string,
      {key: string; adventureName: string | null; label: string; total: number; assigned: number; characters: string[]}
    > = {};

    participants.forEach((p) => {
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
  }, [participants]);

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
    const data = await createRaid({name, userId, isPublic});
    setRaidId(data.id);
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
    setLeaderCharacter(character);
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
    isPublic: data.isPublic,
    participantCount: data.participants.length,
    createdAt: data.createdAt,
  });

  const handleCreateRaids = () => {
    if (batchCount > 1) {
      createRaidBatchMutation.mutate(batchCount);
    } else {
      createRaidMutation.mutate();
    }
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
    }
  }, [raid?.id, raid?.name, raid?.isPublic, raidId]);

  useEffect(() => {
    if (leaderId && !raidId && autoLatestRequested.current !== leaderId) {
      latestRaidMutation.mutate();
      autoLatestRequested.current = leaderId;
    }
  }, [leaderId, raidId, latestRaidMutation]);

  const autoFillMutation = useMutation({
    mutationFn: async () => {
      const recentList = recentRaidsQuery.data ?? [];
      const defaultCohort =
        raid && raidId
          ? buildCohortFromList(toRaidSummary(raid), recentList.length > 0 ? recentList : [toRaidSummary(raid)])
          : [];
      const targetSummaries =
        cohortRaids.length > 0
          ? cohortRaids
          : defaultCohort;
      const dedupedTargets = Array.from(new Map(targetSummaries.map((item) => [item.id, item])).values());
      if (dedupedTargets.length === 0) throw new Error("레이드를 먼저 선택하세요.");
      if (targetSummaries.length === 0) throw new Error("레이드를 먼저 선택하세요.");

      const raidDetails = await Promise.all(
        dedupedTargets.map(async (summary) => {
          if (summary.id === raid?.id && raid) return raid;
          return getRaid(summary.id);
        })
      );

      const totalApplicants = raidDetails.reduce(
        (sum, detail) => sum + (detail?.participants.length ?? 0),
        0
      );
      if (totalApplicants === 0) throw new Error("배치할 신청자가 없습니다.");

      const buildAdventureKey = (p: Participant) => {
        const raw = p.character.adventureName?.trim().toLowerCase();
        if (raw && raw.length > 0) return `adv:${raw}`;
        return `char:${p.character.characterId}`;
      };

      const scoreParticipant = (p: Participant) => p.damage + p.buffPower * 8;

      const perRaidAdventureMap = new Map<
        string,
        Map<
          string,
          {
            adventureKey: string;
            list: Participant[];
          }
        >
      >();

      raidDetails.forEach((detail) => {
        if (!detail) return;
        const adventureMap = perRaidAdventureMap.get(detail.id) ?? new Map();
        detail.participants.forEach((p) => {
          const key = buildAdventureKey(p);
          if (!adventureMap.has(key)) {
            adventureMap.set(key, {adventureKey: key, list: []});
          }
          adventureMap.get(key)?.list.push(p);
        });
        adventureMap.forEach((bucket) => {
          bucket.list.sort((a, b) => scoreParticipant(b) - scoreParticipant(a));
        });
        perRaidAdventureMap.set(detail.id, adventureMap);
      });

      const adventureKeys = Array.from(
        new Set(
          raidDetails.flatMap((detail) =>
            detail ? detail.participants.map((p) => buildAdventureKey(p)) : []
          )
        )
      );

      const raidStates = raidDetails.map((detail) => {
        const assigned = detail?.participants.filter((p) => p.partyNumber) ?? [];
        const used = new Set<string>(assigned.map((p) => buildAdventureKey(p)));
        const capacity =
          Math.max(activeRaidMode.partyCount * activeRaidMode.slotsPerParty - assigned.length, 0);
        return {
          detail,
          picks: detail ? [...assigned] : [],
          used,
          capacity,
        };
      });

      adventureKeys.forEach((adventureKey) => {
        raidStates.forEach((state) => {
          const detail = state.detail;
          if (!detail) return;
          if (state.capacity <= 0) return;
          if (state.used.has(adventureKey)) return;
          const adventureMap = perRaidAdventureMap.get(detail.id);
          const bucket = adventureMap?.get(adventureKey);
          if (!bucket || bucket.list.length === 0) return;
          const candidate = bucket.list.shift();
          if (!candidate) return;
          state.picks.push(candidate);
          state.used.add(adventureKey);
          state.capacity -= 1;
        });
      });

      const applyAutoFillForRaid = async (state: {
        detail: RaidDetail;
        picks: Participant[];
        used: Set<string>;
      }): Promise<{
        raidId: string;
        name: string;
        result: AutoAssignResult;
      }> => {
        const result = autoAssignParticipants({
          participants: state.picks,
          partyCount: activeRaidMode.partyCount,
          slotsPerParty: activeRaidMode.slotsPerParty,
          targets: computedPartyTargets,
        });

        const participantMap = new Map(state.picks.map((p) => [p.id, p]));
        const updates = result.assignments
          .filter(({participantId, partyNumber, slotIndex}) => {
            const current = participantMap.get(participantId);
            if (!current) return false;
            return current.partyNumber !== partyNumber || current.slotIndex !== slotIndex;
          })
          .map(({participantId, partyNumber, slotIndex}) =>
            updateParticipant(state.detail.id, participantId, {partyNumber, slotIndex})
          );

        if (updates.length > 0) {
          await Promise.all(updates);
        }

        return {raidId: state.detail.id, name: state.detail.name, result};
      };

      const results: Array<{
        raidId: string;
        name: string;
        label: string;
        result: AutoAssignResult;
      }> = [];

      for (let idx = 0; idx < raidStates.length; idx += 1) {
        const state = raidStates[idx];
        if (!state.detail) continue;
        const assignment = await applyAutoFillForRaid(state as {detail: RaidDetail; picks: Participant[]; used: Set<string>});
        const label =
          dedupedTargets.length > 0
            ? `${idx + 1}기`
            : state.detail.name
              ? state.detail.name
              : `${idx + 1}기`;
        results.push({...assignment, label});
      }

      return results;
    },
    onSuccess: (results) => {
      results.forEach((entry) => {
        queryClient.invalidateQueries({queryKey: ["raid", entry.raidId]});
      });

      const summaryText =
        results.length === 1
          ? (() => {
              const [result] = results;
              const tokens = [`배치 ${result.result.usedCount}명`];
              if (result.result.duplicateAdventureCount > 0) {
                tokens.push(`모험단 중복 ${result.result.duplicateAdventureCount}명 제외`);
              }
              if (result.result.unplacedCount > 0) {
                tokens.push(`남은 ${result.result.unplacedCount}명 미배치`);
              }
              return `${result.label}: ${tokens.join(" · ")}`;
            })()
          : results
              .map((entry) => {
                const tokens = [`배치 ${entry.result.usedCount}명`];
                if (entry.result.duplicateAdventureCount > 0) {
                  tokens.push(`모험단 중복 ${entry.result.duplicateAdventureCount}명 제외`);
                }
                if (entry.result.unplacedCount > 0) {
                  tokens.push(`남은 ${entry.result.unplacedCount}명 미배치`);
                }
                return `${entry.label}: ${tokens.join(" · ")}`;
              })
              .join(" / ");

      setMessage(`자동으로 파티를 채웠습니다. ${summaryText}`);
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "자동 채우기에 실패했습니다.");
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (overrides?: {raidId?: string; candidate?: DnfCharacter; damage?: string; buff?: string}) => {
      const targetRaidId = overrides?.raidId ?? raidId;
      const candidate = overrides?.candidate ?? addCandidate;
      if (!targetRaidId) throw new Error("레이드를 먼저 선택하세요.");
      if (!candidate) throw new Error("캐릭터를 선택하세요.");
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

  const recentRaidsList = recentRaidsQuery.data ?? [];
  const cohortCount = Math.max(batchCount, cohortRaids.length, 1);

  const cohortRaidQueries = useQueries({
    queries: cohortRaids.map((summary) => ({
      queryKey: ["raid", summary.id],
      queryFn: () => getRaid(summary.id),
      enabled: cohortRaids.length > 0,
    })),
    combine: (results) => results,
  });

  const cohortRaidDetails = useMemo(() => {
    if (cohortRaids.length === 0) return raid ? [raid] : [];
    const details = cohortRaidQueries
      .map((q) => q.data)
      .filter((item): item is RaidDetail => Boolean(item));
    // ensure current raid is included if loaded
    if (raid && !details.some((d) => d.id === raid.id)) {
      return [raid, ...details];
    }
    return details;
  }, [cohortRaidQueries, cohortRaids.length, raid]);

  const pooledUnassigned = useMemo(() => {
    const source = cohortRaidDetails.length > 0 ? cohortRaidDetails : raid ? [raid] : [];
    const seen = new Set<string>();
    const list: Participant[] = [];
    source.forEach((detail) => {
      detail.participants
        .filter((p) => !p.partyNumber)
        .forEach((p) => {
          if (seen.has(p.id)) return;
          seen.add(p.id);
          list.push(p);
        });
    });
    return list;
  }, [cohortRaidDetails, raid]);

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
              공대장 키: {displayLeaderKey} · Raid ID: {displayRaidId}
            </p>
            {leaderCharacter && (
              <p className="text-xs text-text-subtle">
                공대장 캐릭터: {leaderCharacter.characterName} ({leaderCharacter.adventureName ?? "모험단 미표기"})
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs text-text-subtle bg-panel border border-panel-border rounded-lg px-3 py-1">
              <span>기수 수</span>
              <input
                type="number"
                min={1}
                max={30}
                value={batchCount}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isNaN(next)) return;
                  setBatchCount(Math.min(Math.max(next, 1), 30));
                }}
                className="w-16 rounded border border-panel-border bg-panel px-2 py-1 text-sm text-text focus:border-primary focus:outline-none"
              />
            </label>
            <button
              onClick={handleCreateRaids}
              disabled={
                !leaderId ||
                createRaidMutation.isPending ||
                createRaidBatchMutation.isPending
              }
              className="pill border-primary/30 bg-primary text-white hover:bg-primary-dark shadow-soft transition disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {batchCount > 1 ? `새 레이드 ${batchCount}개 생성` : "새 레이드 생성"}
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
            <span className="text-text-muted">레이드 ID</span>
            <input
              className="w-full rounded-lg border border-panel-border bg-panel px-3 py-2 text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={raidId ?? ""}
              onChange={(e) => setRaidId(e.target.value || null)}
              placeholder="직접 입력 또는 불러오기"
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

          {activeRaidMode.minFame && (
            <div className="text-xs text-text-muted">
              {activeRaidMode.name}: 명성 {activeRaidMode.minFame.toLocaleString()} 이상만 검색 결과에 표시됩니다.
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

          {recentRaidsQuery.data && recentRaidsQuery.data.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recentRaidsQuery.data.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-panel-border bg-panel p-4 shadow-soft space-y-3"
                >
                  {(() => {
                    const formattedDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "날짜 미표기";
                    return (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                        <p
                          className="font-display text-lg text-text"
                          title={r.name}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {r.name}
                        </p>
                            <p className="text-xs text-text-subtle">
                              참가자 {r.participantCount}명 · {formattedDate}
                            </p>
                          </div>
                          <span
                            className={`pill text-[11px] ${
                              r.isPublic
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-300 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {r.isPublic ? "공개" : "비공개"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const cohort = buildCohortFromList(r, recentRaidsList);
                        setCohortRaids(cohort);
                        setRaidId(r.id);
                        setRaidName(r.name);
                        setIsPublic(r.isPublic);
                        setMessage(`${cohort.length}기 레이드를 불러왔습니다.`);
                      }}
                      className="pill border-panel-border bg-panel text-text hover:bg-panel-muted transition text-sm"
                    >
                      불러오기
                    </button>
                    <button
                      type="button"
                      onClick={() => cloneMutation.mutate(r.id)}
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
              {autoFillMutation.isPending && (
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
              const raid = cohortRaids[idx];
              const active = raid && raidId === raid.id;
              const disabled = !raid;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => raid && handleQuickRaidSelect(raid, idx)}
                  disabled={disabled}
                  className={clsx(
                    "flex min-w-[110px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition",
                    active
                      ? "border-primary bg-primary text-white shadow-soft"
                      : disabled
                        ? "border-dashed border-panel-border/70 bg-panel text-text-subtle"
                        : "border-panel-border bg-panel text-text hover:bg-panel-muted"
                  )}
                  title={raid?.name ?? "레이드를 생성하거나 불러오세요."}
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
                </button>
              );
            })}
          </div>
        </div>

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
          onSubmit={() => addParticipantMutation.mutate()}
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
