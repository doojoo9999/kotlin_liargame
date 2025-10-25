import {FormEvent, useEffect, useState} from "react";
import {buildQuery, request} from "../api";
import type {BossKillResponse, ItemResponse} from "../types";
import {ItemGrade, ItemStatus} from "../types";

interface ItemForm {
  name: string;
  grade: ItemGrade;
  acquiredAt: string;
  sourceBossKillId: string;
  status: ItemStatus;
  note: string;
  tags: string;
}

const formDefaults: ItemForm = {
  name: "",
  grade: ItemGrade.RARE,
  acquiredAt: "",
  sourceBossKillId: "",
  status: ItemStatus.IN_STOCK,
  note: "",
  tags: "",
};

export default function ItemsPage() {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [recentKills, setRecentKills] = useState<BossKillResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "">("");
  const [form, setForm] = useState<ItemForm>(formDefaults);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async (status?: ItemStatus | "") => {
    try {
      const query = status ? buildQuery({status}) : "";
      const data = await request<ItemResponse[]>(`/items${query}`);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void loadItems();
    void request<BossKillResponse[]>(`/boss-kills${buildQuery({limit: 10})}`).then(setRecentKills);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    try {
      await request<ItemResponse>("/items", {
        method: "POST",
        body: {
          name: form.name,
          grade: form.grade,
          acquiredAt: form.acquiredAt || null,
          sourceBossKillId: form.sourceBossKillId ? Number(form.sourceBossKillId) : null,
          status: form.status,
          note: form.note || null,
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
      });
      setForm(formDefaults);
      await loadItems(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="card">
      <h2>인벤토리</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        드랍 시점부터 판매 완료까지 아이템 상태를 추적하고 태그로 검색 용어를 맞춰 주세요.
      </p>

      <div style={{display: "flex", gap: "1rem", marginBottom: "1.5rem"}}>
        <label>
          상태 필터
          <select
            value={statusFilter}
            onChange={async (event) => {
              const value = event.target.value as ItemStatus | "";
              setStatusFilter(value);
              await loadItems(value);
            }}
          >
            <option value="">전체</option>
            {Object.values(ItemStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="grid">
        <input
          placeholder="아이템 이름"
          value={form.name}
          onChange={(event) => setForm({...form, name: event.target.value})}
          required
        />
        <div className="grid grid-cols-2">
          <select
            value={form.grade}
            onChange={(event) => setForm({...form, grade: event.target.value as ItemGrade})}
          >
            {Object.values(ItemGrade).map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(event) => setForm({...form, status: event.target.value as ItemStatus})}
          >
            {Object.values(ItemStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <input
          type="date"
          value={form.acquiredAt}
          onChange={(event) => setForm({...form, acquiredAt: event.target.value})}
        />
        <select
          value={form.sourceBossKillId}
          onChange={(event) => setForm({...form, sourceBossKillId: event.target.value})}
        >
          <option value="">연결할 보스킬 (선택)</option>
          {recentKills.map((kill) => (
            <option key={kill.id} value={kill.id}>
              #{kill.id} · {kill.bossName} · {new Date(kill.killedAt).toLocaleString()}
            </option>
          ))}
        </select>
        <textarea
          placeholder="태그(쉼표로 구분)"
          value={form.tags}
          onChange={(event) => setForm({...form, tags: event.target.value})}
        />
        <textarea
          placeholder="메모"
          value={form.note}
          onChange={(event) => setForm({...form, note: event.target.value})}
        />
        <button type="submit">아이템 저장</button>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>등급</th>
            <th>상태</th>
            <th>획득일</th>
            <th>보스킬</th>
            <th>태그</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.grade}</td>
              <td>{item.status}</td>
              <td>{item.acquiredAt ?? ""}</td>
              <td>{item.sourceBossKillId ?? ""}</td>
              <td>{item.tags.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
