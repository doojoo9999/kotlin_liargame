import type {CSSProperties} from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ParticipantPanel} from './components/ParticipantPanel';
import {StageSelector} from './components/StageSelector';
import {EventBoard} from './components/EventBoard';
import {RouletteWheel} from './components/RouletteWheel';
import {ResultsPanel} from './components/ResultsPanel';
import {STAGES} from './data/stages';
import type {Participant, ResolvedEvent, StageDefinition, StageId} from './types';
import {parseParticipantInput} from './utils/participants';
import {combineEffects, resolveEvent} from './utils/events';
import {buildWheelSegments, findSegment} from './utils/wheel';
import {weightedRandom} from './utils/random';
import './App.css';

const DEFAULT_STAGE_ID: StageId = 'neon-arcade';
const SPIN_DURATION_MS = 5800;
const EVENTS_PER_ROUND = 2;

const hasActiveParticipants = (participants: Participant[]) =>
  participants.some((participant) => participant.isActive);

const normalizeParticipantColors = (list: Participant[]): Participant[] =>
  list.map((participant, index, array) => {
    if (!array.length) return participant;
    const hue = (index / array.length) * 360;
    return {
      ...participant,
      colorHue: hue % 360,
    };
  });

function pickStage(stageId: StageId): StageDefinition {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0];
}

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stageId, setStageId] = useState<StageId>(DEFAULT_STAGE_ID);
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [events, setEvents] = useState<ResolvedEvent[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastWinnerId, setLastWinnerId] = useState<string | null>(null);
  const [overlayMode, setOverlayMode] = useState(false);
  const spinTimeoutRef = useRef<number | null>(null);

  const stage = useMemo(() => pickStage(stageId), [stageId]);
  const bannedIds = useMemo(
    () => (eventsEnabled ? combineEffects(events).bannedIds : new Set<string>()),
    [eventsEnabled, events],
  );
  const eligibleParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          participant.isActive &&
          participant.entryCount > 0 &&
          !bannedIds.has(participant.id),
      ),
    [participants, bannedIds],
  );

  useEffect(() => () => {
    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
    }
  }, []);

  const updateParticipants = useCallback(
    (updater: (prev: Participant[]) => Participant[]) => {
      setParticipants((prev) => {
        return normalizeParticipantColors(updater(prev));
      });
    },
    [],
  );

  useEffect(() => {
    (window as any).__participantsList = participants;
  }, [participants]);

  const refreshEvents = useCallback((count = EVENTS_PER_ROUND) => {
    if (!eventsEnabled) {
      setEvents([]);
      return;
    }

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
  }, [eventsEnabled, participants, stage]);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const handleAddParticipants = useCallback(
    (text: string) => {
      const parsed = parseParticipantInput(text);
      if (!parsed.length) return;

      updateParticipants((prev) => {
        const merged = [...prev];
        parsed.forEach(({name, count}) => {
          const index = merged.findIndex((participant) => participant.name === name);
          if (index >= 0) {
            const existing = merged[index];
            merged[index] = {
              ...existing,
              entryCount: existing.entryCount + count,
              isActive: true,
            };
          } else {
            merged.push({
              id: crypto.randomUUID(),
              name,
              entryCount: count,
              isActive: true,
              colorHue: 0,
            });
          }
        });
        return merged;
      });
    },
    [updateParticipants],
  );

  const handleUpdateParticipant = (
    participantId: string,
    updates: Partial<Pick<Participant, 'entryCount' | 'isActive'>>,
  ) => {
    const nextUpdates = { ...updates };
    if (typeof nextUpdates.entryCount === 'number') {
      nextUpdates.entryCount = Math.max(1, Math.round(nextUpdates.entryCount));
    }
    updateParticipants((prev) =>
      prev.map((participant) =>
        participant.id === participantId ? { ...participant, ...nextUpdates } : participant,
      ),
    );
  };

  const handleRemoveParticipant = (participantId: string) => {
    updateParticipants((prev) => prev.filter((participant) => participant.id !== participantId));
  };

  const handleClearParticipants = () => {
    updateParticipants(() => []);
    setEvents([]);
    setLastWinnerId(null);
    setRotation(0);
  };

  const handleRerollEvent = (index: number) => {
    if (isSpinning) return;
    if (!eventsEnabled) return;
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
    if (!eventsEnabled) return;
    refreshEvents();
  };

  const handleToggleEvents = () => {
    if (isSpinning) return;
    setEventsEnabled((prev) => !prev);
  };

  const handleSpin = () => {
    if (isSpinning) return;

    const segments = buildWheelSegments(eligibleParticipants);
    if (!segments.length) return;

    const winner = weightedRandom(
      segments.map((segment) => ({ item: segment.participant, weight: segment.weight })),
    );
    if (!winner) return;

    const winningSegment = findSegment(segments, winner.id);
    const centerAngle = winningSegment
      ? (winningSegment.startAngle + winningSegment.endAngle) / 2
      : 0;

    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const targetRotation = rotation + 360 * 5 + (360 - centerAngle) - normalizedRotation;

    setIsSpinning(true);
    setRotation(targetRotation);

    spinTimeoutRef.current = window.setTimeout(() => {
      setLastWinnerId(winner.id);
      setIsSpinning(false);
      refreshEvents();
    }, SPIN_DURATION_MS);
  };

  const overlayToggleLabel = overlayMode ? '오버레이 종료' : '오버레이 모드';

  const themeStyle = {
    '--bg-color': stage.palette.background,
    '--accent-color': stage.palette.accent,
    '--text-color': stage.palette.text,
    '--muted-color': stage.palette.muted,
  } as CSSProperties;

  const eventSummaries = eventsEnabled ? events.map((event) => event.summary) : [];

  return (
    <div className={`app-shell ${overlayMode ? 'overlay-mode' : ''}`} style={themeStyle}>
      <header className="app-header">
        <div>
          <h1>파티 룰렛</h1>
          <p>한 번의 스핀으로 우승자를 즉시 정하세요.</p>
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
            eventsEnabled={eventsEnabled}
            onReroll={handleRerollEvent}
            onRefresh={handleRefreshEvents}
            onToggleEvents={handleToggleEvents}
            disabled={isSpinning}
          />
        </div>

        <div className="column column--center">
          <RouletteWheel
            stage={stage}
            participants={eligibleParticipants}
            rotation={rotation}
            isSpinning={isSpinning}
            onSpin={handleSpin}
            disabled={isSpinning || eligibleParticipants.length === 0}
            eventSummaries={eventSummaries}
          />
          <ResultsPanel participants={participants} winnerId={lastWinnerId} />
        </div>

        <div className="column column--right">
          <ParticipantPanel
            participants={participants}
            onAddEntries={handleAddParticipants}
            onUpdateParticipant={handleUpdateParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onClearParticipants={handleClearParticipants}
          />
        </div>
      </main>
    </div>
  );
}
