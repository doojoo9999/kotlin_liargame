import {FormEvent, useEffect, useState} from "react";
import {request} from "../api";
import type {EssenceResponse} from "../types";

interface EssenceForm {
  name: string;
  memo: string;
}

interface EssenceTxnForm {
  essenceId: string;
  deltaQty: number;
  increase: boolean;
  reason: string;
  memo: string;
  occurredAt: string;
}

const defaultTxnForm: EssenceTxnForm = {
  essenceId: "",
  deltaQty: 0,
  increase: true,
  reason: "",
  memo: "",
  occurredAt: new Date().toISOString().slice(0, 10),
};

export default function EssencePage() {
  const [essences, setEssences] = useState<EssenceResponse[]>([]);
  const [form, setForm] = useState<EssenceForm>({name: "", memo: ""});
  const [txnForm, setTxnForm] = useState<EssenceTxnForm>(defaultTxnForm);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await request<EssenceResponse[]>("/essences");
      setEssences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleUpsert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    try {
      await request("/essences", {
        method: "POST",
        body: form,
      });
      setForm({name: "", memo: ""});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleTxn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!txnForm.essenceId) return;
    try {
      await request(`/essences/${txnForm.essenceId}/transactions`, {
        method: "POST",
        body: {
          deltaQty: txnForm.deltaQty,
          increase: txnForm.increase,
          reason: txnForm.reason,
          memo: txnForm.memo || null,
          occurredAt: txnForm.occurredAt,
        },
      });
      setTxnForm(defaultTxnForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="card">
      <h2>정수 재고</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        각종 재료/정수 재고를 기록해 제작 일정과 비용 정산에 활용하세요.
      </p>

      <div className="grid grid-cols-2">
        <form onSubmit={handleUpsert} className="card" style={{background: "rgba(15,23,42,0.45)"}}>
          <h3 style={{marginTop: 0}}>정수 등록/수정</h3>
          <input
            placeholder="정수 이름"
            value={form.name}
            onChange={(event) => setForm({...form, name: event.target.value})}
            required
          />
          <textarea
            placeholder="메모"
            value={form.memo}
            onChange={(event) => setForm({...form, memo: event.target.value})}
          />
          <button type="submit">저장</button>
        </form>

        <form onSubmit={handleTxn} className="card" style={{background: "rgba(15,23,42,0.45)"}}>
          <h3 style={{marginTop: 0}}>입출고 기록</h3>
          <select
            value={txnForm.essenceId}
            onChange={(event) => setTxnForm({...txnForm, essenceId: event.target.value})}
          >
            <option value="">정수를 선택하세요…</option>
            {essences.map((essence) => (
              <option key={essence.id} value={essence.id}>
                {essence.name} (qty {essence.quantity})
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2">
            <input
              type="number"
              placeholder="수량"
              value={txnForm.deltaQty}
              onChange={(event) => setTxnForm({...txnForm, deltaQty: Number(event.target.value)})}
              required
            />
            <label style={{display: "flex", alignItems: "center", gap: "0.5rem"}}>
              <input
                type="checkbox"
                checked={txnForm.increase}
                onChange={(event) => setTxnForm({...txnForm, increase: event.target.checked})}
              />
              입고
            </label>
          </div>
          <input
            placeholder="사유"
            value={txnForm.reason}
            onChange={(event) => setTxnForm({...txnForm, reason: event.target.value})}
            required
          />
          <input
            type="date"
            value={txnForm.occurredAt}
            onChange={(event) => setTxnForm({...txnForm, occurredAt: event.target.value})}
          />
          <textarea
            placeholder="메모"
            value={txnForm.memo}
            onChange={(event) => setTxnForm({...txnForm, memo: event.target.value})}
          />
          <button type="submit">기록 추가</button>
        </form>
      </div>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

      <div className="grid">
        {essences.map((essence) => (
          <div key={essence.id} className="card" style={{background: "rgba(15,23,42,0.4)"}}>
            <h3 style={{marginTop: 0}}>
              {essence.name} <span className="badge">재고 {essence.quantity}</span>
            </h3>
            <p style={{color: "#94a3b8"}}>{essence.memo ?? ""}</p>
            <table>
              <thead>
                <tr>
                  <th>일자</th>
                  <th>변동</th>
                  <th>사유</th>
                  <th>메모</th>
                </tr>
              </thead>
              <tbody>
                {essence.transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td>{txn.occurredAt}</td>
                    <td>{txn.deltaQty}</td>
                    <td>{txn.reason}</td>
                    <td>{txn.memo ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
