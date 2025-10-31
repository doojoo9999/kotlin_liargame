import {FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {buildQuery, request} from "../api";
import {exportElementAsPng} from "../utils/exportImage";
import type {MemberResponse, PayoutDetailResponse} from "../types";
import {MemberStatus, PayoutStatus} from "../types";

const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

const toInputValue = (date: Date) => date.toISOString().slice(0, 10);

export default function PayoutHistoryPage() {
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [memberId, setMemberId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PayoutStatus>("ALL");
  const [fromDate, setFromDate] = useState<string>(toInputValue(thirtyDaysAgo));
  const [toDate, setToDate] = useState<string>(toInputValue(today));
  const [results, setResults] = useState<PayoutDetailResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void request<MemberResponse[]>("/members").then(setMembers);
  }, []);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === MemberStatus.ACTIVE),
    [members],
  );
  const selectedMember = useMemo(
    () => activeMembers.find((member) => String(member.id) === memberId) ?? null,
    [activeMembers, memberId]
  );

  const totals = useMemo(() => {
    return results.reduce(
      (acc, payout) => {
        acc.all += payout.amount;
        if (payout.status === PayoutStatus.PAID) acc.paid += payout.amount;
        else acc.pending += payout.amount;
        return acc;
      },
      {all: 0, paid: 0, pending: 0},
    );
  }, [results]);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!memberId) {
      setError("혈원을 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      const query = buildQuery({
        memberId: Number(memberId),
        status: statusFilter === "ALL" ? undefined : statusFilter,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit: 200,
      });
      const response = await request<PayoutDetailResponse[]>(`/payouts${query}`);
      setResults(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExportImage = async () => {
    if (!resultsRef.current || results.length === 0) return;
    setExporting(true);
    try {
      const baseName = selectedMember?.name ?? "payouts";
      await exportElementAsPng(resultsRef.current, `${baseName}-payouts.png`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="card">
      <h2>분배 확인</h2>
      <p style={{color: "#94a3b8"}}>
        혈원이 받은 분배 내역을 멤버별·기간별로 조회합니다. 혈원에게 공유할 때 이 화면을 그대로 보여주거나 스크린샷으로 전달하세요.
      </p>

      <form onSubmit={handleSearch} className="grid grid-cols-4" style={{gap: "1rem", alignItems: "end"}}>
        <label>
          혈원
          <select value={memberId} onChange={(event) => setMemberId(event.target.value)}>
            <option value="">혈원을 선택하세요…</option>
            {activeMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          상태
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | PayoutStatus)}>
            <option value="ALL">전체</option>
            <option value={PayoutStatus.PENDING}>대기</option>
            <option value={PayoutStatus.PAID}>완료</option>
          </select>
        </label>

        <label>
          시작일
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>

        <label>
          종료일
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>

        <button type="submit" style={{gridColumn: "span 4"}} disabled={loading}>
          {loading ? "조회 중…" : "조회"}
        </button>
      </form>

      {error && <p style={{color: "#fda4af", marginTop: "1rem"}}>{error}</p>}

      {results.length > 0 && (
        <div style={{display: "flex", justifyContent: "flex-end", marginTop: "1.5rem"}}>
          <button type="button" className="ghost" onClick={() => void handleExportImage()} disabled={exporting}>
            {exporting ? "이미지 생성 중…" : "이미지로 저장"}
          </button>
        </div>
      )}

      <div ref={resultsRef}>
        {results.length > 0 && (
          <div className="card" style={{marginTop: "1.5rem", background: "rgba(15,23,42,0.35)"}}>
            <p style={{margin: 0, color: "#94a3b8"}}>조회 결과</p>
            <div style={{display: "flex", gap: "2rem", marginTop: "0.5rem"}}>
              <div>
                <p style={{margin: 0, color: "#94a3b8"}}>총액</p>
                <p style={{margin: 0, fontSize: "1.5rem"}}>{totals.all.toLocaleString()} 원</p>
              </div>
              <div>
                <p style={{margin: 0, color: "#94a3b8"}}>지급 완료</p>
                <p style={{margin: 0, fontSize: "1.25rem"}}>{totals.paid.toLocaleString()} 원</p>
              </div>
              <div>
                <p style={{margin: 0, color: "#94a3b8"}}>지급 대기</p>
                <p style={{margin: 0, fontSize: "1.25rem"}}>{totals.pending.toLocaleString()} 원</p>
              </div>
            </div>
          </div>
        )}

        <table style={{marginTop: "1.5rem"}}>
          <thead>
            <tr>
              <th>판매</th>
              <th>보스</th>
              <th>상태</th>
              <th>지급 기록</th>
              <th>금액</th>
              <th>메모</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={6} style={{textAlign: "center", color: "#94a3b8"}}>
                  {memberId ? "조회 결과가 없습니다." : "혈원을 선택하고 조회를 눌러주세요."}
                </td>
              </tr>
            ) : (
              results.map((payout) => (
                <tr key={payout.id}>
                  <td>
                    <div style={{fontWeight: 600}}>
                      #{payout.saleId} · {payout.itemName}
                    </div>
                    <div style={{color: "#94a3b8"}}>{new Date(payout.soldAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    {payout.bossName ?? "—"}
                    {payout.bossKilledAt && (
                      <div style={{color: "#94a3b8"}}>{new Date(payout.bossKilledAt).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${payout.status === PayoutStatus.PAID ? "success" : "warning"}`}>
                      {payout.status === PayoutStatus.PAID ? "완료" : "대기"}
                    </span>
                  </td>
                  <td>
                    {payout.paidAt ? (
                      <>
                        <div>{new Date(payout.paidAt).toLocaleDateString()}</div>
                        <div style={{color: "#94a3b8"}}>{new Date(payout.paidAt).toLocaleTimeString()}</div>
                      </>
                    ) : (
                      <span style={{color: "#94a3b8"}}>미지급</span>
                    )}
                  </td>
                  <td style={{fontWeight: 600}}>{payout.amount.toLocaleString()} 원</td>
                  <td>{payout.saleMemo ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
