import {FormEvent, useEffect, useState} from "react";
import {ApiError, request} from "../api";
import type {BossResponse} from "../types";

const createFormDefaults = () => ({
  name: "",
  tier: "",
  memo: "",
});

export default function BossesPage() {
  const [bosses, setBosses] = useState<BossResponse[]>([]);
  const [form, setForm] = useState(createFormDefaults);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await request<BossResponse[]>("/bosses");
      setBosses(data);
    } catch (err) {
      setError(formatError(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(createFormDefaults());
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    try {
      setError(null);
      if (editingId) {
        await request<BossResponse>(`/bosses/${editingId}`, {
          method: "PUT",
          body: {
            name: form.name,
            tier: form.tier || null,
            memo: form.memo || null,
          },
        });
      } else {
        await request<BossResponse>("/bosses", {
          method: "POST",
          body: {
            name: form.name,
            tier: form.tier || null,
            memo: form.memo || null,
          },
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleEdit = (boss: BossResponse) => {
    setForm({
      name: boss.name,
      tier: boss.tier ?? "",
      memo: boss.memo ?? "",
    });
    setEditingId(boss.id);
    setError(null);
  };

  const handleDelete = async (boss: BossResponse) => {
    if (!window.confirm(`정말로 '${boss.name}' 보스를 삭제하시겠습니까?`)) {
      return;
    }
    try {
      setError(null);
      await request(`/bosses/${boss.id}`, {method: "DELETE"});
      if (editingId === boss.id) {
        resetForm();
      }
      await load();
    } catch (err) {
      setError(formatError(err));
    }
  };

  const isEditing = editingId !== null;

  return (
    <section className="card">
      <h2>보스 사전</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        자주 잡는 보스를 등록하고 난이도/메모를 저장하세요. 보스킬 입력 시 자동으로 목록이 노출됩니다.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-2">
        <input
          placeholder="보스 이름"
          value={form.name}
          onChange={(event) => setForm({...form, name: event.target.value})}
          required
        />
        <input
          placeholder="티어 / 난이도"
          value={form.tier}
          onChange={(event) => setForm({...form, tier: event.target.value})}
        />
        <textarea
          placeholder="메모"
          value={form.memo}
          onChange={(event) => setForm({...form, memo: event.target.value})}
          rows={3}
          style={{gridColumn: "span 2"}}
        />
        <div>
          <button type="submit">{isEditing ? "보스 수정" : "보스 저장"}</button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="button button--ghost" style={{marginLeft: "0.5rem"}}>
              취소
            </button>
          )}
        </div>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>티어</th>
            <th>메모</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {bosses.map((boss) => (
            <tr key={boss.id}>
              <td>{boss.name}</td>
              <td>{boss.tier ?? ""}</td>
              <td>{boss.memo ?? ""}</td>
              <td>
                <div style={{display: "flex", gap: "0.5rem"}}>
                  <button type="button" onClick={() => handleEdit(boss)}>수정</button>
                  <button type="button" className="button button--danger" onClick={() => handleDelete(boss)}>
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
