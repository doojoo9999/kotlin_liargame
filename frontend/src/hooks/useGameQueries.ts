import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {gameApi} from '@/api/gameApi'
import {QUERY_KEYS} from '@/lib/queryClient'
import {useGameStore} from '@/store/gameStore'

// Game Status Query
export function useGameStatus(gameId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.GAME.STATUS(gameId || ''),
    queryFn: () => gameApi.getGameStatus(gameId!),
    enabled: !!gameId,
    refetchInterval: 2000, // Poll every 2 seconds during active game
    refetchIntervalInBackground: false,
  })
}

// Game Mutations
export function useCreateGame() {
  const { setGameId, setSessionCode } = useGameStore()
  
  return useMutation({
    mutationFn: gameApi.createGame,
    onSuccess: (data) => {
      setGameId(data.gameId)
      setSessionCode(data.sessionCode)
      // Host player will be set separately after login
    },
  })
}

export function useJoinGame() {
  const { setGameId, updatePlayers } = useGameStore()
  
  return useMutation({
    mutationFn: gameApi.joinGame,
    onSuccess: (data) => {
      setGameId(data.gameId)
      updatePlayers(data.players)
    },
  })
}

export function useLogin() {
  const { setCurrentPlayer } = useGameStore()
  
  return useMutation({
    mutationFn: gameApi.login,
    onSuccess: (data) => {
      localStorage.setItem('auth-token', data.token)
      setCurrentPlayer({
        id: data.playerId,
        nickname: data.nickname,
        isReady: false,
        isHost: false,
        isOnline: true,
      })
    },
  })
}

export function useStartGame() {
  const queryClient = useQueryClient()
  const { gameId } = useGameStore()
  
  return useMutation({
    mutationFn: (gameId: string) => gameApi.startGame(gameId),
    onSuccess: () => {
      // Invalidate game status to get updated phase
      if (gameId) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.GAME.STATUS(gameId) 
        })
      }
    },
  })
}

export function useSetReady() {
  const queryClient = useQueryClient()
  const { gameId } = useGameStore()
  
  return useMutation({
    mutationFn: ({ ready }: { ready: boolean }) => 
      gameApi.setReady(gameId!, ready),
    onSuccess: () => {
      if (gameId) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.GAME.STATUS(gameId) 
        })
      }
    },
  })
}

export function useVote() {
  const queryClient = useQueryClient()
  const { gameId, setUserVote } = useGameStore()
  
  return useMutation({
    mutationFn: ({ suspectedLiarId }: { suspectedLiarId: string }) => 
      gameApi.vote(gameId!, { suspectedLiarId }),
    onSuccess: (_, variables) => {
      setUserVote(variables.suspectedLiarId)
      if (gameId) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.GAME.STATUS(gameId) 
        })
      }
    },
  })
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient()
  const { gameId } = useGameStore()
  
  return useMutation({
    mutationFn: ({ answer }: { answer: string }) => 
      gameApi.submitAnswer(gameId!, answer),
    onSuccess: () => {
      if (gameId) {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.GAME.STATUS(gameId) 
        })
      }
    },
  })
}

// Round Results Query
export function useRoundResults(gameId: string | null, round: number) {
  return useQuery({
    queryKey: QUERY_KEYS.ROUND.RESULTS(gameId || '', round),
    queryFn: () => gameApi.getRoundResults(gameId!),
    enabled: !!gameId && round > 0,
  })
}