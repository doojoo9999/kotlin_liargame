import {FormEvent, useEffect, useState} from "react";
import {clearAdminKey, getAdminHeaderName, getAdminKey, setAdminKey} from "../adminAuth";

export default function AdminKeyPanel() {
  const headerName = getAdminHeaderName();
  const [storedKey, setStoredKey] = useState<string>("");
  const [pendingKey, setPendingKey] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    const existing = getAdminKey() ?? "";
    setStoredKey(existing);
    setPendingKey(existing);
  }, []);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = pendingKey.trim();
    if (!trimmed) {
      setStatusMessage("키 값을 입력하세요.");
      return;
    }
    setAdminKey(trimmed);
    setStoredKey(trimmed);
    setStatusMessage("관리자 키가 저장되었습니다.");
  };

  const handleClear = () => {
    clearAdminKey();
    setStoredKey("");
    setPendingKey("");
    setStatusMessage("관리자 키를 삭제했습니다.");
  };

  return (
    <section className="card" style={{marginBottom: "1.5rem"}}>
      <form onSubmit={handleSave} className="admin-key-panel">
        <div>
          <p style={{margin: 0, fontWeight: 600}}>관리자 인증 헤더</p>
          <p style={{margin: "0.25rem 0", color: "#94a3b8"}}>
            {headerName} (현재 상태: {storedKey ? "설정됨" : "미설정"})
          </p>
          <p style={{margin: 0, color: "#94a3b8", fontSize: "0.9rem"}}>
            혈원 편집·분배 처리 전 관리자 헤더 키를 입력하세요.
          </p>
        </div>
        <div className="admin-key-actions">
          <input
            type="password"
            placeholder="관리자 키"
            value={pendingKey}
            onChange={(event) => setPendingKey(event.target.value)}
          />
          <div className="admin-key-buttons">
            <button type="submit">저장</button>
            <button type="button" onClick={handleClear} className="ghost">
              삭제
            </button>
          </div>
          {statusMessage && <p style={{margin: 0, color: "#fcd34d"}}>{statusMessage}</p>}
        </div>
      </form>
    </section>
  );
}
