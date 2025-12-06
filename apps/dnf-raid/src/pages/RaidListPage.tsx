import {FormEvent, useState} from "react";
import {ArrowRight, List, Sparkles} from "lucide-react";
import {useNavigate} from "react-router-dom";

function RaidListPage() {
  const navigate = useNavigate();
  const [raidIdInput, setRaidIdInput] = useState("");

  const handleGo = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = raidIdInput.trim();
    if (!trimmed) return;
    navigate(`/${trimmed}`);
  };

  return (
    <div className="space-y-8">
      <section className="frosted p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <List className="h-4 w-4" />
          <span>공대 리스트</span>
        </div>
        <h2 className="font-display text-2xl text-text">열려 있는 공대에 합류하거나, 공대장을 통해 받은 링크로 들어가세요.</h2>
        <p className="text-text-subtle text-sm">
          정식 리스트 API가 준비되면 이곳에 일정별/모험단별 공개 공대가 표시됩니다. 지금은 공대장이 공유한 링크나 ID로 바로 이동할 수 있습니다.
        </p>
      </section>

      <section className="frosted p-5 grid gap-4 md:grid-cols-3 items-start">
        <div className="space-y-2 md:col-span-2">
          <p className="text-sm text-text-muted">공유 링크로 바로 이동</p>
          <div className="rounded-lg border border-panel-border bg-panel p-4 space-y-2">
            <p className="text-sm text-text-subtle">공대장이 전달한 URL이 있다면 그대로 접속하면 됩니다. URL 예시: zzirit.kr/dnf/난수</p>
            <div className="pill border-primary/30 bg-primary-muted text-text w-fit">
              <Sparkles className="h-4 w-4 text-primary" />
              링크로 입장 시 파티 편성과 지원 정보를 바로 볼 수 있습니다.
            </div>
          </div>
        </div>

        <form onSubmit={handleGo} className="space-y-2">
          <p className="text-sm text-text-muted">레이드 ID로 이동</p>
          <div className="flex items-center gap-2 rounded-lg border border-panel-border bg-panel px-3 py-2 shadow-soft focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <input
              value={raidIdInput}
              onChange={(e) => setRaidIdInput(e.target.value)}
              placeholder="예: 123e4567-e89b-12d3-a456-426614174000"
              className="bg-transparent outline-none flex-1 text-sm text-text placeholder:text-text-subtle"
            />
            <button type="submit" className="text-sm text-primary hover:text-primary-dark flex items-center gap-1">
              이동
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-text-subtle">공대장이 복사해서 준 ID를 입력하면 해당 공대로 이동합니다.</p>
        </form>
      </section>
    </div>
  );
}

export default RaidListPage;
