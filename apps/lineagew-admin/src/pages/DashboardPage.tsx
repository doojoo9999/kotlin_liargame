import {useEffect, useState} from "react";
import {buildQuery, request} from "../api";
import type {
  ClanFundResponse,
  DailySettlementReport,
  MemberResponse,
  SaleResponse,
} from "../types";
import {SaleState} from "../types";

export default function DashboardPage() {
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [fund, setFund] = useState<ClanFundResponse | null>(null);
  const [daily, setDaily] = useState<DailySettlementReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [memberData, saleData, fundData, dailyData] = await Promise.all([
          request<MemberResponse[]>("/members"),
          request<SaleResponse[]>("/sales"),
          request<ClanFundResponse>("/clan-fund"),
          request<DailySettlementReport>(
            `/reports/daily-settlement${buildQuery({
              from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
              to: new Date().toISOString().slice(0, 10),
            })}`,
          ),
        ]);
        setMembers(memberData);
        setSales(saleData);
        setFund(fundData);
        setDaily(dailyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    void load();
  }, []);

  const finalizedSales = sales.filter((sale) => sale.state === SaleState.FINALIZED);
  const grossVolume = finalizedSales.reduce((sum, sale) => sum + sale.grossAmount, 0);
  const payoutVolume = finalizedSales.reduce((sum, sale) => sum + sale.payouts.reduce((p, c) => p + c.amount, 0), 0);

  return (
    <section className="grid grid-cols-2">
      <div className="card" style={{background: "rgba(15,23,42,0.45)"}}>
        <h2 style={{marginTop: 0}}>활동 중 혈원</h2>
        <p style={{fontSize: "2rem", margin: 0}}>{members.filter((m) => m.status === "ACTIVE").length}</p>
        <p style={{color: "#94a3b8"}}>총원 {members.length}명</p>
      </div>

      <div className="card" style={{background: "rgba(15,23,42,0.45)"}}>
        <h2 style={{marginTop: 0}}>혈비 잔액</h2>
        <p style={{fontSize: "2rem", margin: 0}}>{fund?.balance.toLocaleString() ?? "—"}</p>
        <p style={{color: "#94a3b8"}}>거래수 {fund?.transactions.length ?? 0}</p>
      </div>

      <div className="card" style={{background: "rgba(15,23,42,0.45)"}}>
        <h2 style={{marginTop: 0}}>정산 총액</h2>
        <p style={{fontSize: "2rem", margin: 0}}>{grossVolume.toLocaleString()} 원</p>
        <p style={{color: "#94a3b8"}}>분배 완료 {payoutVolume.toLocaleString()} 원</p>
      </div>

      <div className="card" style={{background: "rgba(15,23,42,0.45)"}}>
        <h2 style={{marginTop: 0}}>최근 활동</h2>
        {daily ? (
          <ul style={{margin: 0, paddingLeft: "1.2rem"}}>
            {daily.rows.slice(-5).map((row) => (
              <li key={row.date}>
                {row.date}: {row.rowTotal.toLocaleString()} 원
              </li>
            ))}
          </ul>
        ) : (
          <p>데이터 없음</p>
        )}
      </div>

      {error && (
        <div className="card" style={{gridColumn: "span 2", background: "rgba(239,68,68,0.15)"}}>
          <h3 style={{marginTop: 0}}>경고</h3>
          <p>{error}</p>
        </div>
      )}
    </section>
  );
}
