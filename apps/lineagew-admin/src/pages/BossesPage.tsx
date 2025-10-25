import {FormEvent, useEffect, useState} from "react";
import {request} from "../api";
import type {BossResponse} from "../types";

const formDefaults = {
  name: "",
  tier: "",
  memo: "",
};

export default function BossesPage() {
  const [bosses, setBosses] = useState<BossResponse[]>([]);
  const [form, setForm] = useState(formDefaults);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await request<BossResponse[]>("/bosses");
      setBosses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    try {
      await request<BossResponse>("/bosses", {
        method: "POST",
        body: {
          name: form.name,
          tier: form.tier || null,
          memo: form.memo || null,
        },
      });
      setForm(formDefaults);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

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
          <button type="submit">보스 저장</button>
        </div>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>티어</th>
            <th>메모</th>
          </tr>
        </thead>
        <tbody>
          {bosses.map((boss) => (
            <tr key={boss.id}>
              <td>{boss.name}</td>
              <td>{boss.tier ?? ""}</td>
              <td>{boss.memo ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
