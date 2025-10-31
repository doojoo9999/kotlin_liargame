import {useEffect, useMemo, useState} from "react";
import {buildQuery, request} from "../api";
import type {MemberResponse, PayoutDetailResponse} from "../types";
import {MemberStatus, PayoutStatus} from "../types";

interface MemberPayoutGroup {
  memberId: number;
  memberName: string;
  totalAmount: number;
  payouts: PayoutDetailResponse[];
}

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : "—");

export default function DistributionPage() {
  const [pendingPayouts, setPendingPayouts] = useState<PayoutDetailResponse[]>([]);
  const [recentPaid, setRecentPaid] = useState<PayoutDetailResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [members, setMembers] = useState<MemberResponse[]>([]);
  const [selectedPayoutIds, setSelectedPayoutIds] = useState<Set<number>>(new Set());
  const [completionNote, setCompletionNote] = useState("");
  const [completionHandler, setCompletionHandler] = useState<string>("");
  const [detailMemberId, setDetailMemberId] = useState<number | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pending, paid] = await Promise.all([
        request<PayoutDetailResponse[]>(`/payouts${buildQuery({status: PayoutStatus.PENDING})}`),
        request<PayoutDetailResponse[]>(`/payouts${buildQuery({status: PayoutStatus.PAID, limit: 25})}`),
      ]);
      setPendingPayouts(pending);
      setRecentPaid(paid);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    void request<MemberResponse[]>("/members").then(setMembers);
  }, []);

  useEffect(() => {
    setSelectedPayoutIds((prev) => {
      if (prev.size === 0) return prev;
      const currentIds = new Set(pendingPayouts.map((payout) => payout.id));
      const next = new Set<number>();
      prev.forEach((id) => {
        if (currentIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [pendingPayouts]);

  const grouped = useMemo<MemberPayoutGroup[]>(() => {
    const map = new Map<number, MemberPayoutGroup>();
    pendingPayouts.forEach((payout) => {
      const existing = map.get(payout.memberId);
      if (existing) {
        existing.totalAmount += payout.amount;
        existing.payouts.push(payout);
      } else {
        map.set(payout.memberId, {
          memberId: payout.memberId,
          memberName: payout.memberName,
          totalAmount: payout.amount,
          payouts: [payout],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount || a.memberName.localeCompare(b.memberName));
  }, [pendingPayouts]);

  const totalPending = grouped.reduce((sum, group) => sum + group.totalAmount, 0);
  const activeMembers = useMemo(() => members.filter((member) => member.status === MemberStatus.ACTIVE), [members]);
  const detailGroup = useMemo(
    () => grouped.find((group) => group.memberId === detailMemberId) ?? null,
    [grouped, detailMemberId]
  );

  const toggleSelection = (payoutId: number, checked: boolean) => {
    setSelectedPayoutIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(payoutId);
      else next.delete(payoutId);
      return next;
    });
  };

  const completePayout = async (
    payoutId: number,
    options?: {note?: string; paidByMemberId?: number | null}
  ) => {
    const resolvedNote = options?.note ?? (completionNote.trim() || undefined);
    const resolvedHandlerId =
      options?.paidByMemberId !== undefined
        ? options.paidByMemberId
        : completionHandler
          ? Number(completionHandler)
          : undefined;

    const updated = await request<PayoutDetailResponse>(`/payouts/${payoutId}/status`, {
      method: "PUT",
      body: {
        status: PayoutStatus.PAID,
        note: resolvedNote ?? null,
        paidByMemberId: resolvedHandlerId ?? null,
      },
    });
    setPendingPayouts((prev) => prev.filter((payout) => payout.id !== payoutId));
    setRecentPaid((prev) => [updated, ...prev].slice(0, 25));
    setSelectedPayoutIds((prev) => {
      if (!prev.has(payoutId)) return prev;
      const next = new Set(prev);
      next.delete(payoutId);
      return next;
    });
    setError(null);
  };

  const handleMarkPaid = async (payoutId: number) => {
    setProcessingId(payoutId);
    try {
      await completePayout(payoutId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedPayoutIds.size === 0) return;
    setBulkProcessing(true);
    try {
      await Promise.all([...selectedPayoutIds].map((payoutId) => completePayout(payoutId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBulkProcessing(false);
    }
  };

  const selectedCount = selectedPayoutIds.size;

  return (
    <section className="card">
      <header style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div>
          <h2 style={{marginBottom: "0.25rem"}}>분배 처리</h2>
          <p style={{color: "#94a3b8", margin: 0}}>
            정산된 분배 내역을 혈원별로 확인하고, 전달 완료 시 체크하여 기록을 남기세요.
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="ghost">
          새로고침
        </button>
      </header>

      <div className="card" style={{marginTop: "1.5rem", background: "rgba(15,23,42,0.45)", display: "flex", gap: "2rem"}}>
        <div>
          <p style={{margin: 0, color: "#94a3b8"}}>분배 대기 총액</p>
          <p style={{margin: 0, fontSize: "2rem"}}>{totalPending.toLocaleString()} 원</p>
        </div>
      <div>
        <p style={{margin: 0, color: "#94a3b8"}}>대기 인원</p>
        <p style={{margin: 0, fontSize: "2rem"}}>{grouped.length} 명</p>
      </div>
    </div>

      <div className="card" style={{marginTop: "1rem", background: "rgba(15,23,42,0.35)"}}>
        <div className="batch-actions">
          <label>
            지급 담당자
            <select value={completionHandler} onChange={(event) => setCompletionHandler(event.target.value)}>
              <option value="">선택 안 함</option>
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            비고
            <input
              placeholder="지급 내역 메모"
              value={completionNote}
              onChange={(event) => setCompletionNote(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => void handleBulkComplete()}
            disabled={selectedCount === 0 || bulkProcessing}
          >
            {bulkProcessing ? "선택 분배 처리 중…" : `선택 ${selectedCount}건 분배 완료`}
          </button>
        </div>
        <p style={{color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.5rem"}}>
          개별 "분배 완료" 버튼도 위 설정(담당자·비고)을 사용합니다.
        </p>
      </div>

      {loading ? (
        <p style={{color: "#94a3b8", marginTop: "1.5rem"}}>데이터를 불러오는 중입니다…</p>
      ) : grouped.length === 0 ? (
        <p style={{color: "#94a3b8", marginTop: "1.5rem"}}>처리할 분배가 없습니다.</p>
      ) : (
        <div className="grid" style={{marginTop: "1.5rem"}}>
          {grouped.map((group) => (
            <div key={group.memberId} className="card" style={{background: "rgba(15,23,42,0.35)"}}>
              <header style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem"}}>
                <div>
                  <h3 style={{margin: 0}}>{group.memberName}</h3>
                  <p style={{color: "#94a3b8", margin: 0}}>대기 {group.payouts.length}건</p>
                </div>
                <div style={{display: "flex", gap: "0.5rem", alignItems: "center"}}>
                  <p style={{margin: 0, fontSize: "1.25rem"}}>{group.totalAmount.toLocaleString()} 원</p>
                  <button type="button" className="ghost" onClick={() => setDetailMemberId(group.memberId)}>
                    상세
                  </button>
                </div>
              </header>
              <div style={{display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem"}}>
                {group.payouts.map((payout) => (
                  <div key={payout.id} style={{border: "1px solid rgba(148,163,184,0.25)", borderRadius: "0.75rem", padding: "0.75rem"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem"}}>
                      <div style={{flex: 1}}>
                        <p style={{margin: 0, fontWeight: 600}}>
                          #{payout.saleId} · {payout.itemName}
                        </p>
                        <p style={{margin: "0.25rem 0", color: "#94a3b8"}}>
                          {payout.bossName ?? "보스 미상"} · 판매 {formatDateTime(payout.soldAt)}
                        </p>
                        {payout.saleMemo && (
                          <p style={{margin: 0, color: "#cbd5f5", fontSize: "0.9rem"}}>{payout.saleMemo}</p>
                        )}
                      </div>
                      <div style={{textAlign: "right", minWidth: "140px", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end"}}>
                        <label className="select-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedPayoutIds.has(payout.id)}
                            onChange={(event) => toggleSelection(payout.id, event.target.checked)}
                          />
                          선택
                        </label>
                        <p style={{margin: 0, fontSize: "1.1rem"}}>{payout.amount.toLocaleString()} 원</p>
                        <button
                          type="button"
                          onClick={() => void handleMarkPaid(payout.id)}
                          disabled={processingId === payout.id}
                        >
                          {processingId === payout.id ? "처리 중…" : "분배 완료"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{color: "#fda4af", marginTop: "1rem"}}>{error}</p>}

      <div style={{marginTop: "2rem"}}>
        <h3 style={{marginBottom: "0.5rem"}}>최근 분배 완료</h3>
        {recentPaid.length === 0 ? (
          <p style={{color: "#94a3b8"}}>최근 완료 기록이 없습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>혈원</th>
                <th>아이템</th>
                <th>보스</th>
                <th>지급 시각</th>
                <th>금액</th>
                <th>담당</th>
                <th>비고</th>
              </tr>
            </thead>
            <tbody>
              {recentPaid.map((payout) => (
                <tr key={`paid-${payout.id}`}>
                  <td>{payout.memberName}</td>
                  <td>
                    #{payout.saleId} · {payout.itemName}
                  </td>
                  <td>{payout.bossName ?? "—"}</td>
                  <td>{formatDateTime(payout.paidAt)}</td>
                  <td>{payout.amount.toLocaleString()} 원</td>
                  <td>{payout.paidByMemberName ?? "—"}</td>
                  <td>{payout.paidNote ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detailGroup && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <header style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
              <div>
                <h3 style={{margin: 0}}>{detailGroup.memberName} 상세</h3>
                <p style={{margin: 0, color: "#94a3b8"}}>대기 {detailGroup.payouts.length}건</p>
              </div>
              <button type="button" className="ghost" onClick={() => setDetailMemberId(null)}>
                닫기
              </button>
            </header>
            <div className="modal-body">
              {detailGroup.payouts.map((payout) => (
                <div key={`detail-${payout.id}`} className="modal-line">
                  <div>
                    <p style={{margin: 0, fontWeight: 600}}>
                      #{payout.saleId} · {payout.itemName}
                    </p>
                    <p style={{margin: "0.25rem 0", color: "#94a3b8"}}>
                      {payout.bossName ?? "보스 미상"} · 판매 {formatDateTime(payout.soldAt)}
                    </p>
                    {payout.saleMemo && <p style={{margin: 0, color: "#cbd5f5"}}>{payout.saleMemo}</p>}
                  </div>
                  <p style={{margin: 0, fontWeight: 600}}>{payout.amount.toLocaleString()} 원</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
