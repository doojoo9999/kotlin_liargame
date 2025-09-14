import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {gameApi} from '@/api/gameApi'
import {QUERY_KEYS} from '@/lib/queryClient'
import {useGameStore} from '@/stores'

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
    onSuccess: (data: unknown) => {
      // Type guard for data
      if (data && typeof data === 'object' && 'gameId' in data && 'sessionCode' in data) {
        const gameData = data as { gameId: string; sessionCode: string }
        setGameId(gameData.gameId)
        setSessionCode(gameData.sessionCode)
        // Host player will be set separately after login
      }
    },
  })
}

export function useJoinGame() {
  const { setGameId, updatePlayers } = useGameStore()
  
  return useMutation({
    mutationFn: gameApi.joinGame,
    onSuccess: (data: unknown) => {
      // Type guard for data
      if (data && typeof data === 'object' && 'gameId' in data && 'players' in data) {
        const gameData = data as { gameId: string; players: any[] }
        setGameId(gameData.gameId)
        updatePlayers(gameData.players)
      }
    },
  })
}

export function useLogin() {
  const { setCurrentPlayer } = useGameStore()
  
  return useMutation({
    mutationFn: gameApi.login,
    onSuccess: (data: unknown) => {
      // Type guard for data
      if (data && typeof data === 'object' && 'success' in data) {
        const loginData = data as { success: boolean; userId?: number; nickname?: string }
        if (loginData.success && loginData.userId && loginData.nickname) {
          // 백엔드 응답에 맞춰 세션 기반 인증 사용
          setCurrentPlayer({
            id: loginData.userId.toString(),
            nickname: loginData.nickname,
            isReady: false,
            isHost: false,
            isOnline: true,
          })
        }
      }
    },
  })
}

export function useStartGame() {
  const queryClient = useQueryClient()
  const { gameId } = useGameStore()
  
  return useMutation({
    mutationFn: (gameId: string) => gameApi.startGame(parseInt(gameId)),
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
    onSuccess: (data: unknown, variables) => {
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
    onSuccess: (data: unknown) => {
      // Add type guard or use data if needed
      console.log('Answer submitted successfully:', data)
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