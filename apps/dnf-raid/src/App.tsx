import {NavLink, Route, Routes} from "react-router-dom";
import {Sparkles, Sword, Users} from "lucide-react";

import RaidListPage from "./pages/RaidListPage";
import ApplicantPage from "./pages/ApplicantPage";
import LeaderDashboard from "./pages/LeaderDashboard";
import RegisterCharacterPage from "./pages/RegisterCharacterPage";
import SharePage from "./pages/SharePage";
import {RAID_MODES, type RaidModeId} from "./constants";
import {RaidModeProvider, useRaidMode} from "./hooks/useRaidMode";

const navItems = [
  {to: "/", label: "캐릭터 등록"},
  {to: "/apply", label: "지원 페이지"},
  {to: "/raids", label: "공대 리스트"},
  {to: "/leader", label: "공대장"},
];

function AppShell() {
  const {raidMode, setRaidModeId} = useRaidMode();

  return (
    <div className="min-h-screen text-text bg-ink">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-panel-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-muted border border-panel-border flex items-center justify-center shadow-soft">
              <Sword className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-lg leading-tight text-text">zzirit - 던전앤파이터 공대 관리</p>
              <p className="text-xs text-text-muted leading-tight">
                {raidMode.name} · {raidMode.badge}
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="pill w-fit bg-primary-muted border-primary/30 text-text">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase tracking-[0.2em] text-text-subtle">
                  {raidMode.name}
                </span>
              </div>
              <select
                value={raidMode.id}
                onChange={(e) => setRaidModeId(e.target.value as RaidModeId)}
                className="rounded-lg border border-panel-border bg-white/80 px-3 py-2 text-xs text-text shadow-soft focus:border-primary focus:outline-none"
              >
                {RAID_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name} · {mode.badge}
                  </option>
                ))}
              </select>
            </div>
            <h1 className="font-display text-3xl md:text-4xl leading-tight text-text">
              레이드 신청 · 편성 · 공유를
              <span className="text-primary"> zzirit</span>에서 끝내세요.
            </h1>
            <p className="text-text-muted max-w-3xl">
              {raidMode.name} 페이지입니다.
            </p>
            <p className="text-xs text-text-subtle">
              {raidMode.description} · {raidMode.partyCount}파티 × {raidMode.slotsPerParty}인 슬롯
            </p>
          </div>
        </section>

        <Routes>
          <Route path="/" element={<RegisterCharacterPage />} />
          <Route path="/apply" element={<ApplicantPage />} />
          <Route path="/register" element={<RegisterCharacterPage />} />
          <Route path="/raids" element={<RaidListPage />} />
          <Route path="/leader" element={<LeaderDashboard />} />
          <Route path="/:raidId" element={<SharePage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <RaidModeProvider>
      <AppShell />
    </RaidModeProvider>
  );
}

export default App;
