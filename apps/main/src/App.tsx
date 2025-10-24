type GameLink = {
  id: string;
  name: string;
  description: string;
  href: string;
  comingSoon?: boolean;
};

const gameLinks: GameLink[] = [
  {
    id: "liar-game",
    name: "라이어 게임",
    description: "실시간 추리와 토론이 펼쳐지는 메인 파티 게임.",
    href:
      import.meta.env.VITE_LIAR_GAME_URL ??
      "http://localhost:5173",
  },
  {
    id: "nemonemo",
    name: "네모네모 로직",
    description: "논리 퍼즐로 협업하며 퍼즐을 해결하는 캐주얼 게임.",
    href:
      import.meta.env.VITE_NEMONEMO_URL ??
      "http://localhost:5176",
    comingSoon: true,
  },
  {
    id: "roulette",
    name: "파티 룰렛",
    description: "빠르게 룰렛을 돌려 미션과 벌칙을 정하는 파티 꿀템.",
    href:
      import.meta.env.VITE_ROULETTE_URL ??
      "http://localhost:5174",
  },
  {
    id: "pinball",
    name: "핀볼 로얄",
    description: "맵과 스킬을 믹스해 최후의 생존자나 첫 낙하 승자를 가리는 핀볼 배틀.",
    href:
      import.meta.env.VITE_PINBALL_URL ??
      "http://localhost:5177",
  },
  {
    id: "sadari-game",
    name: "사다리 게임",
    description: "랜덤 매칭으로 게임 순서, 점심 메뉴, 팀 구성을 빠르게 정해요.",
    href:
      import.meta.env.VITE_SADARI_GAME_URL ??
      "http://localhost:5175",
  },
];

const highlightStats = [
  { label: "실시간 세션", value: "3+" },
  { label: "플레이어 동시 접속", value: "150+" },
  { label: "로컬 / 온라인 지원", value: "하이브리드" },
];

const roadmap = [
  {
    phase: "1",
    title: "캐주얼 퍼즐 & 파티 게임",
    detail: "라이어 게임과 네모네모 로직으로 시작하는 즉시 플레이 경험.",
  },
  {
    phase: "2",
    title: "멀티 디바이스 연동",
    detail: "모바일, 태블릿, TV 환경에서 동일한 룸 코드로 접속.",
  },
  {
    phase: "3",
    title: "AI 사회자 & 도우미",
    detail: "자동 사회 진행과 요약 기능으로 새로운 파티 경험 제공.",
  },
];

export default function App() {
  return (
    <main className="landing">
      <section className="landing__hero">
        <div className="landing__hero-badge">WEB 멀티 게임 스튜디오</div>
        <h1 className="landing__hero-title">
          zzirit&nbsp;& &nbsp;
          <span className="landing__hero-gradient"> STELLIVE</span>
        </h1>
        <p className="landing__hero-subtitle">
          다양한 장르의 게임을 선택하고 플레이하세요.
        </p>
        <div className="landing__hero-actions">
          <a
            className="button button--primary"
            href={gameLinks[0].href}
            target="_blank"
            rel="noreferrer noopener"
          >
            지금 바로 플레이
          </a>
          <a className="button button--ghost" href="mailto:admin@zzirit.kr">
            운영팀에게 문의
          </a>
        </div>
        <div className="landing__hero-stats">
          {highlightStats.map((stat) => (
            <div key={stat.label} className="landing__hero-stat">
              <span className="landing__hero-value">{stat.value}</span>
              <span className="landing__hero-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__section landing__section--glass">
        <header className="landing__section-header">
          <div>
            <p className="landing__eyebrow">플랫폼 라인업</p>
            <h2>실시간으로 연결되는 파티 게임</h2>
          </div>
          <p className="landing__section-copy">
            모든 게임은 동일한 계정과 룸 코드로 운영됩니다. 새로운 게임이 추가될 때마다
            자동으로 메인 허브에서 연결됩니다.
          </p>
        </header>

        <div className="landing__grid">
          {gameLinks.map((game) => (
            <a
              key={game.id}
              className={`landing__card ${game.comingSoon ? "landing__card--disabled" : ""}`}
              href={game.comingSoon ? "#" : game.href}
              aria-disabled={game.comingSoon}
              rel={game.comingSoon ? undefined : "noreferrer noopener"}
              target={game.comingSoon ? undefined : "_blank"}
            >
              <div className="landing__card-top">
                <span className="landing__pill">{game.comingSoon ? "Soon" : "Live"}</span>
                <span className="landing__icon">↗</span>
              </div>
              <h3>{game.name}</h3>
              <p>{game.description}</p>
              <div className="landing__card-footer">
                {game.comingSoon ? (
                  <span className="landing__chip">준비 중</span>
                ) : (
                  <span className="landing__chip landing__chip--active">입장하기</span>
                )}
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="landing__section">
        <header className="landing__section-header">
          <div>
            <p className="landing__eyebrow">2025 로드맵</p>
            <h2>다음 업데이트 미리보기</h2>
          </div>
          <p className="landing__section-copy">
            단계별로 확장되는 콘텐츠와 운영 자동화를 통해 파티 게임 경험을 꾸준히
            다듬고 있습니다.
          </p>
        </header>

        <div className="landing__roadmap">
          {roadmap.map((item) => (
            <article key={item.phase} className="landing__roadmap-item">
              <span className="landing__roadmap-phase">{item.phase}</span>
              <div className="landing__roadmap-content">
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
