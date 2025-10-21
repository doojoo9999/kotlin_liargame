import {useCallback, useLayoutEffect, useMemo, useRef, useState} from "react";

type HoverState =
  | {
      type: "participant" | "outcome";
      index: number;
    }
  | null;

const PLAYER_POOL = [
  "강지",
  "유니",
  "시로",
  "타비",
  "히나",
  "리제",
  "부키",
  "리코",
  "린",
  "나나",
  "칸나",
  "후야",
] as const;

const DEFAULT_OUTCOME_LABEL = (index: number) => `결과 ${index + 1}`;
const INITIAL_PARTICIPANT_COUNT = 6;

function getRandomParticipants(count: number) {
  const target = Math.min(count, PLAYER_POOL.length);
  const indices = shuffleIndices(PLAYER_POOL.length).slice(0, target);
  const picked = indices.map((index) => PLAYER_POOL[index]);
  if (target < count) {
    return [...picked, ...Array.from({ length: count - target }, () => "")];
  }
  return picked;
}

function shuffleIndices(size: number) {
  const indices = Array.from({ length: size }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

function clampCount(count: number) {
  return Math.max(2, Math.min(12, count));
}

export default function App() {
  const [participants, setParticipants] = useState<string[]>(() =>
    getRandomParticipants(INITIAL_PARTICIPANT_COUNT)
  );
  const [outcomes, setOutcomes] = useState<string[]>(() =>
    Array.from({ length: INITIAL_PARTICIPANT_COUNT }, (_, index) => DEFAULT_OUTCOME_LABEL(index))
  );
  const [assignment, setAssignment] = useState<number[]>(() =>
    shuffleIndices(INITIAL_PARTICIPANT_COUNT)
  );
  const [hovered, setHovered] = useState<HoverState>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const ladderRef = useRef<HTMLDivElement>(null);
  const [pathLayout, setPathLayout] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const [svgSize, setSvgSize] = useState({ width: 320, height: 320 });
  const rowHeight = 68;

  leftRefs.current.length = participants.length;
  rightRefs.current.length = outcomes.length;

  const resolvedParticipants = useMemo(
    () =>
      participants.map((name, index) => {
        const trimmed = name.trim();
        return trimmed.length > 0 ? trimmed : `참가자 ${index + 1}`;
      }),
    [participants]
  );

  const resolvedOutcomes = useMemo(
    () =>
      outcomes.map((name, index) => {
        const trimmed = name.trim();
        return trimmed.length > 0 ? trimmed : DEFAULT_OUTCOME_LABEL(index);
      }),
    [outcomes]
  );

  const pairs = useMemo(
    () =>
      resolvedParticipants.map((participant, index) => {
        const outcomeIndex = assignment[index] ?? index;
        return {
          participant,
          outcome: resolvedOutcomes[outcomeIndex] ?? DEFAULT_OUTCOME_LABEL(outcomeIndex),
          participantIndex: index,
          outcomeIndex
        };
      }),
    [resolvedParticipants, assignment, resolvedOutcomes]
  );

  const outcomePerspective = useMemo(
    () =>
      resolvedOutcomes.map((label, outcomeIndex) => {
        const participantIndex = assignment.findIndex((value) => value === outcomeIndex);
        const participantName =
          participantIndex === -1 ? "미지정" : resolvedParticipants[participantIndex];
        return {
          label,
          outcomeIndex,
          participantName,
          participantIndex
        };
      }),
    [resolvedOutcomes, assignment, resolvedParticipants]
  );

  const recalcPaths = useCallback(() => {
    const container = ladderRef.current;
    if (!container) return;

    if (container.offsetParent === null) return;

    const containerRect = container.getBoundingClientRect();
    const baseTop = containerRect.top;
    const baseLeft = containerRect.left;
    let width = containerRect.width || 320;

    const rawPaths = pairs.map((pair) => {
      const startEl = leftRefs.current[pair.participantIndex];
      const endEl = rightRefs.current[pair.outcomeIndex];

      if (!startEl || !endEl) {
        const fallbackY1 = (pair.participantIndex + 0.5) * rowHeight;
        const fallbackY2 = (pair.outcomeIndex + 0.5) * rowHeight;
        return {
          x1: width * 0.22,
          y1: fallbackY1,
          x2: width * 0.78,
          y2: fallbackY2,
        };
      }

      const startRect = startEl.getBoundingClientRect();
      const endRect = endEl.getBoundingClientRect();
      const y1 = startRect.top + startRect.height / 2 - baseTop;
      const y2 = endRect.top + endRect.height / 2 - baseTop;
      const x1 = startRect.right - baseLeft;
      const x2 = endRect.left - baseLeft;
      return {
        x1,
        y1,
        x2,
        y2,
      };
    });

    const maxX = rawPaths.reduce((acc, path) => Math.max(acc, path.x1, path.x2), 0);
    width = Math.max(width, maxX + 16);

    const newPaths = rawPaths.map((path) => ({
      x1: Math.max(0, Math.min(width, path.x1)),
      y1: path.y1,
      x2: Math.max(0, Math.min(width, path.x2)),
      y2: path.y2,
    }));

    const maxY = rawPaths.reduce((acc, path) => Math.max(acc, path.y1, path.y2), 0);
    const height = Math.max(maxY + 48, containerRect.height, 200);

    setSvgSize((prev) => {
      if (prev.width === width && prev.height === height) {
        return prev;
      }
      return { width, height };
    });

    setPathLayout((prev) => {
      if (
        prev.length === newPaths.length &&
        prev.every((entry, idx) => {
          const next = newPaths[idx];
          return (
            entry.x1 === next.x1 &&
            entry.y1 === next.y1 &&
            entry.x2 === next.x2 &&
            entry.y2 === next.y2
          );
        })
      ) {
        return prev;
      }
      return newPaths;
    });
  }, [pairs, rowHeight]);

  useLayoutEffect(() => {
    recalcPaths();
  }, [recalcPaths]);

  useLayoutEffect(() => {
    const handleResize = () => recalcPaths();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [recalcPaths]);

  useLayoutEffect(() => {
    const fontSet = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fontSet) return;

    let cancelled = false;
    fontSet.ready
      .then(() => {
        if (!cancelled) {
          recalcPaths();
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [recalcPaths]);

  const syncLength = (nextCount: number) => {
    const target = clampCount(nextCount);
    setParticipants((prev) => {
      if (prev.length === target) return prev;
      if (prev.length < target) {
        const additions = Array.from({ length: target - prev.length }, () => "");
        return [...prev, ...additions];
      }
      return prev.slice(0, target);
    });
    setOutcomes((prev) => {
      if (prev.length === target) return prev;
      if (prev.length < target) {
        const additions = Array.from({ length: target - prev.length }, (_, index) => {
          const id = prev.length + index + 1;
          return DEFAULT_OUTCOME_LABEL(id - 1);
        });
        return [...prev, ...additions];
      }
      return prev.slice(0, target);
    });
    setAssignment(shuffleIndices(target));
  };

  const handleAddRow = () => {
    syncLength(participants.length + 1);
  };

  const handleRemoveRow = (index: number) => {
    if (participants.length <= 2) return;
    const filteredParticipants = participants.filter((_, idx) => idx !== index);
    const filteredOutcomes = outcomes.filter((_, idx) => idx !== index);
    setParticipants(filteredParticipants);
    setOutcomes(filteredOutcomes);
    setAssignment(shuffleIndices(filteredParticipants.length));
  };

  const handleParticipantChange = (index: number, value: string) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleOutcomeChange = (index: number, value: string) => {
    setOutcomes((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleShuffle = () => {
    setAssignment(shuffleIndices(participants.length));
    setHovered(null);
  };

  const handleClearInputs = () => {
    const target = participants.length;
    setParticipants(Array.from({ length: target }, () => ""));
    setOutcomes(Array.from({ length: target }, (_, index) => DEFAULT_OUTCOME_LABEL(index)));
    setAssignment(shuffleIndices(target));
    setHovered(null);
  };

  const handleRandomFill = () => {
    const target = participants.length;
    setParticipants(getRandomParticipants(target));
    setAssignment(shuffleIndices(target));
    setHovered(null);
  };

  return (
    <main className="sadari">
      <section className="sadari__hero">
        <span className="sadari__hero-badge">빠른 랜덤 매칭</span>
        <h1 className="sadari__hero-title">
          팀 배정, 메뉴 정하기, 벌칙 뽑기까지
          <span className="sadari__hero-highlight"> 사다리 한 번이면 충분해요</span>
        </h1>
        <p className="sadari__hero-subtitle">
          참가자와 결과를 입력하고 자리 섞기를 누르면 자동으로 매칭해드립니다.
          파티마다 새로 고르는 번거로움 없이, 깔끔한 UI로 결과를 공유하세요.
        </p>
        <div className="sadari__hero-actions">
          <button type="button" className="button button--primary" onClick={handleShuffle}>
            자리 섞기
          </button>
          <button type="button" className="button button--ghost" onClick={handleClearInputs}>
            기본값 초기화
          </button>
        </div>
      </section>

      <section className="sadari__grid">
        <article className="sadari__panel sadari__panel--form">
          <header className="sadari__panel-header">
            <div>
              <p className="sadari__eyebrow">입력</p>
              <h2>참가자와 결과를 설정하세요</h2>
            </div>
            <div className="sadari__actions">
              <button
                type="button"
                className="button button--small"
                onClick={() => syncLength(4)}
              >
                4명 빠르게 추가
              </button>
              <button type="button" className="button button--small" onClick={handleAddRow}>
                항목 추가
              </button>
              <button type="button" className="button button--small" onClick={handleRandomFill}>
                랜덤 채우기
              </button>
            </div>
          </header>

          <div className="sadari__form-list">
            {participants.map((participant, index) => (
              <div key={`row-${index}`} className="sadari__form-row">
                <div className="sadari__form-field">
                  <label htmlFor={`participant-${index}`} className="sadari__label">
                    참가자 {index + 1}
                  </label>
                  <input
                    id={`participant-${index}`}
                    className="sadari__input"
                    value={participant}
                    onChange={(event) => handleParticipantChange(index, event.target.value)}
                    placeholder={`참가자 ${index + 1}`}
                    autoComplete="off"
                  />
                </div>
                <div className="sadari__form-field">
                  <label htmlFor={`outcome-${index}`} className="sadari__label">
                    결과 {index + 1}
                  </label>
                  <input
                    id={`outcome-${index}`}
                    className="sadari__input"
                    value={outcomes[index]}
                    onChange={(event) => handleOutcomeChange(index, event.target.value)}
                    placeholder={`결과 ${index + 1}`}
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  className="sadari__remove"
                  onClick={() => handleRemoveRow(index)}
                  aria-label={`${index + 1}번째 행 삭제`}
                  disabled={participants.length <= 2}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <footer className="sadari__panel-footer">
            <p>
              ⚖️ 최소 2명부터 12명까지 생성할 수 있습니다.
            </p>
          </footer>
        </article>

        <article className="sadari__panel sadari__panel--glass">
          <header className="sadari__panel-header">
            <div>
              <p className="sadari__eyebrow">Result</p>
              <h2>이번 매칭 결과</h2>
            </div>
            <button type="button" className="button button--secondary" onClick={handleShuffle}>
              다시 자리 섞기
            </button>
          </header>

          <div className="sadari__ladder" ref={ladderRef}>
            <div
              className="sadari__ladder-column"
              onMouseLeave={() => setHovered(null)}
            >
              {pairs.map((pair) => {
                const isActive =
                  hovered === null ||
                  (hovered.type === "participant" && hovered.index === pair.participantIndex) ||
                  (hovered.type === "outcome" && hovered.index === pair.outcomeIndex);
                return (
                  <button
                    type="button"
                    key={`participant-chip-${pair.participantIndex}`}
                    className={`sadari__slot ${isActive ? "is-active" : ""}`}
                    onMouseEnter={() =>
                      setHovered({ type: "participant", index: pair.participantIndex })
                    }
                    ref={(element) => {
                      leftRefs.current[pair.participantIndex] = element;
                    }}
                  >
                    <span className="sadari__slot-index">{pair.participantIndex + 1}</span>
                    <span className="sadari__slot-label">{pair.participant}</span>
                  </button>
                );
              })}
            </div>

            <div className="sadari__ladder-spacer" aria-hidden />

            <div
              className="sadari__ladder-column sadari__ladder-column--right"
              onMouseLeave={() => setHovered(null)}
            >
              {resolvedOutcomes.map((label, index) => {
                const participantIndex = assignment.findIndex((value) => value === index);
                const isActive =
                  hovered === null ||
                  (hovered.type === "outcome" && hovered.index === index) ||
                  (hovered.type === "participant" && hovered.index === participantIndex);
                return (
                  <button
                    type="button"
                    key={`outcome-chip-${index}`}
                    className={`sadari__slot sadari__slot--outcome ${isActive ? "is-active" : ""}`}
                    onMouseEnter={() => setHovered({ type: "outcome", index })}
                    ref={(element) => {
                      rightRefs.current[index] = element;
                    }}
                  >
                    <span className="sadari__slot-index">{index + 1}</span>
                    <span className="sadari__slot-label">{label}</span>
                  </button>
                );
              })}
            </div>

            <svg
              className="sadari__ladder-overlay"
              width={svgSize.width}
              height={svgSize.height}
              viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
              role="presentation"
              style={{ width: `${svgSize.width}px`, height: `${svgSize.height}px` }}
            >
              {pairs.map((pair, index) => {
                const coords = pathLayout[index];
                const fallbackY1 = (pair.participantIndex + 0.5) * rowHeight;
                const fallbackY2 = (pair.outcomeIndex + 0.5) * rowHeight;
                const fallback = {
                  x1: svgSize.width * 0.22,
                  y1: fallbackY1,
                  x2: svgSize.width * 0.78,
                  y2: fallbackY2,
                };
                const { x1, y1, x2, y2 } = coords ?? fallback;
                const deltaX = x2 - x1;
                const controlStart = x1 + deltaX * 0.35;
                const controlEnd = x1 + deltaX * 0.65;
                const isActive =
                  hovered === null ||
                  (hovered.type === "participant" && hovered.index === pair.participantIndex) ||
                  (hovered.type === "outcome" && hovered.index === pair.outcomeIndex);
                const d = `M ${x1} ${y1} C ${controlStart} ${y1}, ${controlEnd} ${y2}, ${x2} ${y2}`;
                return (
                  <path
                    key={`link-${pair.participantIndex}-${pair.outcomeIndex}`}
                    className={`sadari__link ${isActive ? "sadari__link--active" : ""}`}
                    d={d}
                  />
                );
              })}
            </svg>
          </div>

          <div className="sadari__summary">
            <h3>최종 매칭표</h3>
            <ol>
              {outcomePerspective.map((item) => (
                <li key={`summary-${item.outcomeIndex}`}>
                  <strong>{item.label}</strong>
                  <span>{item.participantName}</span>
                </li>
              ))}
            </ol>
          </div>
        </article>
      </section>
    </main>
  );
}
