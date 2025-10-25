import {FormEvent, useEffect, useState} from "react";
import {request} from "../api";
import type {MemberResponse} from "../types";
import {MemberRole} from "../types";

const defaultForm = {
  name: "",
  joinedAt: "",
  role: MemberRole.USER,
  memo: "",
};

export default function MembersPage() {
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<MemberResponse[]>("/members");
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    try {
      await request<MemberResponse>("/members", {
        method: "POST",
        body: {
          name: form.name,
          joinedAt: form.joinedAt || null,
          role: form.role,
          memo: form.memo || null,
        },
      });
      setForm(defaultForm);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="card">
      <h2>혈원 관리</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        혈원 기본 정보를 등록하고, 최근 참여 기록을 확인해 가중치와 정산 참여 자격을 판단하세요.
      </p>

      <form onSubmit={handleSubmit} className="grid">
        <input
          placeholder="혈원 이름"
          value={form.name}
          onChange={(event) => setForm({...form, name: event.target.value})}
          required
        />
        <div className="grid grid-cols-2">
          <input
            type="date"
            value={form.joinedAt}
            onChange={(event) => setForm({...form, joinedAt: event.target.value})}
            placeholder="가입일"
          />
          <select
            value={form.role}
            onChange={(event) => setForm({...form, role: event.target.value as MemberRole})}
          >
            {Object.values(MemberRole).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="메모"
          value={form.memo}
          onChange={(event) => setForm({...form, memo: event.target.value})}
          rows={3}
        />
        <div>
          <button type="submit">혈원 추가</button>
        </div>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

      {loading ? (
        <p>혈원 목록을 불러오는 중…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>상태</th>
              <th>권한</th>
              <th>가입일</th>
              <th>최근 활동</th>
              <th>메모</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>
                  <span className="badge">{member.status}</span>
                </td>
                <td>{member.role}</td>
                <td>{member.joinedAt ?? "—"}</td>
                <td>{member.lastActiveAt ?? "—"}</td>
                <td>{member.memo ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
