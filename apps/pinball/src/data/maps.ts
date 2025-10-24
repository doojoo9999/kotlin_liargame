import type {MapDefinition} from '../types'

export const MAPS: MapDefinition[] = [
  {
    id: 'neon-plaza',
    name: '네온 광장',
    description: '균형 잡힌 기본 맵. 완만한 중력과 고르게 배치된 핀들이 특징입니다.',
    difficulty: 'casual',
    background: {
      gradientFrom: '#1e293b',
      gradientTo: '#0f172a',
      accent: '#6366f1',
    },
    size: {
      width: 520,
      height: 780,
    },
    gravityScale: 0.96,
    spawnSlots: [0.18, 0.36, 0.54, 0.72, 0.9],
    drainY: 720,
    obstacles: [
      // First layer
      ...Array.from({length: 7}).map((_, index) => ({
        type: 'peg' as const,
        x: 80 + index * 60,
        y: 160,
        radius: 12,
        restitution: 0.8,
      })),
      // Second layer offset
      ...Array.from({length: 6}).map((_, index) => ({
        type: 'peg' as const,
        x: 110 + index * 60,
        y: 240,
        radius: 12,
        restitution: 0.8,
      })),
      // Third layer with bumpers
      ...Array.from({length: 5}).map((_, index) => ({
        type: 'bumper' as const,
        x: 140 + index * 60,
        y: 340,
        radius: 18,
        restitution: 1.35,
        impulseScale: 0.015,
      })),
      // Diagonal walls to funnel
      {
        type: 'wall',
        x: 120,
        y: 520,
        width: 160,
        height: 12,
        angle: -0.45,
      },
      {
        type: 'wall',
        x: 400,
        y: 520,
        width: 160,
        height: 12,
        angle: 0.45,
      },
      // Lower pegs
      ...Array.from({length: 4}).map((_, index) => ({
        type: 'peg' as const,
        x: 160 + index * 70,
        y: 460,
        radius: 14,
        restitution: 0.9,
      })),
      ...Array.from({length: 3}).map((_, index) => ({
        type: 'peg' as const,
        x: 190 + index * 70,
        y: 540,
        radius: 14,
        restitution: 0.9,
      })),
    ],
  },
  {
    id: 'cascade-labyrinth',
    name: '카스케이드 미궁',
    description: '사선 통로와 다단계 드릴이 있는 중급 난이도 맵. 속도 조절이 중요합니다.',
    difficulty: 'standard',
    background: {
      gradientFrom: '#0f172a',
      gradientTo: '#1e1b4b',
      accent: '#22d3ee',
    },
    size: {
      width: 560,
      height: 820,
    },
    gravityScale: 1.08,
    spawnSlots: [0.16, 0.32, 0.48, 0.64, 0.8],
    drainY: 760,
    obstacles: [
      // Upper funnel walls
      {
        type: 'wall',
        x: 140,
        y: 150,
        width: 200,
        height: 12,
        angle: -0.58,
      },
      {
        type: 'wall',
        x: 420,
        y: 150,
        width: 200,
        height: 12,
        angle: 0.58,
      },
      // Mid horizontal gates
      {
        type: 'wall',
        x: 280,
        y: 280,
        width: 280,
        height: 10,
      },
      {
        type: 'wall',
        x: 280,
        y: 440,
        width: 280,
        height: 10,
      },
      // Peg grids
      ...Array.from({length: 4}).flatMap((_, row) =>
        Array.from({length: 5}).map((__, col) => ({
          type: 'peg' as const,
          x: 120 + col * 90,
          y: 320 + row * 80,
          radius: row % 2 === 0 ? 15 : 18,
          restitution: row % 2 === 0 ? 0.9 : 1.05,
        })),
      ),
      // Spiral bumper cluster
      {
        type: 'bumper',
        x: 200,
        y: 580,
        radius: 22,
        restitution: 1.6,
        impulseScale: 0.02,
      },
      {
        type: 'bumper',
        x: 360,
        y: 620,
        radius: 22,
        restitution: 1.6,
        impulseScale: 0.02,
      },
      {
        type: 'peg',
        x: 280,
        y: 660,
        radius: 16,
        restitution: 1.1,
      },
      {
        type: 'peg',
        x: 280,
        y: 720,
        radius: 18,
        restitution: 1.05,
      },
    ],
  },
  {
    id: 'quantum-wilds',
    name: '퀀텀 와일즈',
    description: '높은 중력과 가속 패드가 어우러진 하드 난이도 맵. 극적인 역전이 발생합니다.',
    difficulty: 'chaos',
    background: {
      gradientFrom: '#111827',
      gradientTo: '#0b1120',
      accent: '#f97316',
    },
    size: {
      width: 540,
      height: 840,
    },
    gravityScale: 1.24,
    spawnSlots: [0.12, 0.27, 0.42, 0.57, 0.72, 0.87],
    drainY: 796,
    obstacles: [
      // Vertical rails
      {
        type: 'wall',
        x: 140,
        y: 220,
        width: 16,
        height: 200,
      },
      {
        type: 'wall',
        x: 400,
        y: 220,
        width: 16,
        height: 200,
      },
      // Slanted launchers
      {
        type: 'wall',
        x: 240,
        y: 200,
        width: 200,
        height: 14,
        angle: -0.78,
        restitution: 1.05,
      },
      {
        type: 'wall',
        x: 300,
        y: 200,
        width: 200,
        height: 14,
        angle: 0.78,
        restitution: 1.05,
      },
      // Bumper vortex
      ...Array.from({length: 8}).map((_, index) => {
        const angle = (index / 8) * Math.PI * 2
        const radius = 150
        return {
          type: 'bumper' as const,
          x: 270 + Math.cos(angle) * radius,
          y: 440 + Math.sin(angle) * radius * 0.6,
          radius: 20,
          restitution: 1.75,
          impulseScale: 0.03,
        }
      }),
      // Lower chaos pegs
      ...Array.from({length: 4}).flatMap((_, row) =>
        Array.from({length: 4}).map((__, col) => ({
          type: 'peg' as const,
          x: 140 + col * 90 + (row % 2 === 0 ? 40 : 0),
          y: 580 + row * 60,
          radius: 16,
          restitution: 1.2,
        })),
      ),
      // Lower walls to bounce
      {
        type: 'wall',
        x: 120,
        y: 720,
        width: 140,
        height: 12,
        angle: -0.4,
        restitution: 1.1,
      },
      {
        type: 'wall',
        x: 420,
        y: 720,
        width: 140,
        height: 12,
        angle: 0.4,
        restitution: 1.1,
      },
    ],
  },
]
