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
      "#",
    comingSoon: true,
  },
  {
    id: "roulette",
    name: "파티 룰렛",
    description: "빠르게 룰렛을 돌려 미션과 벌칙을 정하는 파티 꿀템.",
    href:
      import.meta.env.VITE_ROULETTE_URL ??
      "#",
    comingSoon: true,
  },
  {
    id: "sadari-game",
    name: "사다리 게임",
    description: "랜덤 매칭으로 게임 순서, 점심 메뉴, 팀 구성을 빠르게 정해요.",
    href:
      import.meta.env.VITE_SADARI_GAME_URL ??
      "#",
    comingSoon: true,
  },
];

export default function App() {
  return (
    <main className="landing">
      <header className="landing__header">
        <p className="landing__badge">파티 게임 허브</p>
        <h1>친구들과 함께 즐기는 멀티 게임 플랫폼</h1>
        <p className="landing__subtitle">
          메인 페이지에서 원하는 게임을 고르고 바로 시작하세요. 추리, 퍼즐, 파티게임까지
          한곳에서 연결됩니다.
        </p>
      </header>

      <section className="landing__grid">
        {gameLinks.map((game) => (
          <a
            key={game.id}
            className={`landing__card ${game.comingSoon ? "landing__card--disabled" : ""}`}
            href={game.comingSoon ? "#" : game.href}
            aria-disabled={game.comingSoon}
            rel={game.comingSoon ? undefined : "noreferrer noopener"}
            target={game.comingSoon ? undefined : "_blank"}
          >
            <div className="landing__card-header">
              <span className="landing__card-title">{game.name}</span>
              {game.comingSoon ? (
                <span className="landing__chip">준비 중</span>
              ) : (
                <span className="landing__chip landing__chip--active">입장하기</span>
              )}
            </div>
            <p className="landing__card-description">{game.description}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
