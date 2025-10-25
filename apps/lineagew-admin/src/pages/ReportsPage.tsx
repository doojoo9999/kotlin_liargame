import {FormEvent, useEffect, useState} from "react";
import {buildQuery, request} from "../api";
import type {DailySettlementReport, ParticipationReport, MemberResponse} from "../types";
import {BonusWindow} from "../types";

export default function ReportsPage() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [window, setWindow] = useState<BonusWindow>(BonusWindow.WEEK);
  const [daily, setDaily] = useState<DailySettlementReport | null>(null);
  const [participation, setParticipation] = useState<ParticipationReport | null>(null);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [dailyData, participationData, memberData] = await Promise.all([
        request<DailySettlementReport>(`/reports/daily-settlement${buildQuery({from, to})}`),
        request<ParticipationReport>(`/reports/participation${buildQuery({from, to, window})}`),
        request<MemberResponse[]>("/members"),
      ]);
      setDaily(dailyData);
      setParticipation(participationData);
      setMembers(memberData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void load();
  };

  return (
    <section className="card">
      <h2>리포트</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        일정산 피벗과 참여도 히스토리를 통해 정산 오류를 조기에 발견하세요.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-2" style={{marginBottom: "1.5rem"}}>
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <select value={window} onChange={(event) => setWindow(event.target.value as BonusWindow)}>
          {Object.values(BonusWindow).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button type="submit">조회</button>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

      {daily && (
        <div className="card" style={{background: "rgba(15,23,42,0.4)"}}>
          <h3 style={{marginTop: 0}}>일별 정산 매트릭스</h3>
          <table>
            <thead>
              <tr>
                <th>일자</th>
                {Object.keys(daily.columnTotals).map((memberId) => (
                  <th key={memberId}>
                    {members.find((m) => String(m.id) === memberId)?.name ?? `Member #${memberId}`}
                  </th>
                ))}
                <th>합계</th>
              </tr>
            </thead>
            <tbody>
              {daily.rows.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  {Object.keys(daily.columnTotals).map((memberId) => {
                    const cell = row.payouts.find((payout) => String(payout.memberId) === memberId);
                    return <td key={memberId}>{cell?.amount ?? 0}</td>;
                  })}
                  <td>{row.rowTotal}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>총합</th>
                {Object.entries(daily.columnTotals).map(([memberId, total]) => (
                  <th key={memberId}>{total}</th>
                ))}
                <th>{daily.grandTotal}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {participation && (
        <div className="card" style={{background: "rgba(15,23,42,0.4)"}}>
          <h3 style={{marginTop: 0}}>참여도 윈도우</h3>
          <table>
            <thead>
              <tr>
                <th>혈원</th>
                <th>기간</th>
                <th>참여 점수</th>
                <th>보정 계수</th>
              </tr>
            </thead>
            <tbody>
              {participation.summaries.map((summary, index) => (
                <tr key={index}>
                  <td>{summary.memberName}</td>
                  <td>
                    {summary.windowStart} → {summary.windowEnd}
                  </td>
                  <td>{summary.participationCount.toFixed(2)}</td>
                  <td>{summary.bonusMultiplier ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
