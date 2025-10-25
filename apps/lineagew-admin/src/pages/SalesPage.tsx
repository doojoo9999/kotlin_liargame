import {FormEvent, useEffect, useMemo, useState} from "react";
import {buildQuery, request} from "../api";
import type {
  ItemResponse,
  MemberResponse,
  PayoutResponse,
  SaleResponse,
} from "../types";
import {
  BonusCurveType,
  BonusWindow,
  DistributionMode,
  ItemStatus,
  RemainderPolicy,
  RoundingStrategy,
  SaleState,
} from "../types";

interface SaleForm {
  itemId: string;
  soldAt: string;
  buyer: string;
  grossAmount: number;
  feeAmount: number;
  taxAmount: number;
  memo: string;
}

interface ParticipantLine {
  memberId: number | "";
  baseWeight: string;
}

const defaultSaleForm: SaleForm = {
  itemId: "",
  soldAt: new Date().toISOString().slice(0, 16),
  buyer: "",
  grossAmount: 0,
  feeAmount: 0,
  taxAmount: 0,
  memo: "",
};

const newParticipant = (): ParticipantLine => ({memberId: "", baseWeight: "1"});

export default function SalesPage() {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [saleForm, setSaleForm] = useState<SaleForm>(defaultSaleForm);
  const [finalizeSaleId, setFinalizeSaleId] = useState<string>("");
  const [distributionMode, setDistributionMode] = useState<DistributionMode>(DistributionMode.EQUAL_SPLIT);
  const [rounding, setRounding] = useState<RoundingStrategy>(RoundingStrategy.ROUND);
  const [remainderPolicy, setRemainderPolicy] = useState<RemainderPolicy>(RemainderPolicy.TO_CLAN_FUND);
  const [manualMember, setManualMember] = useState<string>("");
  const [bonusEnabled, setBonusEnabled] = useState(true);
  const [bonusWindow, setBonusWindow] = useState<BonusWindow>(BonusWindow.WEEK);
  const [bonusCurve, setBonusCurve] = useState<BonusCurveType>(BonusCurveType.LINEAR);
  const [bonusLinearSlope, setBonusLinearSlope] = useState("0.05");
  const [bonusLinearIntercept, setBonusLinearIntercept] = useState("0.90");
  const [participants, setParticipants] = useState<ParticipantLine[]>([newParticipant(), newParticipant()]);
  const [error, setError] = useState<string | null>(null);

  const draftSales = useMemo(
    () => sales.filter((sale) => sale.state === SaleState.DRAFT),
    [sales],
  );

  const load = async () => {
    try {
      const [itemData, memberData, saleData] = await Promise.all([
        request<ItemResponse[]>(`/items${buildQuery({status: ItemStatus.IN_STOCK})}`).catch(() => []),
        request<MemberResponse[]>("/members"),
        request<SaleResponse[]>("/sales"),
      ]);
      setItems(itemData);
      setMembers(memberData);
      setSales(saleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreateSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!saleForm.itemId) return;
    try {
      const response = await request<SaleResponse>("/sales", {
        method: "POST",
        body: {
          itemId: Number(saleForm.itemId),
          soldAt: new Date(saleForm.soldAt).toISOString(),
          buyer: saleForm.buyer || null,
          grossAmount: saleForm.grossAmount,
          feeAmount: saleForm.feeAmount,
          taxAmount: saleForm.taxAmount,
          memo: saleForm.memo || null,
        },
      });
      setSales((prev) => [response, ...prev]);
      setSaleForm({...defaultSaleForm, soldAt: new Date().toISOString().slice(0, 16)});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFinalize = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!finalizeSaleId) return;
    try {
      const requestBody = {
        rule: {
          mode: distributionMode,
          roundingMode: rounding,
          remainderPolicy,
          manualRemainderMemberId: remainderPolicy === RemainderPolicy.MANUAL_MEMBER && manualMember ? Number(manualMember) : null,
          participationBonusEnabled: bonusEnabled,
          bonusWindow,
          bonusCurve,
          bonusLinearSlope: bonusCurve === BonusCurveType.LINEAR ? Number(bonusLinearSlope) : null,
          bonusLinearIntercept: bonusCurve === BonusCurveType.LINEAR ? Number(bonusLinearIntercept) : null,
        },
        participants: participants
          .filter((row) => row.memberId !== "")
          .map((row) => ({
            memberId: Number(row.memberId),
            baseWeight: Number(row.baseWeight || "1"),
          })),
      };
      const response = await request<SaleResponse>(`/sales/${finalizeSaleId}/finalize`, {
        method: "POST",
        body: requestBody,
      });
      setSales((prev) =>
        prev.map((sale) => (sale.id === response.id ? response : sale)),
      );
      setFinalizeSaleId("");
      setParticipants([newParticipant(), newParticipant()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const updateParticipant = (index: number, patch: Partial<ParticipantLine>) => {
    setParticipants((rows) => rows.map((row, i) => (i === index ? {...row, ...patch} : row)));
  };

  return (
    <section className="card">
      <h2>판매·정산</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        아이템 판매 내역을 등록하고, 혈맹 정산 규칙에 맞춰 분배 엔진을 실행하세요.
      </p>

      <div className="grid grid-cols-2">
        <form onSubmit={handleCreateSale} className="card" style={{background: "rgba(15,23,42,0.45)"}}>
          <h3 style={{marginTop: 0}}>판매 등록</h3>
          <select
            value={saleForm.itemId}
            onChange={(event) => setSaleForm({...saleForm, itemId: event.target.value})}
            required
          >
            <option value="">아이템을 선택하세요…</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} · {item.name} ({item.status})
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={saleForm.soldAt}
            onChange={(event) => setSaleForm({...saleForm, soldAt: event.target.value})}
          />
          <input
            placeholder="구매자"
            value={saleForm.buyer}
            onChange={(event) => setSaleForm({...saleForm, buyer: event.target.value})}
          />
          <input
            type="number"
            placeholder="총액"
            value={saleForm.grossAmount}
            onChange={(event) => setSaleForm({...saleForm, grossAmount: Number(event.target.value)})}
            required
          />
          <div className="grid grid-cols-2">
            <input
              type="number"
              placeholder="수수료"
              value={saleForm.feeAmount}
              onChange={(event) => setSaleForm({...saleForm, feeAmount: Number(event.target.value)})}
            />
            <input
              type="number"
              placeholder="세금"
              value={saleForm.taxAmount}
              onChange={(event) => setSaleForm({...saleForm, taxAmount: Number(event.target.value)})}
            />
          </div>
          <textarea
            placeholder="메모"
            value={saleForm.memo}
            onChange={(event) => setSaleForm({...saleForm, memo: event.target.value})}
          />
          <button type="submit">초안 저장</button>
        </form>

        <form onSubmit={handleFinalize} className="card" style={{background: "rgba(15,23,42,0.45)"}}>
          <h3 style={{marginTop: 0}}>정산 확정</h3>
          <select
            value={finalizeSaleId}
            onChange={(event) => setFinalizeSaleId(event.target.value)}
          >
            <option value="">초안 선택…</option>
            {draftSales.map((sale) => (
              <option key={sale.id} value={sale.id}>
                #{sale.id} · item {sale.itemId} · net {sale.netAmount}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2">
            <label>
              분배 방식
              <select value={distributionMode} onChange={(event) => setDistributionMode(event.target.value as DistributionMode)}>
                {Object.values(DistributionMode).map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
            <label>
              라운딩
              <select value={rounding} onChange={(event) => setRounding(event.target.value as RoundingStrategy)}>
                {Object.values(RoundingStrategy).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            잔액 처리 방식
            <select
              value={remainderPolicy}
              onChange={(event) => setRemainderPolicy(event.target.value as RemainderPolicy)}
            >
              {Object.values(RemainderPolicy).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          {remainderPolicy === RemainderPolicy.MANUAL_MEMBER && (
            <label>
              잔액 수동 배분 대상
              <select value={manualMember} onChange={(event) => setManualMember(event.target.value)}>
                <option value="">Select member…</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label style={{display: "flex", gap: "0.5rem", alignItems: "center"}}>
            <input
              type="checkbox"
              checked={bonusEnabled}
              onChange={(event) => setBonusEnabled(event.target.checked)}
            />
            주간 참여도 보정 사용
          </label>

          {bonusEnabled && (
            <div className="grid">
              <div className="grid grid-cols-2">
                <label>
                  윈도우
                  <select value={bonusWindow} onChange={(event) => setBonusWindow(event.target.value as BonusWindow)}>
                    {Object.values(BonusWindow).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  곡선 형태
                  <select value={bonusCurve} onChange={(event) => setBonusCurve(event.target.value as BonusCurveType)}>
                    {Object.values(BonusCurveType).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {bonusCurve === BonusCurveType.LINEAR && (
                <div className="grid grid-cols-2">
                  <input
                    type="number"
                    step="0.01"
                    value={bonusLinearSlope}
                    onChange={(event) => setBonusLinearSlope(event.target.value)}
                    placeholder="기울기"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={bonusLinearIntercept}
                    onChange={(event) => setBonusLinearIntercept(event.target.value)}
                    placeholder="절편"
                  />
                </div>
              )}
            </div>
          )}

          <div className="card" style={{background: "rgba(15,23,42,0.35)"}}>
            <h4 style={{marginTop: 0}}>참여 혈원</h4>
            {participants.map((row, index) => (
              <div key={index} className="grid grid-cols-2" style={{marginBottom: "0.75rem"}}>
                <select
                  value={row.memberId}
                  onChange={(event) =>
                    updateParticipant(index, {
                      memberId: event.target.value ? Number(event.target.value) : "",
                    })
                  }
                >
                  <option value="">혈원을 선택하세요…</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={row.baseWeight}
                  onChange={(event) => updateParticipant(index, {baseWeight: event.target.value})}
                  placeholder="가중치"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setParticipants((rows) => [...rows, newParticipant()])}
            >
              + 혈원 추가
            </button>
          </div>

          <button type="submit">정산 확정</button>
        </form>
      </div>

      {error && <p style={{color: "#fda4af", marginTop: "1rem"}}>{error}</p>}

      <table style={{marginTop: "2rem"}}>
        <thead>
          <tr>
            <th>ID</th>
            <th>아이템</th>
            <th>판매 시각</th>
            <th>정산액</th>
            <th>상태</th>
            <th>분배 결과</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>#{sale.id}</td>
              <td>{sale.itemId}</td>
              <td>{new Date(sale.soldAt).toLocaleString()}</td>
              <td>{sale.netAmount.toLocaleString()}</td>
              <td>{sale.state}</td>
              <td>
                {sale.payouts.length === 0 ? (
                  <span className="badge">대기</span>
                ) : (
                  sale.payouts.map((payout: PayoutResponse) => (
                    <div key={payout.id}>
                      {members.find((m) => m.id === payout.memberId)?.name ?? payout.memberId}: {payout.amount}
                    </div>
                  ))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
