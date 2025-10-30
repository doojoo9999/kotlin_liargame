import {FormEvent, useEffect, useMemo, useState} from "react";
import {buildQuery, request} from "../api";
import {
  ItemGrade,
  ItemStatus,
  MemberStatus,
  type BossKillResponse,
  type BossResponse,
  type ItemResponse,
  type MemberResponse,
} from "../types";

interface ParticipantSelection {
  selected: boolean;
  baseWeight: string;
}

interface ItemDraft {
  key: string;
  name: string;
  grade: ItemGrade;
  acquiredAt: string;
  tags: string;
  note: string;
}

const createItemDraft = (acquiredDate: string): ItemDraft => ({
  key:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  name: "",
  grade: ItemGrade.RARE,
  acquiredAt: acquiredDate,
  tags: "",
  note: "",
});

export default function BossKillsPage() {
  const [bosses, setBosses] = useState<BossResponse[]>([]);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [kills, setKills] = useState<BossKillResponse[]>([]);
  const [bossId, setBossId] = useState<number | "">("");
  const [killedAt, setKilledAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [participantSelections, setParticipantSelections] = useState<Record<number, ParticipantSelection>>({});
  const [memberFilter, setMemberFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([]);
  const [itemSuggestions, setItemSuggestions] = useState<Record<string, ItemResponse[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [itemStatusMessage, setItemStatusMessage] = useState<string | null>(null);

  const getDefaultAcquiredDate = () => (killedAt ? killedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));

  const load = async () => {
    try {
      const [bossData, memberData, killData] = await Promise.all([
        request<BossResponse[]>("/bosses"),
        request<MemberResponse[]>("/members"),
        request<BossKillResponse[]>(`/boss-kills${buildQuery({limit: 30})}`),
      ]);
      setBosses(bossData);
      setMembers(memberData);
      setParticipantSelections((prev) => {
        const next: Record<number, ParticipantSelection> = {};
        memberData.forEach((member) => {
          next[member.id] = prev[member.id] ?? {selected: false, baseWeight: "1"};
        });
        return next;
      });
      setKills(killData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addItemDraft = () => {
    setItemDrafts((prev) => [...prev, createItemDraft(getDefaultAcquiredDate())]);
  };

  const removeItemDraft = (key: string) => {
    setItemDrafts((prev) => prev.filter((draft) => draft.key !== key));
    setItemSuggestions((prev) => {
      if (!prev[key]) return prev;
      const next = {...prev};
      delete next[key];
      return next;
    });
  };

  const updateItemDraft = (key: string, patch: Partial<ItemDraft>) => {
    setItemDrafts((prev) => prev.map((draft) => (draft.key === key ? {...draft, ...patch} : draft)));
  };

  const fetchItemSuggestions = async (key: string, keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setItemSuggestions((prev) => ({...prev, [key]: []}));
      return;
    }
    try {
      const results = await request<ItemResponse[]>(`/items${buildQuery({keyword: trimmed, limit: 8})}`);
      setItemSuggestions((prev) => ({...prev, [key]: results}));
    } catch (err) {
      console.error("아이템 추천을 불러오지 못했습니다.", err);
    }
  };

  const handleNameChange = (key: string, value: string) => {
    updateItemDraft(key, {name: value});
    void fetchItemSuggestions(key, value);
  };

  const handleSuggestionPick = (key: string, item: ItemResponse) => {
    updateItemDraft(key, {
      name: item.name,
      grade: item.grade,
      tags: item.tags.join(", "),
    });
    setItemSuggestions((prev) => ({...prev, [key]: []}));
  };

  const resetItemDrafts = () => {
    setItemDrafts([]);
    setItemSuggestions({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payloadParticipants = Object.entries(participantSelections)
      .filter(([, selection]) => selection.selected)
      .map(([memberId, selection]) => ({
        memberId: Number(memberId),
        baseWeight: 1,
        attendance: true,
      }));

    if (!bossId || payloadParticipants.length === 0) return;
    setSubmitting(true);
    setError(null);
    setItemStatusMessage(null);
    try {
      const bossKill = await request<BossKillResponse>("/boss-kills", {
        method: "POST",
        body: {
          bossId,
          killedAt: new Date(killedAt).toISOString(),
          notes: notes || null,
          participants: payloadParticipants,
        },
      });
      const draftsToCreate = itemDrafts.filter((draft) => draft.name.trim().length > 0);
      if (draftsToCreate.length > 0) {
        await Promise.all(
          draftsToCreate.map((draft) =>
            request<ItemResponse>("/items", {
              method: "POST",
              body: {
                name: draft.name.trim(),
                grade: draft.grade,
                acquiredAt: draft.acquiredAt || getDefaultAcquiredDate(),
                sourceBossKillId: bossKill.id,
                status: ItemStatus.IN_STOCK,
                note: draft.note || null,
                tags: draft.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              },
            })
          )
        );
        setItemStatusMessage(`드랍 아이템 ${draftsToCreate.length}개를 인벤토리에 등록했습니다.`);
      }
      setBossId("");
      setKilledAt(new Date().toISOString().slice(0, 16));
      setNotes("");
      setParticipantSelections((prev) => {
        const reset: Record<number, ParticipantSelection> = {};
        Object.entries(prev).forEach(([memberId]) => {
          reset[Number(memberId)] = {selected: false, baseWeight: "1"};
        });
        return reset;
      });
      resetItemDrafts();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const keyword = memberFilter.trim().toLowerCase();
    const activeMembers = members.filter((member) => member.status === MemberStatus.ACTIVE);
    if (!keyword) return activeMembers;
    return activeMembers.filter((member) => member.name.toLowerCase().includes(keyword));
  }, [members, memberFilter]);

  const toggleMemberSelection = (memberId: number, selected: boolean) => {
    setParticipantSelections((prev) => ({
      ...prev,
      [memberId]: {
        selected,
        baseWeight: prev[memberId]?.baseWeight ?? "1",
      },
    }));
  };

  return (
    <section className="card">
      <h2>보스킬 기록</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        정산 근거가 되는 보스킬 참여자를 시간 순으로 기록하세요. 참석 여부/가중치를 즉시 조정할 수 있습니다.
      </p>

      <form onSubmit={handleSubmit} className="grid">
        <select value={bossId} onChange={(event) => setBossId(event.target.value ? Number(event.target.value) : "")}>
          <option value="">보스를 선택하세요…</option>
          {bosses.map((boss) => (
            <option key={boss.id} value={boss.id}>
              {boss.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={killedAt}
          onChange={(event) => setKilledAt(event.target.value)}
        />
        <textarea
          placeholder="비고"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
        />

        <div className="card" style={{background: "rgba(15,23,42,0.4)"}}>
          <h3 style={{marginTop: 0}}>참여 혈원 선택</h3>
          <input
            placeholder="혈원 검색"
            value={memberFilter}
            onChange={(event) => setMemberFilter(event.target.value)}
          />
          <div className="participant-grid">
            {filteredMembers.length === 0 ? (
              <p style={{color: "#94a3b8"}}>조건에 맞는 혈원이 없습니다.</p>
            ) : (
              filteredMembers.map((member) => {
                const selection = participantSelections[member.id] ?? {selected: false, baseWeight: "1"};
                return (
                  <div
                    key={member.id}
                    className={`participant-row ${selection.selected ? "selected" : ""}`}
                  >
                    <label className="participant-checkbox">
                      <input
                        type="checkbox"
                        checked={selection.selected}
                        onChange={(event) => toggleMemberSelection(member.id, event.target.checked)}
                      />
                      <span className="member-name-clamp">{member.name}</span>
                    </label>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card" style={{background: "rgba(15,23,42,0.4)"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem"}}>
            <h3 style={{marginTop: 0}}>드랍 아이템 기록 (선택)</h3>
            <button type="button" className="ghost" onClick={addItemDraft}>
              + 아이템 추가
            </button>
          </div>
          {itemDrafts.length === 0 ? (
            <p style={{color: "#94a3b8", marginBottom: 0}}>
              드랍 아이템을 기록하려면 상단의 “아이템 추가” 버튼을 눌러 주세요.
            </p>
          ) : (
            <div className="item-draft-grid">
              {itemDrafts.map((draft) => (
                <div key={draft.key} className="item-draft-card">
                  <label className="item-draft-field">
                    <span>아이템 이름</span>
                    <div className="suggestion-wrapper">
                      <input
                        value={draft.name}
                        onChange={(event) => handleNameChange(draft.key, event.target.value)}
                        placeholder="예: 가우스 방패"
                      />
                      {itemSuggestions[draft.key]?.length ? (
                        <div className="suggestion-panel">
                          {itemSuggestions[draft.key]!.map((item) => (
                            <button type="button" key={item.id} onClick={() => handleSuggestionPick(draft.key, item)}>
                              <strong>{item.name}</strong>
                              <span>{item.grade}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                  <div className="grid grid-cols-2">
                    <label>
                      등급
                      <select
                        value={draft.grade}
                        onChange={(event) => updateItemDraft(draft.key, {grade: event.target.value as ItemGrade})}
                      >
                        {Object.values(ItemGrade).map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      획득일
                      <input
                        type="date"
                        value={draft.acquiredAt}
                        onChange={(event) => updateItemDraft(draft.key, {acquiredAt: event.target.value})}
                      />
                    </label>
                  </div>
                  <label className="item-draft-field">
                    <span>태그 (쉼표로 구분)</span>
                    <input
                      placeholder="방어구, 보호"
                      value={draft.tags}
                      onChange={(event) => updateItemDraft(draft.key, {tags: event.target.value})}
                    />
                  </label>
                  <label className="item-draft-field">
                    <span>메모</span>
                    <textarea
                      rows={2}
                      placeholder="필요 시 추가 설명을 입력하세요"
                      value={draft.note}
                      onChange={(event) => updateItemDraft(draft.key, {note: event.target.value})}
                    />
                  </label>
                  <div style={{display: "flex", justifyContent: "flex-end"}}>
                    <button type="button" className="ghost danger" onClick={() => removeItemDraft(draft.key)}>
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p style={{color: "#94a3b8", fontSize: "0.9rem", marginTop: "0.75rem"}}>
            보스킬이 저장되면 위 아이템이 인벤토리에 즉시 추가됩니다.
          </p>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "등록 중…" : "보스킬 등록"}
        </button>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}
      {itemStatusMessage && <p style={{color: "#bef264"}}>{itemStatusMessage}</p>}

      <table>
        <thead>
          <tr>
            <th>보스</th>
            <th>처치 시각</th>
            <th>비고</th>
            <th>참여 혈원</th>
          </tr>
        </thead>
        <tbody>
          {kills.map((kill) => (
            <tr key={kill.id}>
              <td>{kill.bossName}</td>
              <td>{new Date(kill.killedAt).toLocaleString()}</td>
              <td>{kill.notes ?? ""}</td>
              <td>
                {kill.participants.map((participant) => (
                  <div key={participant.id}>
                    {participant.memberName}
                    {participant.baseWeight !== "1" && ` · 가중치 ${participant.baseWeight}`}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
