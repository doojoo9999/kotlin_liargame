import ImageUploadPage from "./ImageUploadPage";

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
    description: "실시간 추리와 토론 게임.",
    href:
      import.meta.env.VITE_LIAR_GAME_URL ??
      "https://zzirit.kr/liargame/",
  },
  {
    id: "nemonemo",
    name: "네모네모 로직",
    description: "논리 퍼즐로 캐주얼 게임.",
    href:
      import.meta.env.VITE_NEMONEMO_URL ??
      "https://zzirit.kr/nemonemo/",
  },
  {
    id: "blockblast",
    name: "Block Blast",
    description: "퍼즐 블록 배치 게임.",
    href:
      import.meta.env.VITE_BLOCKBLAST_URL ??
      "https://zzirit.kr/blockblast/",
  },
  {
    id: "roulette",
    name: "파티 룰렛",
    description: "돌려돌려 돌림판.",
    href:
      import.meta.env.VITE_ROULETTE_URL ??
      "https://zzirit.kr/roulette/",
  },
  {
    id: "pinball",
    name: "핀볼 로얄",
    description: "(개발중) 핀볼 배틀.",
    href:
      import.meta.env.VITE_PINBALL_URL ??
      "https://zzirit.kr/pinball/",
  },
  {
    id: "sadari-game",
    name: "사다리 게임",
    description: "사다리오다리육다리.",
    href:
      import.meta.env.VITE_SADARI_GAME_URL ??
      "https://zzirit.kr/sadari/",
  },
];

const highlightStats = [
  { label: "실시간 세션", value: "3+" },
  { label: "플레이어 동시 접속", value: "150+" }
];

const roadmap = [
  {
    phase: "1",
    title: "캐주얼 퍼즐 & 파티 게임",
    detail: "개발중",
  },
  {
    phase: "2",
    title: "멀티 디바이스 연동",
    detail: "개발중",
  },
  {
    phase: "3",
    title: "AI 사회자 & 도우미",
    detail: "개발중",
  },
];

export default function App() {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";

  if (path === "/img" || path === "/img/") {
    return <ImageUploadPage />;
  }

  return (
    <main className="landing">
      <section className="landing__hero">
        <div className="landing__hero-badge">WEB GAME STUDIO</div>
        <h1 className="landing__hero-title">
          zzirit&nbsp;& &nbsp;
          <span className="landing__hero-gradient"> DOOJOO</span>
        </h1>
        <p className="landing__hero-subtitle">
          다양한 장르의 게임을 선택하고 플레이하세요.
        </p>
        <div className="landing__hero-actions">
          <div className="landing__hero-actions-primary">
            <a
              className="button button--primary"
              href={gameLinks[0].href}
              target="_blank"
              rel="noreferrer noopener"
            >
              라이어 게임 시작
            </a>
            <a
              className="button button--secondary"
              href={
                gameLinks.find((game) => game.id === "nemonemo")?.href ??
                "https://zzirit.kr/nemonemo/"
              }
              target="_blank"
              rel="noreferrer noopener"
            >
              네모네모 로직 플레이
            </a>
          </div>
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
