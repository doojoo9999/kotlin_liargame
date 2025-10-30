import {type CSSProperties, FormEvent, useEffect, useState} from "react";
import {ApiError, buildQuery, request} from "../api";
import type {BossKillResponse, ItemDetailResponse, ItemResponse} from "../types";
import {ItemGrade, ItemStatus} from "../types";
import {getItemGradeLabel, getItemStatusLabel} from "../utils/labels";

interface ItemForm {
  name: string;
  grade: ItemGrade;
  acquiredAt: string;
  sourceBossKillId: string;
  status: ItemStatus;
  note: string;
  tags: string;
}

const createFormDefaults = (): ItemForm => ({
  name: "",
  grade: ItemGrade.RARE,
  acquiredAt: "",
  sourceBossKillId: "",
  status: ItemStatus.IN_STOCK,
  note: "",
  tags: "",
});

export default function ItemsPage() {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [recentKills, setRecentKills] = useState<BossKillResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "">("");
  const [form, setForm] = useState<ItemForm>(() => createFormDefaults());
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ItemDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadItemDetail = async (
    id: number,
    options: {preserveSelection?: boolean} = {}
  ) => {
    if (!options.preserveSelection) {
      setSelectedItemId(id);
    }
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await request<ItemDetailResponse>(`/items/${id}`);
      setSelectedDetail(detail);
    } catch (err) {
      setSelectedDetail(null);
      setDetailError(formatError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const loadItems = async (
    status: ItemStatus | "" = statusFilter,
    keywordValue: string = debouncedKeyword,
    options: {refreshDetail?: boolean} = {}
  ) => {
    try {
      setError(null);
      const query = buildQuery({
        status: status || undefined,
        keyword: keywordValue.trim() || undefined,
      });
      const data = await request<ItemResponse[]>(`/items${query}`);
      setItems(data);

      if (selectedItemId) {
        const stillExists = data.some((item) => item.id === selectedItemId);
        if (!stillExists) {
          setSelectedItemId(null);
          setSelectedDetail(null);
          setDetailError(null);
        } else if (options.refreshDetail) {
          await loadItemDetail(selectedItemId, {preserveSelection: true});
        }
      }
    } catch (err) {
      setError(formatError(err));
    }
  };

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedKeyword(keyword), 250);
    return () => window.clearTimeout(handle);
  }, [keyword]);

  useEffect(() => {
    void loadItems(statusFilter, debouncedKeyword, {refreshDetail: true});
  }, [statusFilter, debouncedKeyword]);

  useEffect(() => {
    void (async () => {
      try {
        const kills = await request<BossKillResponse[]>(`/boss-kills${buildQuery({limit: 10})}`);
        setRecentKills(kills);
      } catch (err) {
        console.warn("보스킬 목록을 불러오지 못했습니다.", err);
      }
    })();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await request<ItemResponse>(`/items/${editingId}`, {
          method: "PUT",
          body: buildPayload(form),
        });
      } else {
        await request<ItemResponse>("/items", {
          method: "POST",
          body: buildPayload(form),
        });
      }
      const previousEditingId = editingId;
      resetForm();
      await loadItems(statusFilter, debouncedKeyword, {refreshDetail: Boolean(previousEditingId)});
    } catch (err) {
      setError(formatError(err));
    }
  };

  const resetForm = () => {
    setForm(createFormDefaults());
    setEditingId(null);
  };

  const handleEdit = (item: ItemResponse) => {
    setForm({
      name: item.name,
      grade: item.grade,
      acquiredAt: item.acquiredAt ?? "",
      sourceBossKillId: item.sourceBossKillId ? String(item.sourceBossKillId) : "",
      status: item.status,
      note: item.note ?? "",
      tags: item.tags.join(", "),
    });
    setEditingId(item.id);
    setError(null);
  };

  const handleDelete = async (item: ItemResponse) => {
    if (!window.confirm(`정말로 '${item.name}' 아이템을 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await request(`/items/${item.id}`, {method: "DELETE"});
      if (selectedItemId === item.id) {
        setSelectedItemId(null);
        setSelectedDetail(null);
        setDetailError(null);
      }
      await loadItems(statusFilter, debouncedKeyword);
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleSelect = async (itemId: number) => {
    await loadItemDetail(itemId);
  };

  const isEditing = editingId !== null;

  const linkButtonStyle: CSSProperties = {
    background: "none",
    border: "none",
    color: "#60a5fa",
    cursor: "pointer",
    padding: 0,
    font: "inherit",
    textDecoration: "underline",
  };

  return (
    <section className="card">
      <h2>인벤토리</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        드랍 시점부터 판매 완료까지 아이템 상태를 추적하고 태그로 검색 용어를 맞춰 주세요.
      </p>

      <div style={{display: "flex", gap: "1rem", marginBottom: "1.5rem"}}>
        <label>
          상태 필터
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ItemStatus | "")}
          >
            <option value="">전체</option>
            {Object.values(ItemStatus).map((status) => (
              <option key={status} value={status}>
                {getItemStatusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label style={{flex: 1}}>
          검색
          <input
            placeholder="이름 또는 태그 검색"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
      </div>

      <form onSubmit={handleSubmit} className="grid">
        <input
          placeholder="아이템 이름"
          value={form.name}
          onChange={(event) => setForm({...form, name: event.target.value})}
          required
        />
        <div className="grid grid-cols-2">
          <select
            value={form.grade}
            onChange={(event) => setForm({...form, grade: event.target.value as ItemGrade})}
          >
            {Object.values(ItemGrade).map((grade) => (
              <option key={grade} value={grade}>
                {getItemGradeLabel(grade)}
              </option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(event) => setForm({...form, status: event.target.value as ItemStatus})}
          >
            {Object.values(ItemStatus).map((status) => (
              <option key={status} value={status}>
                {getItemStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        <input
          type="date"
          value={form.acquiredAt}
          onChange={(event) => setForm({...form, acquiredAt: event.target.value})}
        />
        <select
          value={form.sourceBossKillId}
          onChange={(event) => setForm({...form, sourceBossKillId: event.target.value})}
        >
          <option value="">연결할 보스킬 (선택)</option>
          {recentKills.map((kill) => (
            <option key={kill.id} value={kill.id}>
              #{kill.id} · {kill.bossName} · {new Date(kill.killedAt).toLocaleString()}
            </option>
          ))}
        </select>
        <textarea
          placeholder="태그(쉼표로 구분)"
          value={form.tags}
          onChange={(event) => setForm({...form, tags: event.target.value})}
        />
        <textarea
          placeholder="메모"
          value={form.note}
          onChange={(event) => setForm({...form, note: event.target.value})}
        />
        <div>
          <button type="submit">{isEditing ? "아이템 수정" : "아이템 저장"}</button>
          {isEditing && (
            <button
              type="button"
              className="button button--ghost"
              style={{marginLeft: "0.5rem"}}
              onClick={resetForm}
            >
              취소
            </button>
          )}
        </div>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>등급</th>
            <th>상태</th>
            <th>획득일</th>
            <th>보스킬</th>
            <th>태그</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <button type="button" style={linkButtonStyle} onClick={() => handleSelect(item.id)}>
                  {item.name}
                </button>
              </td>
              <td>{getItemGradeLabel(item.grade)}</td>
              <td>{getItemStatusLabel(item.status)}</td>
              <td>{item.acquiredAt ?? ""}</td>
              <td>{item.sourceBossKillId ?? ""}</td>
              <td>{item.tags.join(", ")}</td>
              <td>
                <div style={{display: "flex", gap: "0.5rem"}}>
                  <button type="button" onClick={() => handleEdit(item)}>
                    수정
                  </button>
                  <button type="button" className="button button--danger" onClick={() => handleDelete(item)}>
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedItemId && (
        <section
          className="card"
          style={{marginTop: "2rem", background: "rgba(15,23,42,0.45)", border: "1px solid rgba(148,163,184,0.25)"}}
        >
          <h3 style={{marginTop: 0}}>아이템 상세</h3>
          {detailLoading && <p>상세 정보를 불러오는 중입니다…</p>}
          {!detailLoading && detailError && <p style={{color: "#fda4af"}}>{detailError}</p>}
          {!detailLoading && !detailError && selectedDetail && (
            <div className="grid" style={{gap: "0.75rem"}}>
              <div>
                <strong>아이템</strong>
                <div>이름: {selectedDetail.name}</div>
                <div>등급: {getItemGradeLabel(selectedDetail.grade)}</div>
                <div>상태: {getItemStatusLabel(selectedDetail.status)}</div>
                <div>획득일: {formatDate(selectedDetail.acquiredAt)}</div>
                <div>태그: {selectedDetail.tags.length ? selectedDetail.tags.join(", ") : "-"}</div>
                <div>메모: {selectedDetail.note?.trim() ? selectedDetail.note : "-"}</div>
              </div>

              {selectedDetail.sourceBossKill ? (
                <div>
                  <strong>획득 보스</strong>
                  <div>보스: {selectedDetail.sourceBossKill.bossName}</div>
                  <div>처치 시각: {formatDateTime(selectedDetail.sourceBossKill.killedAt)}</div>
                  {selectedDetail.sourceBossKill.notes?.trim() && (
                    <div>비고: {selectedDetail.sourceBossKill.notes}</div>
                  )}
                  <div style={{marginTop: "0.75rem"}}>
                    <strong>참여자</strong>
                    {selectedDetail.sourceBossKill.participants.length > 0 ? (
                      <ul>
                        {selectedDetail.sourceBossKill.participants.map((participant) => (
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
                </div>
              ) : (
                <div>
                  <strong>획득 보스</strong>
                  <p style={{margin: 0}}>연결된 보스킬 정보가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </section>
  );
}

function buildPayload(form: ItemForm) {
  return {
    name: form.name,
    grade: form.grade,
    acquiredAt: form.acquiredAt || null,
    sourceBossKillId: form.sourceBossKillId ? Number(form.sourceBossKillId) : null,
    status: form.status,
    note: form.note?.trim() || null,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString();
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
}
