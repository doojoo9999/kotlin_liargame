import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import type {
    ConnectionStatus,
    ConnectionStoreActions,
    ConnectionStoreState,
    LatencySample,
    OptimisticUpdate,
    OutgoingMessage,
    PendingMessage,
    SyncIssue,
} from '@/types/store';
import {websocketService} from '@/services/websocketService';
import {useGameStore} from '@/stores';

type GameStoreSnapshot = ReturnType<typeof useGameStore.getState>;

const MAX_LATENCY_SAMPLES = 20;
const genId = () => (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));

const initialState: ConnectionStoreState = {
  status: 'idle',
  error: undefined,
  reconnectAttempts: 0,
  maxReconnectAttempts: 8,
  lastConnectedAt: undefined,
  lastDisconnectedAt: undefined,
  lastPingAt: undefined,
  lastPongAt: undefined,
  avgLatency: undefined,
  latencySamples: [],
  messageQueue: [],
  pendingMessages: {},
  processingQueue: false,
  optimisticUpdates: {},
  syncIssues: [],
};

export const useConnectionStore = create<ConnectionStoreState & ConnectionStoreActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      connect: async () => {
        const { status } = get();
        if (status === 'connecting' || status === 'connected') return;
        set({ status: 'connecting', error: undefined });
        try {
          await websocketService.connect();
          websocketService.addConnectionCallback((connected) => {
            set(s => ({
              status: connected ? ('connected' as ConnectionStatus) : ('disconnected' as ConnectionStatus),
              lastConnectedAt: connected ? Date.now() : s.lastConnectedAt,
              lastDisconnectedAt: connected ? s.lastDisconnectedAt : Date.now(),
            }));
            if (connected) {
              // 재연결 시 큐 처리
              websocketService.processQueue();
              get().processQueue();
            }
          });
          // Raw listener -> 간단한 RTT 측정(첫 inbound 기준)
          websocketService.registerRawListener(raw => {
            if (raw.type === 'event') {
              const sample: LatencySample = { id: genId(), sentAt: raw.receivedAt, receivedAt: raw.receivedAt, rtt: 0 };
              get().recordLatency(sample);
            }
          });
          set({ status: 'connected', lastConnectedAt: Date.now() });
        } catch (e) {
          set({ status: 'error', error: e instanceof Error ? e.message : '연결 실패' });
        }
      },
      disconnect: () => {
        websocketService.disconnect();
        set({ status: 'disconnected', lastDisconnectedAt: Date.now() });
      },
      sendMessage: (destination, body, opts) => {
        // 낙관적 업데이트 처리
        let optimisticId: string | undefined;
        if (opts?.optimisticState) {
          const gameStoreState = useGameStore.getState();
          const optimisticState = opts.optimisticState as Partial<GameStoreSnapshot>;
          const original = {} as Partial<GameStoreSnapshot>;
          const originalRecord = original as Record<keyof GameStoreSnapshot, GameStoreSnapshot[keyof GameStoreSnapshot] | undefined>;
          for (const key of Object.keys(optimisticState) as Array<keyof GameStoreSnapshot>) {
            originalRecord[key] = gameStoreState[key];
          }
          optimisticId = get().addOptimisticUpdate({
            action: destination,
            optimisticState: opts.optimisticState,
            originalState: original,
          });
          // 적용
          useGameStore.setState(optimisticState);
        }
        // 실제 전송 (offline 시 queue)
        const id = websocketService.safePublish(destination, body) || genId();
        // pendingMessages 등록
        const pending: PendingMessage = {
          id,
          destination,
          body,
          timestamp: Date.now(),
          attempts: 1,
          optimisticUpdateId: optimisticId,
          status: 'sent',
          lastAttempt: Date.now(),
        };
        set(state => ({
          pendingMessages: { ...state.pendingMessages, [id]: pending },
        }));
      },
      queueMessage: (msg) => {
        const id = msg.id || genId();
        const queued: OutgoingMessage = {
          id,
          destination: msg.destination,
          body: msg.body,
          attempts: 0,
          timestamp: Date.now(),
          optimisticUpdateId: msg.optimisticUpdateId,
        };
        set(state => ({ messageQueue: [...state.messageQueue, queued] }));
        return id;
      },
      processQueue: async () => {
        const { messageQueue, processingQueue } = get();
        if (processingQueue || get().status !== 'connected') return;
        if (!messageQueue.length) return;
        set({ processingQueue: true });
        const remaining: OutgoingMessage[] = [];
        for (const m of messageQueue) {
          try {
            websocketService.safePublish(m.destination, m.body);
          } catch {
            m.attempts += 1;
            if (m.attempts < 3) remaining.push(m);
          }
        }
        set({ messageQueue: remaining, processingQueue: false });
      },
      setStatus: (status, error) => set({ status, error }),
      recordLatency: (sample) => set(state => {
        const samples = [...state.latencySamples, sample].slice(-MAX_LATENCY_SAMPLES);
        const avg = samples.reduce((a, b) => a + b.rtt, 0) / samples.length || undefined;
        return { latencySamples: samples, avgLatency: avg };
      }),
      clearLatency: () => set({ latencySamples: [], avgLatency: undefined }),
      addOptimisticUpdate: (update) => {
        const id = genId();
        const optimistic: OptimisticUpdate = {
          id,
          timestamp: Date.now(),
          confirmed: false,
          rolledBack: false,
          ...update,
        };
        set(state => ({ optimisticUpdates: { ...state.optimisticUpdates, [id]: optimistic } }));
        return id;
      },
      confirmOptimistic: (id, serverState) => {
        const { optimisticUpdates } = get();
        const target = optimisticUpdates[id];
        if (!target) return;
        // 서버 상태 반영(간단 merge)
        if (serverState) {
          useGameStore.setState(serverState);
        }
        target.confirmed = true;
        set(state => ({ optimisticUpdates: { ...state.optimisticUpdates, [id]: target } }));
      },
      rollbackOptimistic: (id) => {
        const { optimisticUpdates } = get();
        const target = optimisticUpdates[id];
        if (!target || target.rolledBack) return;
        useGameStore.setState(target.originalState);
        target.rolledBack = true;
        set(state => ({ optimisticUpdates: { ...state.optimisticUpdates, [id]: target } }));
      },
      addSyncIssue: (issue) => {
        const syncIssue: SyncIssue = { id: genId(), timestamp: Date.now(), ...issue };
        set(state => ({ syncIssues: [...state.syncIssues, syncIssue] }));
      },
      clearSyncIssues: () => set({ syncIssues: [] }),
      pruneQueue: () => set(state => ({ messageQueue: state.messageQueue.filter(m => Date.now() - m.timestamp < 30000) })),
    })
  )
);

export type ConnectionStore = ReturnType<typeof useConnectionStore.getState>;
