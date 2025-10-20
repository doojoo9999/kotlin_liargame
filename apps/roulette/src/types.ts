export type StageId = 'neon-arcade' | 'haunted-carnival' | 'starship-hangar';

export interface Participant {
  id: string;
  name: string;
  baseWeight: number;
  isActive: boolean;
  points: number;
  streak: number;
  colorHue: number;
}

export type EventEffectType = 'weight-multiplier' | 'ban' | 'score-bonus';

export type EventTarget =
  | 'random-active'
  | 'highest-weight'
  | 'lowest-weight'
  | 'everyone'
  | 'first-place';

export interface EventCard {
  id: string;
  title: string;
  description: string;
  type: EventEffectType;
  magnitude: number;
  target: EventTarget;
}

export interface StageDefinition {
  id: StageId;
  name: string;
  palette: {
    background: string;
    accent: string;
    text: string;
    muted: string;
  };
  subtitle: string;
  eventDeck: EventCard[];
}

export interface ResolvedEvent {
  card: EventCard;
  affectedParticipantIds: string[];
  summary: string;
  weightMultipliers?: Record<string, number>;
  bannedParticipantIds?: string[];
  scoreBonus?: {
    position: number; // 0 = first place
    amount: number;
  };
}

export interface WinnerResult {
  participantId: string;
  placement: number; // 0-index
  pointsEarned: number;
  streak: number;
}

