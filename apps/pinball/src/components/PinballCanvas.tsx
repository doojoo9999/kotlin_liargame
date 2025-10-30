import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
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
import pegSpriteUrl from '../assets/peg-neon.svg?url'
import bumperSpriteUrl from '../assets/bumper-halo.svg?url'
import wallSpriteUrl from '../assets/wall-bezel.svg?url'

const BALL_RADIUS = 14
const FRAME_INTERVAL = 1000 / 60
const SPAWN_MARGIN = BALL_RADIUS + 48
const STILLNESS_SPEED_THRESHOLD = 0.25
const STILLNESS_FRAME_LIMIT = 240
const MAX_BALL_LIFETIME = 180_000
const GRAVITY_RAMP_DELAY = 45_000
const GRAVITY_RAMP_DURATION = 60_000
const GRAVITY_RAMP_STRENGTH = 0.4
const VIEWPORT_MIN = 520

interface SpriteSet {
  peg: HTMLImageElement | null
  bumper: HTMLImageElement | null
  wall: HTMLImageElement | null
}

interface ViewState {
  scale: number
  offsetX: number
  offsetY: number
  viewportWidth: number
  viewportHeight: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const parseHex = (hex: string) => {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return {r: 255, g: 255, b: 255}
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

const mixHex = (base: string, target: string, ratio: number) => {
  const amount = clamp(ratio, 0, 1)
  const start = parseHex(base)
  const end = parseHex(target)
  const blendChannel = (from: number, to: number) => Math.round(from * (1 - amount) + to * amount)
  return `rgb(${blendChannel(start.r, end.r)}, ${blendChannel(start.g, end.g)}, ${blendChannel(start.b, end.b)})`
}

const toRgba = (hex: string, alpha: number) => {
  const {r, g, b} = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const lighten = (hex: string, amount: number) => mixHex(hex, '#ffffff', amount)
const darken = (hex: string, amount: number) => mixHex(hex, '#0b1120', amount)

const createSprite = (src: string | undefined): HTMLImageElement | null => {
  if (typeof Image === 'undefined' || !src) return null
  const image = new Image()
  image.decoding = 'async'
  image.crossOrigin = 'anonymous'
  image.src = src
  return image
}

const createHelpers = (map: MapDefinition) => {
  const helpers: SkillHelpers = {
    resetBallPosition: (state) => {
      const jitter = (Math.random() - 0.5) * 40
      const targetX = clamp(state.spawnX + jitter, SPAWN_MARGIN, map.size.width - SPAWN_MARGIN)
      Body.setPosition(state.body, {x: targetX, y: 80})
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

const drawBackground = (ctx: CanvasRenderingContext2D, map: MapDefinition) => {
  const gradient = ctx.createLinearGradient(0, 0, map.size.width, map.size.height)
  gradient.addColorStop(0, map.background.gradientFrom)
  gradient.addColorStop(1, map.background.gradientTo)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, map.size.width, map.size.height)

  const accentOverlay = ctx.createRadialGradient(
    map.size.width * 0.5,
    map.size.height * 0.58,
    map.size.width * 0.12,
    map.size.width * 0.5,
    map.size.height * 0.58,
    map.size.width * 0.74,
  )
  accentOverlay.addColorStop(0, toRgba(lighten(map.background.accent, 0.2), 0.4))
  accentOverlay.addColorStop(1, 'rgba(15, 23, 42, 0)')
  ctx.fillStyle = accentOverlay
  ctx.fillRect(0, 0, map.size.width, map.size.height)
}

const drawDrain = (ctx: CanvasRenderingContext2D, map: MapDefinition, scale: number) => {
  ctx.save()
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.7)'
  ctx.lineWidth = 4 / scale
  ctx.setLineDash([16 / scale, 12 / scale])
  ctx.beginPath()
  ctx.moveTo(0, map.drainY)
  ctx.lineTo(map.size.width, map.drainY)
  ctx.stroke()
  ctx.restore()
}

const drawWall = (
  ctx: CanvasRenderingContext2D,
  obstacle: Extract<MapDefinition['obstacles'][number], {type: 'wall'}>,
  sprite: HTMLImageElement | null,
  accent: string,
) => {
  ctx.save()
  ctx.translate(obstacle.x, obstacle.y)
  if (obstacle.angle) ctx.rotate(obstacle.angle)
  const width = obstacle.width
  const height = obstacle.height
  if (sprite && sprite.complete) {
    ctx.drawImage(sprite, -width / 2, -height / 2, width, height)
  } else {
    ctx.fillStyle = toRgba(darken(accent, 0.4), 0.85)
    ctx.fillRect(-width / 2, -height / 2, width, height)
  }
  const gloss = ctx.createLinearGradient(-width / 2, 0, width / 2, 0)
  gloss.addColorStop(0, toRgba(lighten(accent, 0.35), 0.35))
  gloss.addColorStop(1, toRgba(darken(accent, 0.65), 0.6))
  ctx.globalAlpha = 0.55
  ctx.fillStyle = gloss
  ctx.fillRect(-width / 2, -height / 2, width, height)
  ctx.globalAlpha = 1
  ctx.restore()
}

const drawPeg = (
  ctx: CanvasRenderingContext2D,
  obstacle: Extract<MapDefinition['obstacles'][number], {type: 'peg'}>,
  sprite: HTMLImageElement | null,
  accent: string,
) => {
  ctx.save()
  ctx.translate(obstacle.x, obstacle.y)
  const renderRadius = obstacle.radius * 1.6
  if (sprite && sprite.complete) {
    ctx.drawImage(sprite, -renderRadius, -renderRadius, renderRadius * 2, renderRadius * 2)
  } else {
    const gradient = ctx.createRadialGradient(0, 0, obstacle.radius * 0.25, 0, 0, renderRadius)
    gradient.addColorStop(0, '#F8FAFC')
    gradient.addColorStop(1, toRgba(accent, 0.85))
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, renderRadius, 0, Math.PI * 2)
    ctx.fill()
  }
  const halo = ctx.createRadialGradient(0, 0, obstacle.radius * 0.9, 0, 0, renderRadius * 1.45)
  halo.addColorStop(0, toRgba(lighten(accent, 0.25), 0.32))
  halo.addColorStop(1, 'rgba(15, 23, 42, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(0, 0, renderRadius * 1.45, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

const drawBumper = (
  ctx: CanvasRenderingContext2D,
  obstacle: Extract<MapDefinition['obstacles'][number], {type: 'bumper'}>,
  sprite: HTMLImageElement | null,
  accent: string,
) => {
  ctx.save()
  ctx.translate(obstacle.x, obstacle.y)
  const renderRadius = obstacle.radius * 1.7
  if (sprite && sprite.complete) {
    ctx.drawImage(sprite, -renderRadius, -renderRadius, renderRadius * 2, renderRadius * 2)
  } else {
    const gradient = ctx.createRadialGradient(0, 0, obstacle.radius * 0.35, 0, 0, renderRadius)
    gradient.addColorStop(0, '#FEF2F2')
    gradient.addColorStop(1, toRgba(lighten(accent, 0.1), 0.92))
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, renderRadius, 0, Math.PI * 2)
    ctx.fill()
  }
  const glow = ctx.createRadialGradient(0, 0, obstacle.radius * 0.6, 0, 0, renderRadius * 1.6)
  glow.addColorStop(0, toRgba(accent, 0.45))
  glow.addColorStop(1, 'rgba(15, 23, 42, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(0, 0, renderRadius * 1.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

const drawObstacles = (ctx: CanvasRenderingContext2D, map: MapDefinition, sprites: SpriteSet) => {
  const accent = map.background.accent
  map.obstacles.forEach((obstacle) => {
    switch (obstacle.type) {
      case 'wall':
        drawWall(ctx, obstacle, sprites.wall, accent)
        break
      case 'peg':
        drawPeg(ctx, obstacle, sprites.peg, accent)
        break
      case 'bumper':
        drawBumper(ctx, obstacle, sprites.bumper, accent)
        break
      default:
        break
    }
  })
}

const drawBalls = (
  ctx: CanvasRenderingContext2D,
  balls: BallState[],
  colorById: Map<string, string>,
  outlineById: Map<string, string>,
  scale: number,
) => {
  balls.forEach((state) => {
    if (state.eliminatedAt) return
    const fill = colorById.get(state.participantId) ?? 'rgba(148, 163, 184, 0.92)'
    const stroke = outlineById.get(state.participantId) ?? 'rgba(226, 232, 240, 0.85)'
    ctx.save()
    ctx.translate(state.body.position.x, state.body.position.y)
    ctx.beginPath()
    ctx.fillStyle = fill
    ctx.strokeStyle = stroke
    ctx.lineWidth = (state.hasShield && !state.shieldConsumed ? 4 : 2) / scale
    ctx.shadowColor = 'rgba(148, 163, 209, 0.55)'
    ctx.shadowBlur = BALL_RADIUS * 0.9
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    if (state.hasShield && !state.shieldConsumed) {
      const aura = ctx.createRadialGradient(0, 0, BALL_RADIUS * 0.7, 0, 0, BALL_RADIUS * 1.7)
      aura.addColorStop(0, 'rgba(96, 165, 250, 0.4)')
      aura.addColorStop(1, 'rgba(37, 99, 235, 0)')
      ctx.fillStyle = aura
      ctx.beginPath()
      ctx.arc(0, 0, BALL_RADIUS * 1.7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  })
}

const paintScene = (
  ctx: CanvasRenderingContext2D,
  map: MapDefinition,
  view: ViewState,
  deviceRatio: number,
  sprites: SpriteSet,
  participantColorById?: Map<string, string>,
  participantOutlineById?: Map<string, string>,
  balls?: BallState[],
) => {
  const {scale, offsetX, offsetY, viewportWidth, viewportHeight} = view
  ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0)
  ctx.clearRect(0, 0, viewportWidth * deviceRatio, viewportHeight * deviceRatio)
  ctx.save()
  const translateX = offsetX * scale * deviceRatio
  const translateY = offsetY * scale * deviceRatio
  ctx.transform(
    deviceRatio * scale,
    0,
    0,
    deviceRatio * scale,
    translateX,
    translateY,
  )

  drawBackground(ctx, map)
  drawObstacles(ctx, map, sprites)
  drawDrain(ctx, map, scale)

  if (balls && participantColorById && participantOutlineById) {
    drawBalls(ctx, balls, participantColorById, participantOutlineById, scale)
  }
  ctx.restore()
}

interface PinballCanvasProps {
  map: MapDefinition
  participants: Participant[]
  winCondition: WinCondition
  skills: ResolvedSkill[]
  runKey: number
  onElimination: (event: EliminationEvent) => void
  onComplete: (result: SimulationResult) => void
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dragRef = useRef<{active: boolean; lastX: number; lastY: number}>({
    active: false,
    lastX: 0,
    lastY: 0,
  })
  const isRunningRef = useRef(false)
  const viewSettingsRef = useRef<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    viewportWidth: 800,
    viewportHeight: 900,
  })

  const sprites = useMemo<SpriteSet>(
    () => ({
      peg: createSprite(pegSpriteUrl),
      bumper: createSprite(bumperSpriteUrl),
      wall: createSprite(wallSpriteUrl),
    }),
    [],
  )

  const [viewport, setViewport] = useState({width: 800, height: 900})
  const [viewScale, setViewScale] = useState(1)
  const [offset, setOffset] = useState({x: 0, y: 0})
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateViewport = () => {
      const {clientWidth, clientHeight} = container
      const width = Math.max(VIEWPORT_MIN, clientWidth)
      const fallbackHeight = Math.min(window.innerHeight * 0.78, width * 1.3)
      const height = Math.max(VIEWPORT_MIN, clientHeight > 0 ? clientHeight : fallbackHeight)
      setViewport((prev) => {
        if (Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5) {
          return prev
        }
        return {width, height}
      })
    }

    updateViewport()
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateViewport)
      observer.observe(container)
      return () => observer.disconnect()
    }

    const handleResize = () => updateViewport()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fitScale = useMemo(() => {
    const widthScale = viewport.width / map.size.width
    const heightScale = viewport.height / map.size.height
    return Math.min(widthScale, heightScale, 1)
  }, [viewport.width, viewport.height, map.size.width, map.size.height])

  const minScale = useMemo(() => Math.min(fitScale, 0.45), [fitScale])
  const maxScale = useMemo(() => Math.max(1.5, fitScale * 1.4), [fitScale])

  const clampOffsetValue = useCallback(
    (value: number, viewportSize: number, mapSize: number, scale: number) => {
      const diff = viewportSize / scale - mapSize
      if (diff >= 0) {
        return clamp(value, 0, diff)
      }
      return clamp(value, diff, 0)
    },
    [],
  )

  const clampOffsetX = useCallback(
    (value: number, scaleOverride?: number) =>
      clampOffsetValue(value, viewport.width, map.size.width, scaleOverride ?? viewScale),
    [clampOffsetValue, viewport.width, map.size.width, viewScale],
  )

  const clampOffsetY = useCallback(
    (value: number, scaleOverride?: number) =>
      clampOffsetValue(value, viewport.height, map.size.height, scaleOverride ?? viewScale),
    [clampOffsetValue, viewport.height, map.size.height, viewScale],
  )

  const computeCenteredOffset = useCallback(
    (scale: number) => ({
      x: (viewport.width / scale - map.size.width) / 2,
      y: (viewport.height / scale - map.size.height) / 2,
    }),
    [viewport.width, viewport.height, map.size.width, map.size.height],
  )

  useEffect(() => {
    const alignedScale = clamp(fitScale, minScale, maxScale)
    setViewScale((prev) => (Math.abs(prev - alignedScale) < 0.0001 ? prev : alignedScale))
    const centered = computeCenteredOffset(alignedScale)
    setOffset({
      x: clampOffsetX(centered.x, alignedScale),
      y: clampOffsetY(centered.y, alignedScale),
    })
  }, [fitScale, minScale, maxScale, computeCenteredOffset, clampOffsetX, clampOffsetY])

  useEffect(() => {
    viewSettingsRef.current = {
      scale: viewScale,
      offsetX: offset.x,
      offsetY: offset.y,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
    }
  }, [viewScale, offset, viewport])

  const applyScale = useCallback(
    (targetScale: number, anchor?: {x: number; y: number}) => {
      const nextScale = clamp(targetScale, minScale, maxScale)
      setViewScale((prevScale) => {
        if (Math.abs(prevScale - nextScale) < 0.0001) return prevScale
        setOffset((prevOffset) => {
          if (!anchor) {
            const centered = computeCenteredOffset(nextScale)
            return {
              x: clampOffsetX(centered.x, nextScale),
              y: clampOffsetY(centered.y, nextScale),
            }
          }
          const worldX = anchor.x / prevScale - prevOffset.x
          const worldY = anchor.y / prevScale - prevOffset.y
          const nextOffsetX = anchor.x / nextScale - worldX
          const nextOffsetY = anchor.y / nextScale - worldY
          return {
            x: clampOffsetX(nextOffsetX, nextScale),
            y: clampOffsetY(nextOffsetY, nextScale),
          }
        })
        return nextScale
      })
    },
    [minScale, maxScale, clampOffsetX, clampOffsetY, computeCenteredOffset],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const deviceRatio = Math.min(window.devicePixelRatio || 1, 2)
    const width = viewport.width * deviceRatio
    const height = viewport.height * deviceRatio
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`
    if (!isRunningRef.current) {
      paintScene(ctx, map, viewSettingsRef.current, deviceRatio, sprites)
    }
  }, [viewport, map, sprites])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!canvas) return
      dragRef.current = {
        active: true,
        lastX: event.clientX,
        lastY: event.clientY,
      }
      setIsDragging(true)
      canvas.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragRef.current.active) return
      const dx = event.clientX - dragRef.current.lastX
      const dy = event.clientY - dragRef.current.lastY
      dragRef.current.lastX = event.clientX
      dragRef.current.lastY = event.clientY
      setOffset((prev) => ({
        x: clampOffsetX(prev.x + dx / viewScale),
        y: clampOffsetY(prev.y + dy / viewScale),
      }))
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragRef.current.active) return
      dragRef.current.active = false
      setIsDragging(false)
      try {
        canvas.releasePointerCapture(event.pointerId)
      } catch (error) {
        void error
      }
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const anchor = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      const factor = event.deltaY > 0 ? 0.9 : 1.1
      applyScale(viewScale * factor, anchor)
    }

    canvas.style.touchAction = 'none'
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointerleave', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerUp)
    canvas.addEventListener('wheel', handleWheel, {passive: false})

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerUp)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [viewScale, clampOffsetX, clampOffsetY, applyScale])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const totalEntries = participants
      .filter((participant) => participant.isActive)
      .reduce((sum, participant) => sum + Math.max(0, participant.entryCount), 0)

    const deviceRatio = Math.min(window.devicePixelRatio || 1, 2)
    const view = viewSettingsRef.current
    const width = view.viewportWidth * deviceRatio
    const height = view.viewportHeight * deviceRatio
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    canvas.style.width = `${view.viewportWidth}px`
    canvas.style.height = `${view.viewportHeight}px`

    const renderStatic = () => {
      paintScene(ctx, map, viewSettingsRef.current, deviceRatio, sprites)
    }

    if (!totalEntries || runKey === 0) {
      isRunningRef.current = false
      renderStatic()
      return
    }

    const engine = Engine.create({enableSleeping: false})
    let baseGravity = map.gravityScale
    engine.gravity.y = map.gravityScale
    engine.gravity.x = 0

    const world = engine.world
    world.gravity.y = map.gravityScale
    world.gravity.x = 0

    const helpers = createHelpers(map)
    const staticBodies: Body[] = []
    const bumperImpulse = new Map<number, number>()

    const wallThickness = Math.max(60, map.size.width * 0.04)
    const floor = Bodies.rectangle(
      map.size.width / 2,
      map.size.height + wallThickness / 2,
      map.size.width + wallThickness,
      wallThickness,
      {isStatic: true, label: 'floor'},
    )
    const leftWall = Bodies.rectangle(
      -wallThickness / 2,
      map.size.height / 2,
      wallThickness,
      map.size.height * 1.5,
      {isStatic: true, label: 'wall-left'},
    )
    const rightWall = Bodies.rectangle(
      map.size.width + wallThickness / 2,
      map.size.height / 2,
      wallThickness,
      map.size.height * 1.5,
      {isStatic: true, label: 'wall-right'},
    )
    const drainSensor = Bodies.rectangle(
      map.size.width / 2,
      map.drainY + 20,
      map.size.width + wallThickness,
      40,
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

    const ballMeta = new Map<BallState, {idleFrames: number; lifetime: number}>()
    const balls: BallState[] = []
    let eliminationOrder = 0
    const eliminationLog: EliminationEvent[] = []
    let completed = false
    let elapsed = 0

    const createBallState = (participantId: string, spawnIndex: number) => {
      const spawnRatio = map.spawnSlots[spawnIndex % slotCount] ?? (spawnIndex + 1) / (slotCount + 1)
      const rawX = spawnRatio * map.size.width
      const spawnX = clamp(rawX, SPAWN_MARGIN, map.size.width - SPAWN_MARGIN)
      const body = Bodies.circle(spawnX, 80, BALL_RADIUS, {
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
        ballMeta.set(state, {idleFrames: 0, lifetime: 0})
        Composite.add(world, state.body)
      }
    })

    skills.forEach((skill) => {
      skill.hooks.setupWorld?.(engine, world)
    })
    baseGravity = engine.gravity.y

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
        const meta = ballMeta.get(state)
        if (meta) {
          meta.idleFrames = 0
          meta.lifetime = 0
        }
        return
      }

      eliminationOrder += 1
      state.eliminatedAt = eliminationOrder
      Composite.remove(world, state.body)
      ballMeta.delete(state)

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

        if (labels.includes('drain-sensor')) {
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
    isRunningRef.current = true

    const tick = () => {
      elapsed += FRAME_INTERVAL
      if (elapsed > GRAVITY_RAMP_DELAY) {
        const progress = Math.min((elapsed - GRAVITY_RAMP_DELAY) / GRAVITY_RAMP_DURATION, 1)
        const gravityBoost = GRAVITY_RAMP_STRENGTH * progress
        const targetGravity = baseGravity + gravityBoost
        if (engine.gravity.y !== targetGravity) {
          engine.gravity.y = targetGravity
          world.gravity.y = targetGravity
        }
      }

      Engine.update(engine, FRAME_INTERVAL)

      skills.forEach((skill) => {
        skill.hooks.onTick?.(engine, balls, FRAME_INTERVAL, helpers)
      })

      balls.forEach((state) => {
        if (state.eliminatedAt) return
        const meta = ballMeta.get(state)
        if (meta) {
          meta.lifetime += FRAME_INTERVAL
          const {x: vx, y: vy} = state.body.velocity
          const speed = Math.hypot(vx, vy)
          if (speed < STILLNESS_SPEED_THRESHOLD) {
            meta.idleFrames += 1
          } else {
            meta.idleFrames = 0
          }

          if (meta.idleFrames > STILLNESS_FRAME_LIMIT && state.body.position.y < map.drainY + BALL_RADIUS) {
            const downwardForce = 0.0018 + meta.idleFrames * 0.00002
            const horizontalForce = (Math.random() - 0.5) * 0.002
            helpers.addImpulse(state, {x: horizontalForce, y: downwardForce})
            Body.setAngularVelocity(state.body, state.body.angularVelocity * 0.5)
            meta.idleFrames = Math.floor(meta.idleFrames * 0.5)
          }

          if (meta.lifetime > MAX_BALL_LIFETIME) {
            removeBall(state, 'fallout')
            return
          }
        }

        if (state.body.position.y > map.size.height + map.size.height * 0.15) {
          removeBall(state, 'fallout')
        }
      })

      const currentView = viewSettingsRef.current
      paintScene(
        ctx,
        map,
        currentView,
        deviceRatio,
        sprites,
        participantColorById,
        participantOutlineById,
        balls,
      )

      if (completed || (winCondition === 'first-drop' && eliminationLog.length > 0)) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        Events.off(engine, 'collisionStart', handleCollision)
        isRunningRef.current = false
        return
      }

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
      isRunningRef.current = false
      renderStatic()
    }
  }, [map, participants, winCondition, skills, runKey, onElimination, onComplete, sprites])

  const zoomDisabled = maxScale - minScale < 0.05
  const centerAnchor = {x: viewport.width / 2, y: viewport.height / 2}

  return (
    <div
      ref={containerRef}
      className="pinball-canvas-wrapper"
    >
      <canvas
        ref={canvasRef}
        className={`pinball-canvas${isDragging ? ' is-dragging' : ''}`}
        data-run={runKey}
        role="presentation"
      />
      <div className="pinball-zoom-controls">
        <button
          type="button"
          onClick={() => applyScale(viewScale * 0.88, centerAnchor)}
          disabled={zoomDisabled}
          aria-label="Zoom out"
        >
          −
        </button>
        <input
          type="range"
          min={minScale}
          max={maxScale}
          step={0.01}
          value={viewScale}
          onChange={(event) => applyScale(Number(event.currentTarget.value), centerAnchor)}
          disabled={zoomDisabled}
          aria-label="Zoom level"
        />
        <button
          type="button"
          onClick={() => applyScale(viewScale * 1.12, centerAnchor)}
          disabled={zoomDisabled}
          aria-label="Zoom in"
        >
          +
        </button>
        <span>{Math.round(viewScale * 100)}%</span>
      </div>
    </div>
  )
}
