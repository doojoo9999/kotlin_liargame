export type StageId = 'classic-mode' | 'neon-arcade' | 'haunted-carnival' | 'starship-hangar';

export interface Participant {
  id: string;
  name: string;
  entryCount: number;
  isActive: boolean;
  colorHue: number;
}

export type EventEffectType = 'ban';

export type EventTarget =
  | 'random-active'
  | 'lowest-weight'
  | 'everyone';

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
  bannedParticipantIds?: string[];
}
