import {useCallback, useEffect, useMemo, useState} from 'react'
import './styles/app.css'
import {ParticipantPanel} from './components/ParticipantPanel'
import {MapSelector} from './components/MapSelector'
import {SkillBoard} from './components/SkillBoard'
import {ControlPanel} from './components/ControlPanel'
import {ResultsPanel} from './components/ResultsPanel'
import {PinballCanvas} from './components/PinballCanvas'
import {MAPS} from './data/maps'
import {SKILL_DECK} from './data/skills'
import type {EliminationEvent, Participant, ResolvedSkill, SimulationResult, WinCondition,} from './types'
import {drawSkillCards} from './utils/skills'

const DEFAULT_MAP_ID = MAPS[0]?.id ?? 'neon-plaza'
const SKILL_COUNT_PER_ROUND = 3

const normalizeParticipantColors = (list: Participant[]): Participant[] => {
  if (!list.length) return list
  return list.map((participant, index) => {
    const hue = (index / list.length) * 360
    return {
      ...participant,
      colorHue: hue % 360,
    }
  })
}

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [mapId, setMapId] = useState(DEFAULT_MAP_ID)
  const [winCondition, setWinCondition] = useState<WinCondition>('last-survivor')
  const [skillsEnabled, setSkillsEnabled] = useState(true)
  const [skills, setSkills] = useState<ResolvedSkill[]>([])
  const [eliminationLog, setEliminationLog] = useState<EliminationEvent[]>([])
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [runKey, setRunKey] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const stage = useMemo(() => MAPS.find((map) => map.id === mapId) ?? MAPS[0], [mapId])

  const activeParticipants = useMemo(
    () => participants.filter((participant) => participant.isActive && participant.entryCount > 0),
    [participants],
  )

  const totalEntries = useMemo(
    () =>
      activeParticipants.reduce((sum, participant) => sum + Math.max(0, participant.entryCount), 0),
    [activeParticipants],
  )

  const refreshSkills = useCallback(
    (options?: {enabled?: boolean}) => {
      const effectiveEnabled = options?.enabled ?? skillsEnabled
      if (!effectiveEnabled) {
        setSkills([])
        return
      }
      if (!activeParticipants.length) {
        setSkills([])
        return
      }
      const context = {
        participants: activeParticipants,
        winCondition,
      }
      setSkills(drawSkillCards(SKILL_DECK, context, SKILL_COUNT_PER_ROUND))
    },
    [skillsEnabled, activeParticipants, winCondition],
  )

  const updateParticipants = useCallback(
    (updater: (prev: Participant[]) => Participant[]) => {
      setParticipants((prev) => normalizeParticipantColors(updater(prev)))
    },
    [],
  )

  const handleAddParticipants = useCallback(
    (entries: {name: string; count: number}[]) => {
      if (!entries.length) return
      updateParticipants((prev) => {
        const merged = [...prev]
        entries.forEach(({name, count}) => {
          const index = merged.findIndex((participant) => participant.name === name)
          if (index >= 0) {
            const existing = merged[index]
            merged[index] = {
              ...existing,
              entryCount: existing.entryCount + count,
              isActive: true,
            }
          } else {
            merged.push({
              id: crypto.randomUUID(),
              name,
              entryCount: count,
              isActive: true,
              colorHue: 0,
            })
          }
        })
        return merged
      })
    },
    [updateParticipants],
  )

  const handleUpdateParticipant = useCallback(
    (participantId: string, updates: Partial<Pick<Participant, 'entryCount' | 'isActive'>>) => {
      updateParticipants((prev) =>
        prev.map((participant) =>
          participant.id === participantId
            ? {
                ...participant,
                ...updates,
                entryCount:
                  typeof updates.entryCount === 'number'
                    ? Math.max(1, Math.round(updates.entryCount))
                    : participant.entryCount,
              }
            : participant,
        ),
      )
    },
    [updateParticipants],
  )

  const handleRemoveParticipant = useCallback(
    (participantId: string) => {
      updateParticipants((prev) => prev.filter((participant) => participant.id !== participantId))
    },
    [updateParticipants],
  )

  const handleClearParticipants = useCallback(() => {
    updateParticipants(() => [])
    setEliminationLog([])
    setResult(null)
    setRunKey(0)
    setIsRunning(false)
  }, [updateParticipants])

  const handleStart = useCallback(() => {
    if (!totalEntries || isRunning) return
    if (skillsEnabled) {
      refreshSkills()
    } else {
      setSkills([])
    }
    setEliminationLog([])
    setResult(null)
    setIsRunning(true)
    setRunKey((prev) => prev + 1)
  }, [totalEntries, isRunning, skillsEnabled, refreshSkills])

  const handleReset = useCallback(() => {
    setEliminationLog([])
    setResult(null)
    setRunKey(0)
    setIsRunning(false)
  }, [])

  const handleToggleSkills = useCallback(() => {
    setSkillsEnabled((prev) => {
      const next = !prev
      refreshSkills({enabled: next})
      return next
    })
  }, [refreshSkills])

  const handleElimination = useCallback((event: EliminationEvent) => {
    setEliminationLog((prev) => [...prev, event])
  }, [])

  const handleComplete = useCallback((data: SimulationResult) => {
    setResult(data)
    setIsRunning(false)
  }, [])

  useEffect(() => {
    if (!skillsEnabled) {
      setSkills([])
      return
    }
    if (!activeParticipants.length) {
      setSkills([])
      return
    }
    const hasMissingTarget = skills.some(
      (skill) =>
        skill.targetParticipantId &&
        !activeParticipants.some((participant) => participant.id === skill.targetParticipantId),
    )
    if (!skills.length || hasMissingTarget) {
      refreshSkills()
    }
  }, [skillsEnabled, activeParticipants, refreshSkills, skills])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Pinball Royale</h1>
          <p>파티 참가자를 핀볼 위에 올려 두고, 가장 먼저 혹은 가장 늦게 떨어지는 사람을 가려보세요.</p>
        </div>
        <div className="header-meta">
          <span>맵: {stage.name}</span>
          <span>볼 수: {totalEntries}</span>
        </div>
      </header>

      <main className="layout-grid">
        <div className="layout-left">
          <ParticipantPanel
            onAddParticipants={handleAddParticipants}
            onClearParticipants={handleClearParticipants}
            onRemoveParticipant={handleRemoveParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            participants={participants}
          />
          <MapSelector
            activeId={mapId}
            maps={MAPS}
            onSelect={setMapId}
          />
          <SkillBoard
            enabled={skillsEnabled}
            onRedraw={refreshSkills}
            onToggleEnabled={handleToggleSkills}
            participants={participants}
            skills={skills}
          />
        </div>

        <div className="layout-right">
          <div className="board-wrapper">
            <PinballCanvas
              map={stage}
              onComplete={handleComplete}
              onElimination={handleElimination}
              participants={participants}
              runKey={runKey}
              skills={skillsEnabled ? skills : []}
              winCondition={winCondition}
            />
          </div>
          <ControlPanel
            canStart={totalEntries > 0}
            isRunning={isRunning}
            onChangeWinCondition={setWinCondition}
            onReset={handleReset}
            onStart={handleStart}
            winCondition={winCondition}
          />
          <ResultsPanel
            isRunning={isRunning}
            log={eliminationLog}
            participants={participants}
            result={result}
            winCondition={winCondition}
          />
        </div>
      </main>
    </div>
  )
}
