import type {EventCard, StageDefinition} from '../types';

const createEvent = (card: EventCard) => card;

const neonArcadeEvents: EventCard[] = [
  createEvent({
    id: 'spotlight-cut',
    title: '스포트라이트 오버히트',
    description: '조명 사고로 무대가 잠시 암전됩니다. 무작위 활성 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'crowd-burnout',
    title: '관객 피로',
    description: '관객 함성이 순식간에 잦아듭니다. 무작위 활성 참가자 1명이 휴식합니다.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'signal-jam',
    title: '신호 잡음',
    description: '네온 간판에서 날카로운 잡음이 폭주합니다. 무작위 활성 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'stage-reset',
    title: '무대 점검',
    description: '스태프가 급히 무대를 재정비합니다. 최저 티켓 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'lowest-weight',
  }),
];

const hauntedCarnivalEvents: EventCard[] = [
  createEvent({
    id: 'phantom-prank',
    title: '유령의 장난',
    description: '장난기 많은 유령이 무대 뒤편을 어지럽힙니다. 무작위 활성 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'lantern-snuff',
    title: '등불 소등',
    description: '등불이 스르르 꺼지며 긴장감이 돌기 시작합니다. 최저 티켓 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'lowest-weight',
  }),
  createEvent({
    id: 'cursed-carousel',
    title: '저주받은 회전목마',
    description: '회전목마에서 기묘한 기계음이 울려 퍼집니다. 무작위 활성 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'fog-wall',
    title: '짙은 안개',
    description: '짙은 안개가 공연장을 뒤덮습니다. 무작위 활성 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
];

const starshipHangarEvents: EventCard[] = [
  createEvent({
    id: 'burnout-drill',
    title: '엔진 점검',
    description: '엔진 점검 방송이 격납고 전역으로 울려 퍼집니다. 무작위 활성 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'gravity-lock',
    title: '중력 고정',
    description: '중력 제어 장치에서 경고등이 켜집니다. 무작위 활성 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
  createEvent({
    id: 'airlock-vent',
    title: '에어록 환기',
    description: '에어록이 열리며 거대한 바람이 몰아칩니다. 최저 티켓 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'lowest-weight',
  }),
  createEvent({
    id: 'command-ping',
    title: '지휘본부 호출',
    description: '지휘본부로부터 긴급 호출이 전달됩니다. 무작위 활성 참가자 1명이 제외됩니다.',
    type: 'ban',
    magnitude: 1,
    target: 'random-active',
  }),
];

export const STAGES: StageDefinition[] = [
  {
    id: 'classic-mode',
    name: '기본 모드',
    subtitle: '이벤트 없이 깔끔한 기본 테마.',
    palette: {
      background: '#0c101a',
      accent: '#9aa4ff',
      text: '#f5f7ff',
      muted: '#1f2535',
    },
    eventDeck: [],
  },
  {
    id: 'neon-arcade',
    name: '네온 아케이드',
    subtitle: '레이저와 신시사이저가 넘치는 화려한 무대.',
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
    name: '유령 축제',
    subtitle: '장난기 많은 망령이 가득한 야간 축제.',
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
    name: '스타쉽 격납고',
    subtitle: '발사 카운트다운과 엔진 불빛이 어우러진 현장.',
    palette: {
      background: '#05121d',
      accent: '#21d0ff',
      text: '#f4fdff',
      muted: '#16384a',
    },
    eventDeck: starshipHangarEvents,
  },
];
