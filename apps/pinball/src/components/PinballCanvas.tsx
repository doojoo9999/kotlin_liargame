import {useEffect, useRef} from 'react'
import type {IEventCollision} from 'matter-js'
import {Bodies, Body, Composite, Engine, Events, Vector, World} from 'matter-js'
import type {
    BallState,
    EliminationEvent,
    MapDefinition,
    Participant,
    ResolvedSkill,
    SimulationResult,
    SkillHelpers,
    WinCondition,
} from '../types'
import {participantColor, participantOutline} from '../utils/colors'

const BALL_RADIUS = 14
const FRAME_INTERVAL = 1000 / 60

interface PinballCanvasProps {
  map: MapDefinition
  participants: Participant[]
  winCondition: WinCondition
  skills: ResolvedSkill[]
  runKey: number
  onElimination: (event: EliminationEvent) => void
  onComplete: (result: SimulationResult) => void
}

const createHelpers = () => {
  const helpers: SkillHelpers = {
    resetBallPosition: (state) => {
      const jitter = (Math.random() - 0.5) * 40
      Body.setPosition(state.body, {x: state.spawnX + jitter, y: 60})
      Body.setVelocity(state.body, {x: 0, y: 0})
      Body.setAngularVelocity(state.body, 0)
      Body.setAngle(state.body, 0)
    },
    addImpulse: (state, force) => {
      Body.applyForce(state.body, state.body.position, force)
    },
  }
  return helpers
}

const drawBackground = (
  ctx: CanvasRenderingContext2D,
  map: MapDefinition,
  deviceRatio: number,
) => {
  const {width, height} = map.size
  const gradient = ctx.createLinearGradient(0, 0, width * deviceRatio, height * deviceRatio)
  gradient.addColorStop(0, map.background.gradientFrom)
  gradient.addColorStop(1, map.background.gradientTo)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width * deviceRatio, height * deviceRatio)
}

const drawObstacles = (
  ctx: CanvasRenderingContext2D,
  map: MapDefinition,
  deviceRatio: number,
) => {
  ctx.save()
  ctx.scale(deviceRatio, deviceRatio)
  map.obstacles.forEach((obstacle) => {
    switch (obstacle.type) {
      case 'wall': {
        ctx.save()
        ctx.translate(obstacle.x, obstacle.y)
        ctx.rotate(obstacle.angle ?? 0)
        ctx.fillStyle = 'rgba(148, 163, 184, 0.28)'
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.rect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height)
        ctx.fill()
        ctx.stroke()
        ctx.restore()
        break
      }
      case 'peg': {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.55)'
        ctx.beginPath()
        ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'bumper': {
        const radial = ctx.createRadialGradient(
          obstacle.x,
          obstacle.y,
          obstacle.radius * 0.2,
          obstacle.x,
          obstacle.y,
          obstacle.radius,
        )
        radial.addColorStop(0, 'rgba(248, 250, 252, 0.85)')
        radial.addColorStop(1, 'rgba(59, 130, 246, 0.45)')
        ctx.fillStyle = radial
        ctx.beginPath()
        ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      default:
        break
    }
  })
  ctx.restore()
}

const drawDrain = (
  ctx: CanvasRenderingContext2D,
  map: MapDefinition,
  deviceRatio: number,
) => {
  ctx.save()
  ctx.scale(deviceRatio, deviceRatio)
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)'
  ctx.setLineDash([12, 10])
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(0, map.drainY)
  ctx.lineTo(map.size.width, map.drainY)
  ctx.stroke()
  ctx.restore()
}

export function PinballCanvas({
  map,
  participants,
  winCondition,
  skills,
  runKey,
  onElimination,
  onComplete,
}: PinballCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderStaticBoard = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const deviceRatio = window.devicePixelRatio || 1
      canvas.width = map.size.width * deviceRatio
      canvas.height = map.size.height * deviceRatio
      canvas.style.width = `${map.size.width}px`
      canvas.style.height = `${map.size.height}px`
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBackground(ctx, map, deviceRatio)
      drawObstacles(ctx, map, deviceRatio)
      drawDrain(ctx, map, deviceRatio)
    }

    const totalEntries = participants
      .filter((participant) => participant.isActive)
      .reduce((sum, participant) => sum + Math.max(0, participant.entryCount), 0)

    if (!totalEntries || runKey === 0) {
      renderStaticBoard()
      return
    }

    const engine = Engine.create({
      enableSleeping: false,
    })
    engine.gravity.y = map.gravityScale
    engine.gravity.x = 0

    const world = engine.world
    world.gravity.y = map.gravityScale
    world.gravity.x = 0

    const deviceRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = map.size.width * deviceRatio
    canvas.height = map.size.height * deviceRatio
    canvas.style.width = `${map.size.width}px`
    canvas.style.height = `${map.size.height}px`

    const context = canvas.getContext('2d')
    if (!context) return

    const helpers = createHelpers()

    const staticBodies: Body[] = []
    const bumperImpulse = new Map<number, number>()

    const wallThickness = 60
    const floor = Bodies.rectangle(
      map.size.width / 2,
      map.size.height + wallThickness / 2,
      map.size.width,
      wallThickness,
      {isStatic: true, label: 'floor'},
    )
    const leftWall = Bodies.rectangle(
      -wallThickness / 2,
      map.size.height / 2,
      wallThickness,
      map.size.height,
      {isStatic: true, label: 'wall-left'},
    )
    const rightWall = Bodies.rectangle(
      map.size.width + wallThickness / 2,
      map.size.height / 2,
      wallThickness,
      map.size.height,
      {isStatic: true, label: 'wall-right'},
    )
    const drainSensor = Bodies.rectangle(
      map.size.width / 2,
      map.drainY + 10,
      map.size.width + 40,
      20,
      {
        isStatic: true,
        isSensor: true,
        label: 'drain-sensor',
      },
    )

    staticBodies.push(floor, leftWall, rightWall, drainSensor)

    map.obstacles.forEach((obstacle, index) => {
      if (obstacle.type === 'wall') {
        const wall = Bodies.rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height, {
          isStatic: true,
          angle: obstacle.angle ?? 0,
          label: 'wall-obstacle',
          restitution: obstacle.restitution ?? 0.8,
          friction: 0.3,
        })
        staticBodies.push(wall)
      } else if (obstacle.type === 'peg') {
        const peg = Bodies.circle(obstacle.x, obstacle.y, obstacle.radius, {
          isStatic: true,
          label: 'peg',
          restitution: obstacle.restitution ?? 0.9,
        })
        staticBodies.push(peg)
      } else if (obstacle.type === 'bumper') {
        const bumper = Bodies.circle(obstacle.x, obstacle.y, obstacle.radius, {
          isStatic: true,
          label: `bumper-${index}`,
          restitution: obstacle.restitution,
        })
        bumperImpulse.set(bumper.id, obstacle.impulseScale)
        staticBodies.push(bumper)
      }
    })

    Composite.add(world, staticBodies)

    const activeParticipants = participants.filter(
      (participant) => participant.isActive && participant.entryCount > 0,
    )

    const slotCount = map.spawnSlots.length || Math.max(activeParticipants.length, 1)
    let slotCursor = 0

    const balls: BallState[] = []
    let eliminationOrder = 0
    const eliminationLog: EliminationEvent[] = []
    let completed = false

    const createBallState = (participantId: string, spawnIndex: number) => {
      const spawnRatio = map.spawnSlots[spawnIndex % slotCount] ?? (spawnIndex + 1) / (slotCount + 1)
      const spawnX = spawnRatio * map.size.width
      const body = Bodies.circle(spawnX, 60, BALL_RADIUS, {
        restitution: 0.92,
        frictionAir: 0.02,
        friction: 0.08,
        density: 0.0012,
        label: `ball-${participantId}`,
      })

      const state: BallState = {
        id: `${participantId}-${spawnIndex}-${crypto.randomUUID()}`,
        participantId,
        body,
        hasShield: false,
        shieldConsumed: false,
        spawnX,
        spawnIndex,
      }

      return state
    }

    activeParticipants.forEach((participant) => {
      const entryCount = Math.max(1, Math.round(participant.entryCount))
      for (let i = 0; i < entryCount; i += 1) {
        const state = createBallState(participant.id, slotCursor)
        slotCursor += 1
        balls.push(state)
        Composite.add(world, state.body)
      }
    })

    // Apply skill hooks
    skills.forEach((skill) => {
      skill.hooks.setupWorld?.(engine, world)
    })

    balls.forEach((state) => {
      skills.forEach((skill) => {
        skill.hooks.setupBall?.(state.body, state, helpers)
      })
    })

    const participantNameById = new Map(
      participants.map((participant) => [participant.id, participant.name]),
    )
    const participantColorById = new Map(
      participants.map((participant) => [participant.id, participantColor(participant.colorHue)]),
    )
    const participantOutlineById = new Map(
      participants.map((participant) => [participant.id, participantOutline(participant.colorHue)]),
    )

    const removeBall = (state: BallState, reason: EliminationEvent['reason']) => {
      if (state.eliminatedAt || completed) return

      if (state.hasShield && !state.shieldConsumed) {
        state.shieldConsumed = true
        helpers.resetBallPosition(state)
        return
      }

      eliminationOrder += 1
      state.eliminatedAt = eliminationOrder
      Composite.remove(world, state.body)

      const participantName = participantNameById.get(state.participantId) ?? '???'
      const event: EliminationEvent = {
        order: eliminationOrder,
        ballId: state.id,
        participantId: state.participantId,
        participantName,
        reason,
        timestamp: Date.now(),
      }
      eliminationLog.push(event)
      onElimination(event)

      const remaining = balls.filter((ball) => !ball.eliminatedAt)

      if (winCondition === 'first-drop') {
        completed = true
        const result: SimulationResult = {
          winnerBallId: state.id,
          winnerParticipantId: state.participantId,
          eliminationLog: [...eliminationLog],
          completed: true,
        }
        onComplete(result)
      } else if (winCondition === 'last-survivor' && remaining.length <= 1) {
        completed = true
        const survivor = remaining[0] ?? state
        const result: SimulationResult = {
          winnerBallId: survivor.id,
          winnerParticipantId: survivor.participantId,
          eliminationLog: [...eliminationLog],
          completed: true,
        }
        onComplete(result)
      }
    }

    const handleCollision = ({pairs}: IEventCollision<Engine>) => {
      pairs.forEach((pair) => {
        const {bodyA, bodyB} = pair
        const labels = [bodyA.label, bodyB.label]

        const isDrainCollision = labels.includes('drain-sensor')
        if (isDrainCollision) {
          const ballBody = bodyA.label.startsWith('ball') ? bodyA : bodyB
          const state = balls.find((item) => item.body === ballBody)
          if (state) {
            removeBall(state, 'drain')
          }
        }

        const isBodyABumper = bodyA.label.startsWith('bumper-')
        const isBodyBBumper = bodyB.label.startsWith('bumper-')
        if (isBodyABumper || isBodyBBumper) {
          const bumper = isBodyABumper ? bodyA : bodyB
          const ballBody = isBodyABumper ? bodyB : bodyA
          const state = balls.find((item) => item.body === ballBody)
          const scale = bumperImpulse.get(bumper.id)
          if (state && scale) {
            const direction = Vector.sub(ballBody.position, bumper.position)
            const normal = Vector.normalise(direction)
            const impulse = Vector.mult(normal, scale)
            helpers.addImpulse(state, impulse)
          }
        }
      })
    }

    Events.on(engine, 'collisionStart', handleCollision)

    const tick = () => {
      Engine.update(engine, FRAME_INTERVAL)

      skills.forEach((skill) => {
        skill.hooks.onTick?.(engine, balls, FRAME_INTERVAL, helpers)
      })

      balls.forEach((state) => {
        if (!state.eliminatedAt && state.body.position.y > map.size.height + 120) {
          removeBall(state, 'fallout')
        }
      })

      if (completed || (winCondition === 'first-drop' && eliminationLog.length > 0)) {
        cancelAnimationFrame(animationFrameRef.current ?? 0)
        animationFrameRef.current = null
        Events.off(engine, 'collisionStart', handleCollision)
        return
      }

      drawBackground(context, map, deviceRatio)
      drawObstacles(context, map, deviceRatio)
      drawDrain(context, map, deviceRatio)

      context.save()
      context.scale(deviceRatio, deviceRatio)
      balls.forEach((state) => {
        if (state.eliminatedAt) return
        const participantId = state.participantId
        const fill = participantColorById.get(participantId) ?? 'rgba(148, 163, 184, 0.8)'
        const stroke = participantOutlineById.get(participantId) ?? 'rgba(226, 232, 240, 0.8)'
        context.beginPath()
        context.fillStyle = fill
        context.strokeStyle = stroke
        context.lineWidth = state.hasShield && !state.shieldConsumed ? 4 : 2
        context.arc(state.body.position.x, state.body.position.y, BALL_RADIUS, 0, Math.PI * 2)
        context.fill()
        context.stroke()
      })
      context.restore()

      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      Events.off(engine, 'collisionStart', handleCollision)
      Composite.clear(engine.world, false)
      World.clear(engine.world, false)
      Engine.clear(engine)
    }
  }, [map, participants, winCondition, skills, runKey, onElimination, onComplete])

  return (
    <canvas
      ref={canvasRef}
      className="pinball-canvas"
      data-run={runKey}
      role="presentation"
    />
  )
}
