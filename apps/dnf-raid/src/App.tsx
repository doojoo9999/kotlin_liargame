import {NavLink, Route, Routes} from "react-router-dom";
import {Sparkles, Sword, Users} from "lucide-react";

import RaidListPage from "./pages/RaidListPage";
import ApplicantPage from "./pages/ApplicantPage";
import LeaderDashboard from "./pages/LeaderDashboard";
import SharePage from "./pages/SharePage";

const navItems = [
  {to: "/", label: "공대 리스트"},
  {to: "/apply", label: "지원 페이지"},
  {to: "/leader", label: "공대장"},
];

function App() {
  return (
    <div className="min-h-screen text-text bg-ink">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-panel-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-muted border border-panel-border flex items-center justify-center shadow-soft">
              <Sword className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-lg leading-tight text-text">Diregie Raid</p>
              <p className="text-xs text-text-muted leading-tight">
                던파 디레지에 레이드 편성 보드
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({isActive}) =>
                  [
                    "px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-white shadow-soft"
                      : "text-text-muted hover:text-text hover:bg-panel-muted",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        <section className="frosted p-6 relative overflow-hidden">
          <div className="absolute right-6 top-6 opacity-60">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="pill w-fit bg-primary-muted border-primary/30 text-text">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-[0.2em] text-text-subtle">
                디레지에 공격대
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl leading-tight text-text">
              레이드 신청 · 편성 · 공유를
              <span className="text-primary"> 한 보드</span>에서 끝내세요.
            </h1>
            <p className="text-text-muted max-w-3xl">
              캐릭터 검색, 스펙 입력, 파티 배치와 복사 기능을 제공하는 디레지에 레이드 전용
              보드입니다. 지원자와 공대장이 같은 데이터를 공유하도록 설계되었습니다.
            </p>
          </div>
        </section>

        <Routes>
          <Route path="/" element={<RaidListPage />} />
          <Route path="/apply" element={<ApplicantPage />} />
          <Route path="/leader" element={<LeaderDashboard />} />
          <Route path="/:raidId" element={<SharePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
