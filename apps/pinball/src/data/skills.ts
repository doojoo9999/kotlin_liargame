import type {SkillCard, SkillContext} from '../types'
import {buildResolvedSkillId} from '../utils/skills'

const pickRandomParticipantId = (context: SkillContext): string | null => {
  const population = context.participants.filter((participant) => participant.isActive)
  if (!population.length) return null
  const index = Math.floor(Math.random() * population.length)
  return population[index]?.id ?? null
}

export const SKILL_DECK: SkillCard[] = [
  {
    id: 'shield-charm',
    name: '세컨드 챤스',
    summary: '지정 참가자는 초기 낙하 한 번을 무시합니다.',
    type: 'participant',
    rarity: 'common',
    description:
      '무작위 참가자에게 보호막을 부여합니다. 보호막이 있는 공이 낙하하면 다시 위쪽에서 재시작합니다.',
    apply: (context) => {
      const targetId = pickRandomParticipantId(context)
      if (!targetId) return null

      const id = buildResolvedSkillId('shield-charm', targetId)
      return {
        id,
        name: '세컨드 챤스',
        summary: '보호막이 한 번의 낙하를 막아줍니다.',
        description: '해당 참가자의 첫 낙하가 취소되고 공은 다시 상단으로 소환됩니다.',
        rarity: 'common',
        type: 'participant',
        targetParticipantId: targetId,
        hooks: {
          setupBall: (_ball, state, helpers) => {
            if (state.participantId !== targetId) return
            state.hasShield = true
            state.shieldConsumed = false
            void helpers
          },
        },
      }
    },
  },
  {
    id: 'lunar-light',
    name: '루나 라이트',
    summary: '가벼운 중력과 공기 저항 감소',
    type: 'global',
    rarity: 'common',
    description: '전체 중력을 낮추고 모든 공의 공기 저항을 약하게 조정합니다.',
    apply: () => {
      const id = buildResolvedSkillId('lunar-light')
      return {
        id,
        name: '루나 라이트',
        summary: '전체 중력이 20% 감소합니다.',
        description: '낙하 속도가 줄어들어 더 많은 충돌과 변수가 발생합니다.',
        rarity: 'common',
        type: 'global',
        hooks: {
          setupWorld: (engine) => {
            engine.gravity.y *= 0.8
          },
          setupBall: (_ball, state) => {
            state.body.frictionAir *= 0.6
          },
        },
      }
    },
  },
  {
    id: 'meteor-core',
    name: '메테오 코어',
    summary: '무거운 코어',
    type: 'participant',
    rarity: 'common',
    description: '무작위 참가자의 공이 무거워져 직선 낙하를 유도합니다.',
    apply: (context) => {
      const targetId = pickRandomParticipantId(context)
      if (!targetId) return null
      const id = buildResolvedSkillId('meteor-core', targetId)
      return {
        id,
        name: '메테오 코어',
        summary: '해당 참가자의 공이 더 무거워집니다.',
        description: '밀도와 관성이 증가해 튕김 대신 돌파력에 의존합니다.',
        rarity: 'common',
        type: 'participant',
        targetParticipantId: targetId,
        hooks: {
          setupBall: (ball, state) => {
            if (state.participantId !== targetId) return
            ball.density *= 1.5
            ball.restitution *= 0.85
          },
        },
      }
    },
  },
  {
    id: 'quantum-wind',
    name: '퀀텀 윈드',
    summary: '좌우로 흔들리는 사이드 바람',
    type: 'global',
    rarity: 'rare',
    description:
      '전체 라운드 동안 좌우로 진동하는 바람이 분다. 공이 예측 불가능한 움직임을 보입니다.',
    apply: () => {
      const id = buildResolvedSkillId('quantum-wind')
      let direction = 1
      let time = 0
      return {
        id,
        name: '퀀텀 윈드',
        summary: '진동하는 바람이 공을 좌우로 밀어냅니다.',
        description: '매 틱마다 약한 수평 힘이 가해집니다.',
        rarity: 'rare',
        type: 'global',
        hooks: {
          onTick: (_engine, balls, delta, helpers) => {
            time += delta
            if (time > 1200) {
              time = 0
              direction *= -1
            }
            const forceMagnitude = 0.0008 * direction
            balls.forEach((state) => {
              helpers.addImpulse(state, {x: forceMagnitude, y: 0})
            })
          },
        },
      }
    },
  },
  {
    id: 'starlit-bounce',
    name: '스타라이트 바운스',
    summary: '강력한 반동력',
    type: 'participant',
    rarity: 'rare',
    description: '무작위 참가자의 공이 더욱 탄력있게 반사됩니다.',
    apply: (context) => {
      const targetId = pickRandomParticipantId(context)
      if (!targetId) return null
      const id = buildResolvedSkillId('starlit-bounce', targetId)
      return {
        id,
        name: '스타라이트 바운스',
        summary: '해당 참가자의 공 반동력이 35% 상승합니다.',
        description: '회전과 탄력을 동시에 높여 극적인 리바운드를 유도합니다.',
        rarity: 'rare',
        type: 'participant',
        targetParticipantId: targetId,
        hooks: {
          setupBall: (ball, state) => {
            if (state.participantId !== targetId) return
            ball.restitution *= 1.35
            ball.friction *= 0.7
          },
        },
      }
    },
  },
]
