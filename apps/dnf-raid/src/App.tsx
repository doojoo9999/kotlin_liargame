import {NavLink, Route, Routes} from "react-router-dom";
import {Sparkles, Sword, Users} from "lucide-react";

import ApplicantPage from "./pages/ApplicantPage";
import LeaderDashboard from "./pages/LeaderDashboard";
import SharePage from "./pages/SharePage";

const navItems = [
  {to: "/", label: "지원 페이지"},
  {to: "/leader", label: "레이드 리더"},
];

function App() {
  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-ink/60 border-b border-panel-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-hero-gradient shadow-neon flex items-center justify-center">
              <Sword className="h-5 w-5 text-neon-cyan" />
            </div>
            <div>
              <p className="font-display text-lg leading-tight">Diregie Raid</p>
              <p className="text-xs text-white/60 leading-tight">
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
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/5",
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
          <div className="absolute right-6 top-6 opacity-40">
            <Sparkles className="h-10 w-10 text-neon-cyan" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="pill w-fit">
              <Users className="h-4 w-4 text-neon-cyan" />
              <span className="text-xs uppercase tracking-[0.2em] text-white/70">
                Diregie Premium Board
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl leading-tight">
              레이드 신청 · 편성 · 공유를
              <span className="text-neon-cyan"> 한 보드</span>에서 끝내세요.
            </h1>
            <p className="text-white/70 max-w-3xl">
              캐릭터 검색, 스펙 입력, 파티 배치와 복사 기능을 제공하는 디레지에 레이드 전용
              보드입니다. 지원자와 리더가 같은 데이터를 공유하도록 설계되었습니다.
            </p>
          </div>
        </section>

        <Routes>
          <Route path="/" element={<ApplicantPage />} />
          <Route path="/leader" element={<LeaderDashboard />} />
          <Route path="/share/:raidId" element={<SharePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
