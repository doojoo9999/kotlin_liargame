import {FormEvent, useEffect, useState} from "react";
import {buildQuery, request} from "../api";
import type {BossKillResponse, BossResponse, MemberResponse} from "../types";

interface ParticipantFormRow {
  memberId: number | "";
  baseWeight: string;
  attendance: boolean;
}

const createEmptyRow = (): ParticipantFormRow => ({memberId: "", baseWeight: "1", attendance: true});

export default function BossKillsPage() {
  const [bosses, setBosses] = useState<BossResponse[]>([]);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [kills, setKills] = useState<BossKillResponse[]>([]);
  const [bossId, setBossId] = useState<number | "">("");
  const [killedAt, setKilledAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [participants, setParticipants] = useState<ParticipantFormRow[]>([createEmptyRow(), createEmptyRow()]);
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
    if (!bossId || participants.every((row) => !row.memberId)) return;
    try {
      await request<BossKillResponse>("/boss-kills", {
        method: "POST",
        body: {
          bossId,
          killedAt: new Date(killedAt).toISOString(),
          notes: notes || null,
          participants: participants
            .filter((row) => row.memberId !== "")
            .map((row) => ({
              memberId: Number(row.memberId),
              baseWeight: row.baseWeight ? Number(row.baseWeight) : 1,
              attendance: row.attendance,
            })),
        },
      });
      setBossId("");
      setKilledAt(new Date().toISOString().slice(0, 16));
      setNotes("");
      setParticipants([createEmptyRow(), createEmptyRow()]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const updateParticipant = (index: number, patch: Partial<ParticipantFormRow>) => {
    setParticipants((rows) => rows.map((row, i) => (i === index ? {...row, ...patch} : row)));
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
          <h3 style={{marginTop: 0}}>참여자</h3>
          {participants.map((row, index) => (
            <div key={index} className="grid grid-cols-2" style={{marginBottom: "0.75rem"}}>
                <select
                  value={row.memberId}
                onChange={(event) =>
                  updateParticipant(index, {
                    memberId: event.target.value ? Number(event.target.value) : "",
                  })
                }
              >
                  <option value="">혈원을 선택하세요…</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.1"
                value={row.baseWeight}
                onChange={(event) => updateParticipant(index, {baseWeight: event.target.value})}
              />
              <label style={{display: "flex", alignItems: "center", gap: "0.5rem"}}>
                <input
                  type="checkbox"
                  checked={row.attendance}
                  onChange={(event) => updateParticipant(index, {attendance: event.target.checked})}
                />
                참석 인정
              </label>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={() => setParticipants((rows) => [...rows, createEmptyRow()])}
            >
              + 참여자 추가
            </button>
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
                    {participant.memberName} · 가중치 {participant.baseWeight}
                    {!participant.attendance && <span className="badge">불참</span>}
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
