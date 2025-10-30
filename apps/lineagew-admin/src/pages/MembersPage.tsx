import {FormEvent, useEffect, useState} from "react";
import {request} from "../api";
import type {MemberResponse} from "../types";
import {MemberRole, MemberStatus} from "../types";

const defaultForm = {
  name: "",
  joinedAt: "",
  role: MemberRole.USER,
  memo: "",
  status: MemberStatus.ACTIVE,
};

export default function MembersPage() {
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);

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

  const resetForm = () => {
    setForm(defaultForm);
    setEditingMemberId(null);
  };

  const formatDate = (value: string | null) => {
    if (!value) return "";
    return value.split("T")[0];
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editingMemberId) {
        await request<MemberResponse>(`/members/${editingMemberId}`, {
          method: "PUT",
          body: {
            name: form.name.trim(),
            joinedAt: form.joinedAt || null,
            role: form.role,
            memo: form.memo || null,
            status: form.status,
          },
        });
      } else {
        await request<MemberResponse>("/members", {
          method: "POST",
          body: {
            name: form.name.trim(),
            joinedAt: form.joinedAt || null,
            role: form.role,
            memo: form.memo || null,
          },
        });
      }
      resetForm();
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleEdit = (member: MemberResponse) => {
    setEditingMemberId(member.id);
    setForm({
      name: member.name,
      joinedAt: formatDate(member.joinedAt),
      role: member.role,
      memo: member.memo ?? "",
      status: member.status,
    });
  };

  const handleDelete = async (member: MemberResponse) => {
    const confirmed = window.confirm(`${member.name} 혈원을 비활성화할까요?`);
    if (!confirmed) return;
    try {
      await request(`/members/${member.id}`, {method: "DELETE"});
      if (editingMemberId === member.id) {
        resetForm();
      }
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const visibleMembers = showInactive ? members : members.filter((member) => member.status === MemberStatus.ACTIVE);

  return (
    <section className="card">
      <h2>혈원 관리</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        혈원 기본 정보를 등록하고, 최근 참여 기록을 확인해 가중치와 정산 참여 자격을 판단하세요.
      </p>

      <div style={{display: "flex", justifyContent: "flex-end", marginBottom: "1rem", gap: "0.5rem"}}>
        <button type="button" className="ghost" onClick={() => setShowInactive((prev) => !prev)}>
          {showInactive ? "활성 혈원만 보기" : "비활성 포함"}
        </button>
      </div>

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
        {editingMemberId && (
          <select
            value={form.status}
            onChange={(event) => setForm({...form, status: event.target.value as MemberStatus})}
          >
            {Object.values(MemberStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}
        <div>
          <button type="submit">{editingMemberId ? "혈원 수정" : "혈원 추가"}</button>
          {editingMemberId && (
            <button type="button" className="ghost" style={{marginLeft: "0.75rem"}} onClick={resetForm}>
              취소
            </button>
          )}
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
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map((member) => (
              <tr key={member.id}>
              <td>{member.name}</td>
              <td>
                <span className="badge">{member.status}</span>
              </td>
              <td>{member.role}</td>
              <td>{member.joinedAt ?? "—"}</td>
              <td>{member.lastActiveAt ?? "—"}</td>
              <td>{member.memo ?? ""}</td>
              <td>
                <div className="table-actions">
                  <button type="button" onClick={() => handleEdit(member)}>
                    수정
                  </button>
                  <button type="button" className="ghost danger" onClick={() => handleDelete(member)}>
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </section>
  );
}
