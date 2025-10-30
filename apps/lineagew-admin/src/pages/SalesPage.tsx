import {type CSSProperties, FormEvent, useEffect, useMemo, useState} from "react";
import {buildQuery, request} from "../api";
import type {
  BossKillResponse,
  ItemDetailResponse,
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
  PayoutStatus,
} from "../types";
import {
  getBonusCurveLabel,
  getBonusWindowLabel,
  getDistributionModeLabel,
  getItemGradeLabel,
  getItemStatusLabel,
  getRemainderPolicyLabel,
  getRoundingStrategyLabel,
  getSaleStateLabel,
} from "../utils/labels";

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
  const [itemKeyword, setItemKeyword] = useState("");
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
  const [participantLoading, setParticipantLoading] = useState(false);
  const [itemModalSale, setItemModalSale] = useState<SaleResponse | null>(null);
  const [itemModalDetail, setItemModalDetail] = useState<ItemDetailResponse | null>(null);
  const [itemModalError, setItemModalError] = useState<string | null>(null);
  const [itemModalLoading, setItemModalLoading] = useState(false);
  const [itemDetailCache, setItemDetailCache] = useState<Record<number, ItemDetailResponse>>({});

  const fieldStyle: CSSProperties = {display: "grid", gap: "0.35rem"};
  const hintStyle: CSSProperties = {color: "#94a3b8", fontSize: "0.8rem", margin: 0};
  const linkButtonStyle: CSSProperties = {
    background: "none",
    border: "none",
    color: "#60a5fa",
    cursor: "pointer",
    padding: 0,
    font: "inherit",
    textDecoration: "underline",
  };

  const draftSales = useMemo(
    () => sales.filter((sale) => sale.state === SaleState.DRAFT),
    [sales],
  );

  const filteredItems = useMemo(() => {
    const keyword = itemKeyword.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [items, itemKeyword]);

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

  const handleLoadParticipants = async () => {
    if (!finalizeSaleId) {
      setError("정산할 판매를 먼저 선택하세요.");
      return;
    }
    const sale = draftSales.find((draft) => String(draft.id) === finalizeSaleId);
    if (!sale) {
      setError("선택한 판매를 찾을 수 없습니다.");
      return;
    }
    setParticipantLoading(true);
    setError(null);
    try {
      const item = await request<ItemDetailResponse>(`/items/${sale.itemId}`);
      if (!item.sourceBossKillId) {
        setError("이 아이템에는 연결된 보스킬이 없습니다.");
        return;
      }
      const bossKill = await request<BossKillResponse>(`/boss-kills/${item.sourceBossKillId}`);
      if (bossKill.participants.length === 0) {
        setError("보스킬 참여자 정보가 없습니다.");
        return;
      }
      setItemDetailCache((prev) => ({...prev, [item.id]: item}));
      setParticipants(
        bossKill.participants.map((participant) => ({
          memberId: participant.memberId,
          baseWeight: participant.baseWeight ?? "1",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setParticipantLoading(false);
    }
  };

  const openItemModal = async (sale: SaleResponse) => {
    setItemModalSale(sale);
    setItemModalError(null);
    const cached = itemDetailCache[sale.itemId];
    if (cached) {
      setItemModalDetail(cached);
      setItemModalLoading(false);
      return;
    }
    setItemModalDetail(null);
    setItemModalLoading(true);
    try {
      const detail = await request<ItemDetailResponse>(`/items/${sale.itemId}`);
      setItemDetailCache((prev) => ({...prev, [detail.id]: detail}));
      setItemModalDetail(detail);
    } catch (err) {
      setItemModalError(err instanceof Error ? err.message : String(err));
    } finally {
      setItemModalLoading(false);
    }
  };

  const closeItemModal = () => {
    setItemModalSale(null);
    setItemModalDetail(null);
    setItemModalError(null);
    setItemModalLoading(false);
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
          <input
            placeholder="아이템 검색"
            value={itemKeyword}
            onChange={(event) => setItemKeyword(event.target.value)}
          />
          <select
            value={saleForm.itemId}
            onChange={(event) => setSaleForm({...saleForm, itemId: event.target.value})}
            required
          >
            <option value="">아이템을 선택하세요…</option>
            {filteredItems.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} · {item.name} ({getItemGradeLabel(item.grade)})
              </option>
            ))}
          </select>
          {itemKeyword.trim() && filteredItems.length === 0 && (
            <p style={{color: "#94a3b8", marginTop: "-0.5rem"}}>검색된 아이템이 없습니다.</p>
          )}
          <label style={fieldStyle}>
            <span>판매 시각</span>
            <input
              type="datetime-local"
              value={saleForm.soldAt}
              onChange={(event) => setSaleForm({...saleForm, soldAt: event.target.value})}
            />
            <small style={hintStyle}>기본값은 폼을 여는 순간의 시각입니다.</small>
          </label>
          <label style={fieldStyle}>
            <span>구매자 (선택)</span>
            <input
              placeholder="닉네임 또는 비고"
              value={saleForm.buyer}
              onChange={(event) => setSaleForm({...saleForm, buyer: event.target.value})}
            />
          </label>
          <label style={fieldStyle}>
            <span>총 판매 금액 (원)</span>
            <input
              type="number"
              min="0"
              placeholder="예: 1500000"
              value={saleForm.grossAmount}
              onChange={(event) => setSaleForm({...saleForm, grossAmount: Number(event.target.value)})}
              required
            />
            <small style={hintStyle}>수수료·세금을 공제하기 전 금액을 입력하세요.</small>
          </label>
          <div className="grid grid-cols-2">
            <label style={fieldStyle}>
              <span>수수료 (원)</span>
              <input
                type="number"
                min="0"
                placeholder="없으면 0"
                value={saleForm.feeAmount}
                onChange={(event) => setSaleForm({...saleForm, feeAmount: Number(event.target.value)})}
              />
              <small style={hintStyle}>거래소·중개 수수료 등을 입력합니다.</small>
            </label>
            <label style={fieldStyle}>
              <span>세금 (원)</span>
              <input
                type="number"
                min="0"
                placeholder="없으면 0"
                value={saleForm.taxAmount}
                onChange={(event) => setSaleForm({...saleForm, taxAmount: Number(event.target.value)})}
              />
              <small style={hintStyle}>세금이 없다면 0으로 두세요.</small>
            </label>
          </div>
          <p style={{...hintStyle, marginTop: "-0.25rem"}}>실제 정산 금액은 총액 - 수수료 - 세금으로 자동 계산됩니다.</p>
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
                #{sale.id} · {sale.itemName} · 정산액 {sale.netAmount.toLocaleString()} 원
              </option>
            ))}
          </select>
          <div style={{display: "flex", justifyContent: "flex-end", marginTop: "0.5rem"}}>
            <button
              type="button"
              className="ghost"
              onClick={() => void handleLoadParticipants()}
              disabled={!finalizeSaleId || participantLoading}
            >
              {participantLoading ? "참여자 불러오는 중…" : "보스킬 참여자 불러오기"}
            </button>
          </div>
          <p style={{color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.25rem"}}>
            보스킬에 기록된 참여자를 불러온 뒤 필요 시 가중치를 조정하세요.
          </p>

          <div className="grid grid-cols-2">
            <label>
              분배 방식
              <select value={distributionMode} onChange={(event) => setDistributionMode(event.target.value as DistributionMode)}>
                {Object.values(DistributionMode).map((mode) => (
                  <option key={mode} value={mode}>
                    {getDistributionModeLabel(mode)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              라운딩
              <select value={rounding} onChange={(event) => setRounding(event.target.value as RoundingStrategy)}>
                {Object.values(RoundingStrategy).map((value) => (
                  <option key={value} value={value}>
                    {getRoundingStrategyLabel(value)}
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
                  {getRemainderPolicyLabel(value)}
                </option>
              ))}
            </select>
          </label>

          {remainderPolicy === RemainderPolicy.MANUAL_MEMBER && (
            <label>
              잔액 수동 배분 대상
              <select value={manualMember} onChange={(event) => setManualMember(event.target.value)}>
                <option value="">혈원을 선택하세요…</option>
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
                        {getBonusWindowLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  곡선 형태
                  <select value={bonusCurve} onChange={(event) => setBonusCurve(event.target.value as BonusCurveType)}>
                    {Object.values(BonusCurveType).map((value) => (
                      <option key={value} value={value}>
                        {getBonusCurveLabel(value)}
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
              <td>
                <button type="button" style={linkButtonStyle} onClick={() => void openItemModal(sale)}>
                  {sale.itemName}
                </button>
                <div style={{color: "#94a3b8", fontSize: "0.75rem"}}>#{sale.itemId}</div>
              </td>
              <td>{new Date(sale.soldAt).toLocaleString()}</td>
              <td>{sale.netAmount.toLocaleString()}</td>
              <td>{getSaleStateLabel(sale.state)}</td>
              <td>
                {sale.payouts.length === 0 ? (
                  <span className="badge">대기</span>
                ) : (
                  sale.payouts.map((payout: PayoutResponse) => (
                    <div key={payout.id} className="payout-line">
                      <span>
                        {members.find((m) => m.id === payout.memberId)?.name ?? payout.memberId}
                        {": "}
                        {payout.amount.toLocaleString()} 원
                      </span>
                      <span
                        className={`badge ${payout.status === PayoutStatus.PAID ? "success" : "warning"}`}
                        title={payout.paidAt ? `지급 ${new Date(payout.paidAt).toLocaleString()}` : "미지급"}
                      >
                        {payout.status === PayoutStatus.PAID ? "완료" : "대기"}
                      </span>
                    </div>
                  ))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {itemModalSale && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card" style={{maxWidth: "640px"}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem"}}>
              <h3 style={{margin: 0}}>{itemModalSale.itemName}</h3>
              <button type="button" className="button button--ghost" onClick={closeItemModal}>
                닫기
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-line">
                <strong>판매 정보</strong>
                <div>판매 ID: #{itemModalSale.id}</div>
                <div>정산 금액: {itemModalSale.netAmount.toLocaleString()} 원</div>
                <div>판매 시각: {formatDateTime(itemModalSale.soldAt)}</div>
              </div>

              {itemModalLoading && <p>아이템 정보를 불러오는 중입니다…</p>}
              {!itemModalLoading && itemModalError && <p style={{color: "#fda4af"}}>{itemModalError}</p>}

              {!itemModalLoading && !itemModalError && itemModalDetail && (
                <>
                  <div className="modal-line">
                    <strong>아이템</strong>
                    <div>등급: {getItemGradeLabel(itemModalDetail.grade)}</div>
                    <div>상태: {getItemStatusLabel(itemModalDetail.status)}</div>
                    <div>획득일: {formatDate(itemModalDetail.acquiredAt)}</div>
                    <div>태그: {itemModalDetail.tags.length ? itemModalDetail.tags.join(", ") : "—"}</div>
                    <div>메모: {itemModalDetail.note?.trim() || "—"}</div>
                  </div>

                  <div className="modal-line">
                    <strong>획득 정보</strong>
                    {itemModalDetail.sourceBossKill ? (
                      <>
                        <div>보스: {itemModalDetail.sourceBossKill.bossName}</div>
                        <div>처치 시각: {formatDateTime(itemModalDetail.sourceBossKill.killedAt)}</div>
                        {itemModalDetail.sourceBossKill.notes?.trim() && (
                          <div>비고: {itemModalDetail.sourceBossKill.notes}</div>
                        )}
                        <div style={{marginTop: "0.5rem"}}>
                          <strong>참여자</strong>
                          {itemModalDetail.sourceBossKill.participants.length > 0 ? (
                            <ul style={{margin: "0.5rem 0", paddingLeft: "1.25rem"}}>
                              {itemModalDetail.sourceBossKill.participants.map((participant) => (
                                <li key={participant.id}>
                                  {participant.memberName} · 가중치 {participant.baseWeight}
                                  {participant.attendance ? "" : " (불참)"}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{margin: 0}}>참여자 정보가 없습니다.</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <p style={{margin: 0}}>연결된 보스킬 정보가 없습니다.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}
