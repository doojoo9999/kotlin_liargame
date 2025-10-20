import {CSSProperties, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ParticipantPanel} from './components/ParticipantPanel';
import {StageSelector} from './components/StageSelector';
import {EventBoard} from './components/EventBoard';
import {RouletteWheel} from './components/RouletteWheel';
import {Scoreboard} from './components/Scoreboard';
import {ResultsPanel} from './components/ResultsPanel';
import {STAGES} from './data/stages';
import {Participant, ResolvedEvent, StageDefinition, StageId, WinnerResult} from './types';
import {hydrateParticipants, parseParticipantInput} from './utils/participants';
import {resolveEvent} from './utils/events';
import {buildWheelSegments, findSegment} from './utils/wheel';
import {weightedRandom} from './utils/random';
import {applySpinResults} from './utils/scoring';
import './App.css';

const DEFAULT_STAGE_ID: StageId = 'neon-arcade';
const SPIN_DURATION_MS = 5800;
const EVENTS_PER_ROUND = 2;

const hasActiveParticipants = (participants: Participant[]) =>
  participants.some((participant) => participant.isActive);

function pickStage(stageId: StageId): StageDefinition {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0];
}

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stageId, setStageId] = useState<StageId>(DEFAULT_STAGE_ID);
  const [events, setEvents] = useState<ResolvedEvent[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastResults, setLastResults] = useState<WinnerResult[]>([]);
  const [previousFirstWinnerId, setPreviousFirstWinnerId] = useState<string | null>(null);
  const [overlayMode, setOverlayMode] = useState(false);
  const [roundCount, setRoundCount] = useState(1);
  const spinTimeoutRef = useRef<number | null>(null);

  const stage = useMemo(() => pickStage(stageId), [stageId]);

  useEffect(() => () => {
    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
    }
  }, []);

  const refreshEvents = useCallback((count = EVENTS_PER_ROUND) => {
    if (!hasActiveParticipants(participants)) {
      setEvents([]);
      return;
    }

    const drawn: ResolvedEvent[] = [];
    const usedIds = new Set<string>();
    const deck = stage.eventDeck;
    let guard = 0;

    while (drawn.length < count && guard < 32) {
      guard += 1;
      const card = deck[Math.floor(Math.random() * deck.length)];
      if (!card) break;
      if (deck.length >= count && usedIds.has(card.id)) continue;
      const resolved = resolveEvent(card, participants);
      if (!resolved) continue;
      drawn.push(resolved);
      usedIds.add(card.id);
    }

    setEvents(drawn);
  }, [participants, stage]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const handleReplaceParticipants = (text: string) => {
    const parsed = parseParticipantInput(text);
    const hydrated = hydrateParticipants(parsed);
    setParticipants(hydrated);
    setEvents([]);
    setLastResults([]);
    setPreviousFirstWinnerId(null);
    setRotation(0);
    setRoundCount(1);
  };

  const handleUpdateParticipant = (
    participantId: string,
    updates: Partial<Pick<Participant, 'baseWeight' | 'isActive'>>,
  ) => {
    setParticipants((prev) =>
      prev.map((participant) =>
        participant.id === participantId ? { ...participant, ...updates } : participant,
      ),
    );
  };

  const handleRemoveParticipant = (participantId: string) => {
    setParticipants((prev) => prev.filter((participant) => participant.id !== participantId));
  };

  const handleResetScores = () => {
    setParticipants((prev) =>
      prev.map((participant) => ({ ...participant, points: 0, streak: 0 })),
    );
    setLastResults([]);
    setPreviousFirstWinnerId(null);
    setRoundCount(1);
  };

  const handleRerollEvent = (index: number) => {
    if (isSpinning) return;
    setEvents((prev) => {
      if (!prev[index]) return prev;
      const pool = stage.eventDeck.filter((card) => card.id !== prev[index].card.id);
      const source = pool.length ? pool : stage.eventDeck;
      if (!source.length) return prev;
      const card = source[Math.floor(Math.random() * source.length)];
      const resolved = resolveEvent(card, participants);
      if (!resolved) return prev;
      const next = [...prev];
      next[index] = resolved;
      return next;
    });
  };

  const handleRefreshEvents = () => {
    if (isSpinning) return;
    refreshEvents();
  };

  const handleSpin = () => {
    if (isSpinning) return;

    const { segments } = buildWheelSegments(participants, events);
    if (!segments.length) return;

    const podiumSize = Math.min(3, segments.length);
    const pool = [...segments];
    const winners: Participant[] = [];

    for (let placement = 0; placement < podiumSize; placement += 1) {
      const pick = weightedRandom(
        pool.map((segment) => ({ item: segment.participant, weight: segment.weight })),
      );
      if (!pick) break;
      winners.push(pick);
      const index = pool.findIndex((segment) => segment.participant.id === pick.id);
      if (index >= 0) {
        pool.splice(index, 1);
      }
    }

    if (!winners.length) return;

    const winningSegment = findSegment(segments, winners[0].id);
    const centerAngle = winningSegment
      ? (winningSegment.startAngle + winningSegment.endAngle) / 2
      : 0;

    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const targetRotation = rotation + 360 * 5 + (360 - centerAngle) - normalizedRotation;

    const scoreboardUpdate = applySpinResults({
      participants,
      winners,
      events,
      previousFirstWinnerId,
    });

    setIsSpinning(true);
    setRotation(targetRotation);

    spinTimeoutRef.current = window.setTimeout(() => {
      setParticipants(scoreboardUpdate.updatedParticipants);
      setPreviousFirstWinnerId(scoreboardUpdate.nextFirstWinnerId);
      setLastResults(scoreboardUpdate.breakdown);
      setRoundCount((count) => count + 1);
      setIsSpinning(false);
      refreshEvents();
    }, SPIN_DURATION_MS);
  };

  const overlayToggleLabel = overlayMode ? 'Exit Overlay' : 'Overlay Mode';

  const themeStyle: CSSProperties = {
    '--bg-color': stage.palette.background,
    '--accent-color': stage.palette.accent,
    '--text-color': stage.palette.text,
    '--muted-color': stage.palette.muted,
  };

  const { segments } = useMemo(() => buildWheelSegments(participants, events), [participants, events]);
  const eventSummaries = events.map((event) => event.summary);

  return (
    <div className={`app-shell ${overlayMode ? 'overlay-mode' : ''}`} style={themeStyle}>
      <header className="app-header">
        <div>
          <h1>Party Roulette</h1>
          <p>Interactive roulette with stage events & progression.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn ghost" onClick={() => setOverlayMode((prev) => !prev)}>
            {overlayToggleLabel}
          </button>
        </div>
      </header>

      <main className="app-grid">
        <div className="column column--left">
          <StageSelector stages={STAGES} activeStageId={stageId} onChange={setStageId} />
          <EventBoard
            stage={stage}
            events={events}
            onReroll={handleRerollEvent}
            onRefresh={handleRefreshEvents}
            disabled={isSpinning}
          />
        </div>

        <div className="column column--center">
          <RouletteWheel
            stage={stage}
            segments={segments}
            rotation={rotation}
            isSpinning={isSpinning}
            onSpin={handleSpin}
            disabled={isSpinning || !segments.length}
            eventSummaries={eventSummaries}
          />
          <ResultsPanel participants={participants} results={lastResults} />
        </div>

        <div className="column column--right">
          <ParticipantPanel
            participants={participants}
            onReplaceParticipants={handleReplaceParticipants}
            onUpdateParticipant={handleUpdateParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onResetScores={handleResetScores}
          />
          <Scoreboard participants={participants} lastResults={lastResults} roundCount={roundCount} />
        </div>
      </main>
    </div>
  );
}
