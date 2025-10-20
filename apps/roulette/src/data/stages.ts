import {EventCard, StageDefinition} from '../types';

const createEvent = (card: EventCard) => card;

const neonArcadeEvents: EventCard[] = [
  createEvent({
    id: 'lucky-boost',
    title: 'Lucky Boost',
    description: 'Random contender gets +40% weight this round.',
    type: 'weight-multiplier',
    magnitude: 1.4,
    target: 'random-active',
  }),
  createEvent({
    id: 'system-overload',
    title: 'System Overload',
    description: 'Random contender is locked out for a spin.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'crowd-favorite',
    title: 'Crowd Favorite',
    description: 'Heaviest contender gains +25% extra weight.',
    type: 'weight-multiplier',
    magnitude: 1.25,
    target: 'highest-weight',
  }),
  createEvent({
    id: 'hype-train',
    title: 'Hype Train',
    description: 'First place earns +2 bonus points.',
    type: 'score-bonus',
    magnitude: 2,
    target: 'first-place',
  }),
];

const hauntedCarnivalEvents: EventCard[] = [
  createEvent({
    id: 'ghostly-touch',
    title: 'Ghostly Touch',
    description: 'Random contender loses 30% weight.',
    type: 'weight-multiplier',
    magnitude: 0.7,
    target: 'random-active',
  }),
  createEvent({
    id: 'lanterns-glow',
    title: 'Lantern’s Glow',
    description: 'Lightest contender surges with +60% weight.',
    type: 'weight-multiplier',
    magnitude: 1.6,
    target: 'lowest-weight',
  }),
  createEvent({
    id: 'cursed-gate',
    title: 'Cursed Gate',
    description: 'Random contender is banished for this round.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'spirit-audience',
    title: 'Spirit Audience',
    description: 'Everyone gains 10% weight — chaos!',
    type: 'weight-multiplier',
    magnitude: 1.1,
    target: 'everyone',
  }),
];

const starshipHangarEvents: EventCard[] = [
  createEvent({
    id: 'afterburner',
    title: 'Afterburner',
    description: 'Random contender fires boosters (+50% weight).',
    type: 'weight-multiplier',
    magnitude: 1.5,
    target: 'random-active',
  }),
  createEvent({
    id: 'gravity-well',
    title: 'Gravity Well',
    description: 'Random contender caught in gravity (-35% weight).',
    type: 'weight-multiplier',
    magnitude: 0.65,
    target: 'random-active',
  }),
  createEvent({
    id: 'command-recall',
    title: 'Command Recall',
    description: 'Mission control removes a random contender.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'mission-commendation',
    title: 'Mission Commendation',
    description: 'First place collects +3 bonus points.',
    type: 'score-bonus',
    magnitude: 3,
    target: 'first-place',
  }),
];

export const STAGES: StageDefinition[] = [
  {
    id: 'neon-arcade',
    name: 'Neon Arcade',
    subtitle: 'Synth beams & crowd hype.',
    palette: {
      background: '#0b1026',
      accent: '#ff2d7a',
      text: '#f8f9ff',
      muted: '#2b3355',
    },
    eventDeck: neonArcadeEvents,
  },
  {
    id: 'haunted-carnival',
    name: 'Haunted Carnival',
    subtitle: 'Fog machines & mischievous spirits.',
    palette: {
      background: '#151016',
      accent: '#ff7a18',
      text: '#faf5ff',
      muted: '#35243a',
    },
    eventDeck: hauntedCarnivalEvents,
  },
  {
    id: 'starship-hangar',
    name: 'Starship Hangar',
    subtitle: 'Launch countdowns & neon thrusters.',
    palette: {
      background: '#05121d',
      accent: '#21d0ff',
      text: '#f4fdff',
      muted: '#16384a',
    },
    eventDeck: starshipHangarEvents,
  },
];

