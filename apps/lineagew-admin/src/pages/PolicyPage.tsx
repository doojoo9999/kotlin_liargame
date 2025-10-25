import {FormEvent, useEffect, useState} from "react";
import {request} from "../api";
import type {GlobalPolicyResponse} from "../types";
import {
  BonusCurveType,
  BonusWindow,
  DecayPolicy,
  RemainderPolicy,
  RoundingStrategy,
} from "../types";

export default function PolicyPage() {
  const [policy, setPolicy] = useState<GlobalPolicyResponse | null>(null);
  const [form, setForm] = useState<GlobalPolicyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await request<GlobalPolicyResponse>("/policy");
      setPolicy(data);
      setForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;
    try {
      const payload = {
        defaultRounding: form.defaultRounding,
        defaultRemainder: form.defaultRemainder,
        defaultBonusWindow: form.defaultBonusWindow,
        defaultBonusCurve: form.defaultBonusCurve,
        bonusBaseMultiplier: Number(form.bonusBaseMultiplier),
        bonusCapMultiplier: Number(form.bonusCapMultiplier),
        penaltyFloorMultiplier: Number(form.penaltyFloorMultiplier),
        decayPolicy: form.decayPolicy,
        decayHalfLifeDays: form.decayHalfLifeDays,
        bonusLinearSlope: Number(form.bonusLinearSlope),
        bonusLinearIntercept: Number(form.bonusLinearIntercept),
      };
      const updated = await request<GlobalPolicyResponse>("/policy", {
        method: "PUT",
        body: payload,
      });
      setPolicy(updated);
      setForm(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!form) {
    return (
      <section className="card">
        <h2>Global Policy</h2>
        <p>Loading…</p>
        {error && <p style={{color: "#fda4af"}}>{error}</p>}
      </section>
    );
  }

  return (
    <section className="card">
      <h2>기본 정책</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        라운딩, 잔액 처리, 참여도 보정 등 정산 기본값을 관리합니다.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-2">
        <label>
          라운딩 방식
          <select
            value={form.defaultRounding}
            onChange={(event) => setForm({...form, defaultRounding: event.target.value as RoundingStrategy})}
          >
            {Object.values(RoundingStrategy).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          잔액 처리
          <select
            value={form.defaultRemainder}
            onChange={(event) => setForm({...form, defaultRemainder: event.target.value as RemainderPolicy})}
          >
            {Object.values(RemainderPolicy).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          보정 윈도우
          <select
            value={form.defaultBonusWindow}
            onChange={(event) => setForm({...form, defaultBonusWindow: event.target.value as BonusWindow})}
          >
            {Object.values(BonusWindow).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          보정 곡선
          <select
            value={form.defaultBonusCurve}
            onChange={(event) => setForm({...form, defaultBonusCurve: event.target.value as BonusCurveType})}
          >
            {Object.values(BonusCurveType).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          기본 승수
          <input
            type="number"
            step="0.01"
            value={form.bonusBaseMultiplier}
            onChange={(event) => setForm({...form, bonusBaseMultiplier: event.target.value})}
          />
        </label>
        <label>
          최대 승수
          <input
            type="number"
            step="0.01"
            value={form.bonusCapMultiplier}
            onChange={(event) => setForm({...form, bonusCapMultiplier: event.target.value})}
          />
        </label>
        <label>
          최소 승수
          <input
            type="number"
            step="0.01"
            value={form.penaltyFloorMultiplier}
            onChange={(event) => setForm({...form, penaltyFloorMultiplier: event.target.value})}
          />
        </label>
        <label>
          감쇠 정책
          <select
            value={form.decayPolicy}
            onChange={(event) => setForm({...form, decayPolicy: event.target.value as DecayPolicy})}
          >
            {Object.values(DecayPolicy).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          반감기(일)
          <input
            type="number"
            value={form.decayHalfLifeDays ?? ""}
            onChange={(event) =>
              setForm({...form, decayHalfLifeDays: event.target.value ? Number(event.target.value) : null})
            }
          />
        </label>
        <label>
          선형 기울기
          <input
            type="number"
            step="0.01"
            value={form.bonusLinearSlope}
            onChange={(event) => setForm({...form, bonusLinearSlope: event.target.value})}
          />
        </label>
        <label>
          선형 절편
          <input
            type="number"
            step="0.01"
            value={form.bonusLinearIntercept}
            onChange={(event) => setForm({...form, bonusLinearIntercept: event.target.value})}
          />
        </label>
        <div>
          <button type="submit">정책 저장</button>
        </div>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}
    </section>
  );
}
