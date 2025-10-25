import {FormEvent, useEffect, useState} from "react";
import {request} from "../api";
import type {ClanFundResponse, MemberResponse, SaleResponse} from "../types";
import {ClanFundTxnType, SaleState} from "../types";

interface FundForm {
  type: ClanFundTxnType;
  amount: number;
  title: string;
  memo: string;
  occurredAt: string;
  relatedSaleId: string;
  actorMemberId: string;
}

const defaultForm: FundForm = {
  type: ClanFundTxnType.INCOME,
  amount: 0,
  title: "",
  memo: "",
  occurredAt: new Date().toISOString().slice(0, 10),
  relatedSaleId: "",
  actorMemberId: "",
};

export default function ClanFundPage() {
  const [fund, setFund] = useState<ClanFundResponse | null>(null);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [form, setForm] = useState<FundForm>(defaultForm);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [fundData, memberData, saleData] = await Promise.all([
        request<ClanFundResponse>("/clan-fund"),
        request<MemberResponse[]>("/members"),
        request<SaleResponse[]>("/sales"),
      ]);
      setFund(fundData);
      setMembers(memberData);
      setSales(saleData.filter((sale) => sale.state === SaleState.FINALIZED));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await request("/clan-fund/transactions", {
        method: "POST",
        body: {
          type: form.type,
          amount: form.amount,
          title: form.title,
          memo: form.memo || null,
          occurredAt: form.occurredAt,
          relatedSaleId: form.relatedSaleId ? Number(form.relatedSaleId) : null,
          actorMemberId: form.actorMemberId ? Number(form.actorMemberId) : null,
        },
      });
      setForm(defaultForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="card">
      <h2>혈비</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        세금, 잔액, 보너스 지급 등 혈비 변동 내역을 남겨 감사 추적을 용이하게 합니다.
      </p>

      {fund && (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(14,165,233,0.35), rgba(99,102,241,0.35))",
          }}
        >
          <h3 style={{marginTop: 0}}>현재 잔액</h3>
          <p style={{fontSize: "2rem", margin: 0}}>{fund.balance.toLocaleString()} 원</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2">
        <label>
          유형
          <select value={form.type} onChange={(event) => setForm({...form, type: event.target.value as ClanFundTxnType})}>
            {Object.values(ClanFundTxnType).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          금액
          <input
            type="number"
            value={form.amount}
            onChange={(event) => setForm({...form, amount: Number(event.target.value)})}
            required
          />
        </label>
        <input
          placeholder="제목"
          value={form.title}
          onChange={(event) => setForm({...form, title: event.target.value})}
          required
        />
        <input
          type="date"
          value={form.occurredAt}
          onChange={(event) => setForm({...form, occurredAt: event.target.value})}
        />
        <textarea
          placeholder="메모"
          value={form.memo}
          onChange={(event) => setForm({...form, memo: event.target.value})}
          style={{gridColumn: "span 2"}}
        />
        <select
          value={form.relatedSaleId}
          onChange={(event) => setForm({...form, relatedSaleId: event.target.value})}
        >
          <option value="">연결된 판매(선택)</option>
          {sales.map((sale) => (
            <option key={sale.id} value={sale.id}>
              판매 #{sale.id} · 정산 {sale.netAmount}
            </option>
          ))}
        </select>
        <select
          value={form.actorMemberId}
          onChange={(event) => setForm({...form, actorMemberId: event.target.value})}
        >
          <option value="">담당 혈원(선택)</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <div>
          <button type="submit">혈비 내역 추가</button>
        </div>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

      {fund && (
        <table style={{marginTop: "2rem"}}>
          <thead>
            <tr>
              <th>일자</th>
              <th>유형</th>
              <th>제목</th>
              <th>금액</th>
              <th>연결 판매</th>
              <th>담당</th>
            </tr>
          </thead>
          <tbody>
            {fund.transactions.map((txn) => (
              <tr key={txn.id}>
                <td>{txn.occurredAt}</td>
                <td>{txn.type}</td>
                <td>{txn.title}</td>
                <td>{txn.amount}</td>
                <td>{txn.relatedSaleId ?? ""}</td>
                <td>{members.find((m) => m.id === txn.actorMemberId)?.name ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
