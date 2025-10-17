export const GAME_FLOW_SCHEMA_VERSION = 'game-flow/2024-09-18' as const
export const REALTIME_SCHEMA_VERSION = 'game-realtime/2024-09-18' as const

export type GameFlowSchemaVersion = typeof GAME_FLOW_SCHEMA_VERSION
export type RealtimeSchemaVersion = typeof REALTIME_SCHEMA_VERSION

export interface VersionedPayload<SchemaVersion extends string> {
  schemaVersion?: SchemaVersion
}

export type GameFlowPayload = VersionedPayload<GameFlowSchemaVersion>
export type GameRealtimePayload = VersionedPayload<RealtimeSchemaVersion>

export const isGameFlowPayload = <T extends VersionedPayload<string>>(payload: T): payload is T & VersionedPayload<GameFlowSchemaVersion> => {
  return (
    payload.schemaVersion === undefined ||
    payload.schemaVersion === GAME_FLOW_SCHEMA_VERSION
  )
}

export const isRealtimePayload = <T extends VersionedPayload<string>>(payload: T): payload is T & VersionedPayload<RealtimeSchemaVersion> => {
  return (
    payload.schemaVersion === undefined ||
    payload.schemaVersion === REALTIME_SCHEMA_VERSION
  )
}
