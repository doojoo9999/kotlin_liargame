package org.example.kotlin_liargame.domain.game.dto

/**
 * Shared contract version identifiers used to tag responses and realtime events.
 */
object GameContractVersions {
    const val GAME_FLOW = "game-flow/2024-09-18"
    const val REALTIME_EVENTS = "game-realtime/2024-09-18"
}

interface VersionedPayload {
    val schemaVersion: String
}

interface GameFlowPayload : VersionedPayload {
    override val schemaVersion: String
        get() = GameContractVersions.GAME_FLOW
}

interface GameRealtimePayload : VersionedPayload {
    override val schemaVersion: String
        get() = GameContractVersions.REALTIME_EVENTS
}
