import {FormEvent, useEffect, useMemo, useState} from "react";
import {buildQuery, request} from "../api";
import type {BossKillResponse, BossResponse, MemberResponse} from "../types";

interface ParticipantSelection {
  selected: boolean;
  baseWeight: string;
}

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
    try {
      await request<BossKillResponse>("/boss-kills", {
        method: "POST",
        body: {
          bossId,
          killedAt: new Date(killedAt).toISOString(),
          notes: notes || null,
          participants: payloadParticipants,
        },
      });
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
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const filteredMembers = useMemo(() => {
    const keyword = memberFilter.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter((member) => member.name.toLowerCase().includes(keyword));
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

        <button type="submit">보스킬 등록</button>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

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
