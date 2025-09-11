import {
    type ActivityEvent,
    GamePhase,
    type GameStateV2,
    type GuessAttempt,
    type Hint,
    type Player,
    type PlayerID,
    type SurvivalVote,
    type Vote
} from '@/types/game'
import {getNextPhase, PHASE_TIMINGS} from '@/utils/gamePhases'
import {calculateScoreChanges} from '@/utils/scoreCalculations'

interface GameActionsV2 {
  initialize: (gameId: string, players: GameStateV2['players'], topic: string, totalRounds?: number) => void
  setRoles: (roles: Record<PlayerID, Player['role']>) => void
  setSecretWord: (word: string) => void
  startGame: () => void
  startPhase: (phase: GamePhase) => void
  nextPhase: () => void
  tick: () => void
  setTimeRemaining: (seconds: number) => void
  submitHint: (text: string) => void
  castVote: (targetId: PlayerID) => void
  submitDefense: (statement: string) => void
  castSurvivalVote: (targetId: PlayerID) => void
  submitGuess: (word: string) => void
  addActivity: (partial: Omit<ActivityEvent,'id'|'timestamp'> & { content?: string }) => void
  finalizeRound: () => void
  startNextRound: () => void
  setAccused: (playerId: PlayerID) => void
  reset: () => void
}

export type GameStoreV2 = GameStateV2 & GameActionsV2 & { speechIndex: number; activities: ActivityEvent[]; lastWarnRemaining?: number }

const initialState: GameStateV2 = {
  gameId: '',
  phase: GamePhase.WAITING,
  currentRound: 1,
  totalRounds: 3,
  timeRemaining: 0,
  currentPlayer: undefined,
  players: [],
  gameData: {
    topic: '미정',
    secretWord: undefined,
    hints: [],
    votes: [],
    accusedPlayer: undefined,
    defenseStatement: undefined,
    survivalVotes: [],
    guessAttempt: undefined,
    eliminatedPlayer: undefined,
    results: undefined,
    victoryAchieved: false,
  },
  scores: {},
}

let intervalRef: number | null = null

function genId(): string { try { return crypto.randomUUID() } catch { return 'id-' + Math.random().toString(36).slice(2,11) } }
function mkActivity(base: Omit<ActivityEvent,'id'|'timestamp'> & { content?: string }): ActivityEvent { return { id: genId(), timestamp: Date.now(), ...base } }
    (set, get) => ({
      ...initialState,
      speechIndex: 0,
      activities: [],

      initialize: (gameId, players, topic, totalRounds = 3) => {
        const scores: Record<PlayerID, number> = {}
        players.forEach(p => (scores[p.id] = scores[p.id] ?? 0))
        set({
          ...initialState,
          gameId,
          players,
          scores,
            gameId,
            players,
            scores,
            gameData: { ...initialState.gameData, topic },
            totalRounds,
            currentRound: 1,
            phase: GamePhase.WAITING,
            timeRemaining: 0,
            speechIndex: 0,
            currentPlayer: undefined,
            activities: [],
            lastWarnRemaining: undefined,
      setRoles: (roles) => set(s => ({ players: s.players.map(p => ({ ...p, role: roles[p.id] ?? p.role })) })),
      setSecretWord: (word) => set(s => ({ gameData: { ...s.gameData, secretWord: word } })),

      addActivity: (partial) => set(s => ({ activities: [ mkActivity({ phase: s.phase, ...partial }), ...s.activities ].slice(0, 200) })),

      startGame: () => {
        const s = get(); if (!s.gameId) return
        get().addActivity({ type: 'phase_change', phase: GamePhase.SPEECH, content: '힌트 단계 시작' })
        get().startPhase(GamePhase.SPEECH)
      },

      startPhase: (phase) => {
        if (intervalRef) { clearInterval(intervalRef as unknown as number); intervalRef = null }
        const seconds = PHASE_TIMINGS[phase]
        const nextState: Partial<GameStateV2> = { phase }
        if (phase === GamePhase.SPEECH) {
          const { players } = get(); const idx = 0; nextState.currentPlayer = players[idx]?.id; set({ speechIndex: idx })
        } else {
          set({ speechIndex: 0 }); nextState.currentPlayer = undefined
        }
        set({ ...nextState, timeRemaining: seconds, lastWarnRemaining: undefined })
        if (seconds > 0) intervalRef = setInterval(() => get().tick(), 1000) as unknown as number
        if (phase === GamePhase.GAME_OVER) {
          get().finalizeRound()
        }
        if (phase === GamePhase.GAME_OVER) get().finalizeRound()
        const s = get()
        if (s.phase === GamePhase.GAME_OVER) {
          set({ currentRound: Math.min(s.currentRound + 1, s.totalRounds) })
        }
        if (s.phase === GamePhase.GAME_OVER) set({ currentRound: Math.min(s.currentRound + 1, s.totalRounds) })
      },

      tick: () => {
        const { timeRemaining, phase, lastWarnRemaining } = get()
        if ((timeRemaining === 10 || timeRemaining === 5) && lastWarnRemaining !== timeRemaining) {
          get().addActivity({ type: 'system', phase, content: `남은 시간 ${timeRemaining}초` })
          set({ lastWarnRemaining: timeRemaining })
        }
        if (timeRemaining <= 1) {
          // Phase-specific wrap up
          if (phase === GamePhase.SPEECH) {
            const { players, speechIndex, gameData, currentPlayer } = get()
            if (!hasHint && currentPlayer) {
              const auto: Hint = { playerId: currentPlayer, text: '자동 힌트 (미입력)', timestamp: Date.now() }
              set(s => ({ gameData: { ...s.gameData, hints: [...s.gameData.hints, auto] } }))
              get().addActivity({ type: 'hint', phase: GamePhase.SPEECH, playerId: currentPlayer, content: auto.text })
            }
            const isLast = speechIndex >= players.length - 1
            if (!isLast) {
              const nextIdx = speechIndex + 1
              set({ speechIndex: nextIdx, currentPlayer: players[nextIdx]?.id, timeRemaining: PHASE_TIMINGS[GamePhase.SPEECH], lastWarnRemaining: undefined })
              return
            } else {
              set({ timeRemaining: 0 })
              get().startPhase(GamePhase.VOTING_FOR_LIAR)
              return
            get().nextPhase()
          }
      castVote: (targetId) => {
            }
            gameData.votes.forEach(v => { tally[v.targetId] = (tally[v.targetId] ?? 0) + 1 })
          if (phase === GamePhase.VOTING_FOR_LIAR) {
            if (accused) set(s => ({ gameData: { ...s.gameData, accusedPlayer: accused } }))
      reset: () => {
        if (intervalRef) {
            const { gameData } = get(); const tally: Record<string, number> = {}
          }
          if (phase === GamePhase.VOTING_FOR_SURVIVAL) {
            const { gameData } = get(); const tally: Record<string, number> = {}
            ;(gameData.survivalVotes||[]).forEach(v => { tally[v.targetId] = (tally[v.targetId] ?? 0) + 1 })
            const eliminated = Object.entries(tally).sort((a,b)=>b[1]-a[1])[0]?.[0]
            if (eliminated) set(s => ({ gameData: { ...s.gameData, eliminatedPlayer: eliminated } }))
          }
          if (phase === GamePhase.GUESSING_WORD) {
            const { gameData } = get()
            if (!gameData.guessAttempt) set(s => ({ gameData: { ...s.gameData, guessAttempt: { playerId: s.gameData.accusedPlayer || 'unknown', word: '(미제출)', correct: false, timestamp: Date.now() } } }))
          }
          set({ timeRemaining: 0, lastWarnRemaining: undefined })
          if (phase === GamePhase.GAME_OVER) {
            get().startNextRound()
          } else {
            const next = getNextPhase(phase)
            get().startPhase(next)
            if (next === GamePhase.GAME_OVER) {
              get().finalizeRound()
              get().addActivity({ type: 'system', phase: GamePhase.GAME_OVER, content: '라운드 결과 확정' })
            }
          }
          if (intervalRef) { clearInterval(intervalRef as unknown as number); intervalRef = null }
        } else {
          set({ timeRemaining: timeRemaining - 1 })
        }
      },

      setTimeRemaining: (seconds) => set({ timeRemaining: Math.max(0, seconds) }),

      submitHint: (text: string) => {
        const { currentPlayer, gameData } = get(); if (!currentPlayer) return
        let filtered = text; const secret = gameData.secretWord?.toLowerCase()
        if (secret && filtered.toLowerCase().includes(secret)) filtered = filtered.toLowerCase().replace(new RegExp(secret,'g'),'***')
        const hint: Hint = { playerId: currentPlayer, text: filtered, timestamp: Date.now() }
        set(s => ({ gameData: { ...s.gameData, hints: [...s.gameData.hints, hint] } }))
        get().addActivity({ type: 'hint', phase: GamePhase.SPEECH, playerId: currentPlayer, content: filtered })
      },

      castVote: (targetId) => {
        const voterId = 'me' as PlayerID; if (targetId === voterId) return
        const vote: Vote = { voterId, targetId, timestamp: Date.now() }
        set(s => ({ gameData: { ...s.gameData, votes: [...s.gameData.votes.filter(v => v.voterId !== voterId), vote] } }))
        get().addActivity({ type: 'vote', phase: GamePhase.VOTING_FOR_LIAR, playerId: voterId, targetId })
      },

      submitDefense: (statement) => {
        const { gameData } = get(); if (!gameData.accusedPlayer) return
        set(s => ({ gameData: { ...s.gameData, defenseStatement: statement } }))
        get().addActivity({ type: 'defense', phase: GamePhase.DEFENDING, playerId: gameData.accusedPlayer, content: statement })
      },

      castSurvivalVote: (targetId) => {
        const voterId = 'me' as PlayerID; if (targetId === voterId) return
        const vote: SurvivalVote = { voterId, targetId, timestamp: Date.now() }
        set(s => ({ gameData: { ...s.gameData, survivalVotes: [...(s.gameData.survivalVotes || []).filter(v => v.voterId !== voterId), vote] } }))
        get().addActivity({ type: 'survival_vote', phase: GamePhase.VOTING_FOR_SURVIVAL, playerId: voterId, targetId })
      },

      submitGuess: (word: string) => {
        const { gameData } = get(); const liarId = gameData.accusedPlayer; if (!liarId) return
        const correct = gameData.secretWord ? gameData.secretWord.toLowerCase() === word.toLowerCase() : false
        const attempt: GuessAttempt = { playerId: liarId, word, timestamp: Date.now(), correct }
        set(s => ({ gameData: { ...s.gameData, guessAttempt: attempt } }))
        get().addActivity({ type: 'guess', phase: GamePhase.GUESSING_WORD, playerId: liarId, content: word })
      },

      finalizeRound: () => {
        const s = get(); const { gameData, players } = s
        if (gameData.results) return
        const liars = players.filter(p => p.role === 'LIAR').map(p => p.id)
        const citizens = players.filter(p => p.role !== 'LIAR').map(p => p.id)
        const accused = gameData.accusedPlayer
        const guess = gameData.guessAttempt
        let changes: { playerId: PlayerID; delta: number }[] = []
        if (accused && liars.includes(accused)) {
          changes.push(...calculateScoreChanges('LIAR_ELIMINATED', { liars, citizens, correctVoters: gameData.votes.filter(v=>v.targetId===accused).map(v=>v.voterId) }))
        } else if (accused && !liars.includes(accused)) {
          changes.push(...calculateScoreChanges('INNOCENT_ELIMINATED', { liars, citizens, correctVoters: [], incorrectVoters: gameData.votes.map(v=>v.voterId) }))
          changes.push(...calculateScoreChanges('LIAR_SURVIVED', { liars, citizens }))
        }
        if (guess && guess.correct) changes.push(...calculateScoreChanges('LIAR_GUESSED_TOPIC', { liars, citizens, guesser: guess.playerId }))
        if (changes.length) {
          const nextScores = { ...s.scores }; changes.forEach(c => { nextScores[c.playerId] = (nextScores[c.playerId] ?? 0) + c.delta })
          set({ scores: nextScores })
        }
        const maxScore = Math.max(0, ...Object.values(get().scores))
        let winners: PlayerID[] = []
        if (maxScore >= 10 || s.currentRound === s.totalRounds) winners = Object.entries(get().scores).filter(([_,v])=>v===maxScore).map(([pid])=>pid)
        set(state => ({ gameData: { ...state.gameData, results: { winners, reason: winners.length? '승점 달성' : '라운드 종료' }, victoryAchieved: winners.length>0 } }))
      },

      startNextRound: () => {
        const s = get(); if (s.gameData.victoryAchieved) return
        const nextRound = s.currentRound + 1
        if (nextRound > s.totalRounds) return
        set(state => ({
          currentRound: nextRound,
          phase: GamePhase.SPEECH,
          timeRemaining: PHASE_TIMINGS[GamePhase.SPEECH],
          gameData: { ...state.gameData, hints: [], votes: [], accusedPlayer: undefined, defenseStatement: undefined, survivalVotes: [], guessAttempt: undefined, eliminatedPlayer: undefined, results: undefined },
          speechIndex: 0,
          currentPlayer: state.players[0]?.id,
          lastWarnRemaining: undefined,
        }))
      },

      setAccused: (playerId) => set(s => ({ gameData: { ...s.gameData, accusedPlayer: playerId } })),

        }
        if (intervalRef) { clearInterval(intervalRef as unknown as number); intervalRef = null }
        set({ ...initialState, speechIndex: 0, activities: [], lastWarnRemaining: undefined })
)
    }),
    { name: 'gamev2-storage' }
              set(s => ({ gameData: { ...s.gameData, guessAttempt: { playerId: s.gameData.accusedPlayer || 'unknown', word: '(미제출)', correct: false, timestamp: Date.now() } } }))
