import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {gameApi} from '@/api/gameApi'
import {QUERY_KEYS} from '@/lib/queryClient'
import type {
    ConnectionStatusResponse,
    CountdownResponse,
    PlayerReadyResponse,
    VotingStatusResponse
} from '@/types/realtime'

export function useReadyStatus(gameNumber: number | null) {
  return useQuery<PlayerReadyResponse[]>({
    queryKey: gameNumber ? QUERY_KEYS.REALTIME.READY_STATUS(gameNumber) : ['realtime','ready-status','-'],
    queryFn: () => gameApi.getReadyStatus(gameNumber!),
    enabled: !!gameNumber,
    refetchInterval: 2000,
  })
}

export function useCountdownStatus(gameNumber: number | null) {
  return useQuery<CountdownResponse>({
    queryKey: gameNumber ? QUERY_KEYS.REALTIME.COUNTDOWN(gameNumber) : ['realtime','countdown','-'],
    queryFn: () => gameApi.getCountdownStatus(gameNumber!),
    enabled: !!gameNumber,
    refetchInterval: 1000,
  })
}

export function useConnectionStatus(gameNumber: number | null) {
  return useQuery<ConnectionStatusResponse>({
    queryKey: gameNumber ? QUERY_KEYS.REALTIME.CONNECTION_STATUS(gameNumber) : ['realtime','connection-status','-'],
    queryFn: () => gameApi.getConnectionStatus(gameNumber!),
    enabled: !!gameNumber,
    refetchInterval: 3000,
  })
}

export function useVotingStatus(gameNumber: number | null) {
  return useQuery<VotingStatusResponse>({
    queryKey: gameNumber ? QUERY_KEYS.REALTIME.VOTING_STATUS(gameNumber) : ['realtime','voting-status','-'],
    queryFn: () => gameApi.getVotingStatus(gameNumber!),
    enabled: !!gameNumber,
    refetchInterval: 1500,
  })
}

export function useToggleReady(gameNumber: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!gameNumber) throw new Error('invalid gameNumber')
      await gameApi.toggleReady(gameNumber)
    },
    onSuccess: () => {
      if (!gameNumber) return
      qc.invalidateQueries({queryKey: QUERY_KEYS.REALTIME.READY_STATUS(gameNumber)})
    }
  })
}

export function useCountdownControls(gameNumber: number | null) {
  const qc = useQueryClient()
  const start = useMutation({
    mutationFn: async () => {
      if (!gameNumber) throw new Error('invalid gameNumber')
      await gameApi.startCountdown(gameNumber)
    },
    onSuccess: () => {
      if (!gameNumber) return
      qc.invalidateQueries({queryKey: QUERY_KEYS.REALTIME.COUNTDOWN(gameNumber)})
    }
  })
  const cancel = useMutation({
    mutationFn: async () => {
      if (!gameNumber) throw new Error('invalid gameNumber')
      await gameApi.cancelCountdown(gameNumber)
    },
    onSuccess: () => {
      if (!gameNumber) return
      qc.invalidateQueries({queryKey: QUERY_KEYS.REALTIME.COUNTDOWN(gameNumber)})
    }
  })
  return { start, cancel }
}

