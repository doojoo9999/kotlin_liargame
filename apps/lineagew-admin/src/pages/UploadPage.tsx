import {FormEvent, useState} from "react";
import {request} from "../api";
import type {UploadCommitResponse, UploadPreviewResponse} from "../types.upload";

export default function UploadPage() {
  const [payload, setPayload] = useState<string>(JSON.stringify({members: [], bosses: [], bossKills: []}, null, 2));
  const [preview, setPreview] = useState<UploadPreviewResponse | null>(null);
  const [commit, setCommit] = useState<UploadCommitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsePayload = () => {
    try {
      return JSON.parse(payload);
    } catch (err) {
      throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setCommit(null);
    try {
      const data = await request<UploadPreviewResponse>("/upload/preview", {
        method: "POST",
        body: parsePayload(),
      });
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCommit = async () => {
    setError(null);
    try {
      const data = await request<UploadCommitResponse>("/upload/commit", {
        method: "POST",
        body: parsePayload(),
      });
      setCommit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <section className="card">
      <h2>시트 업로드</h2>
      <p style={{color: "#94a3b8", marginBottom: "1.5rem"}}>
        스프레드시트를 JSON으로 정규화해 붙여 넣은 뒤, 미리보기→커밋 순으로 진행하세요.
      </p>

      <form onSubmit={handlePreview} className="grid">
        <textarea
          rows={16}
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          spellCheck={false}
        />
        <div style={{display: "flex", gap: "1rem"}}>
          <button type="submit">미리보기</button>
          <button type="button" onClick={handleCommit}>
            커밋
          </button>
        </div>
      </form>

      {error && <p style={{color: "#fda4af"}}>{error}</p>}

      {preview && (
        <div className="card" style={{background: "rgba(15,23,42,0.45)"}}>
          <h3 style={{marginTop: 0}}>미리보기 요약</h3>
          <ul>
            <li>혈원: {preview.memberCount}</li>
            <li>보스: {preview.bossCount}</li>
            <li>보스킬: {preview.bossKillCount}</li>
            <li>아이템: {preview.itemCount}</li>
            <li>판매: {preview.saleCount}</li>
            <li>혈비 내역: {preview.clanFundTxnCount}</li>
            <li>정수: {preview.essenceCount}</li>
          </ul>
          {preview.warnings.length > 0 && (
            <div style={{color: "#fbbf24"}}>
              <strong>주의</strong>
              <ul>
                {preview.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {commit && (
        <div className="card" style={{background: "rgba(15,23,42,0.45)"}}>
          <h3 style={{marginTop: 0}}>커밋 결과</h3>
          <ul>
            <li>혈원 생성: {commit.createdMembers}</li>
            <li>보스 생성: {commit.createdBosses}</li>
            <li>보스킬 등록: {commit.createdBossKills}</li>
            <li>아이템 생성: {commit.createdItems}</li>
            <li>판매 등록: {commit.createdSales}</li>
            <li>확정된 판매: {commit.finalizedSales}</li>
            <li>혈비 내역: {commit.clanFundTxns}</li>
            <li>정수 업서트: {commit.essences}</li>
          </ul>
        </div>
      )}
    </section>
  );
}
