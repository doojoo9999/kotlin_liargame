# ADR-003: Multiplayer Architecture

## Status
Accepted — 2024-10-09

## Context
Multiplayer introduces real-time collaboration, competition, and relay modes. Latency requirements (<250 ms) and cross-client synchronization demand a scalable messaging backbone. Existing backend services primarily expose REST APIs; we need a WebSocket solution that fits Spring Boot and can scale horizontally.

## Decision
- Use Spring WebSocket (STOMP over SockJS) for initial delivery because it integrates with Spring Security and supports fallback transports.
- Introduce a dedicated Match-Making Service responsible for lobby management, seating players, and orchestrating game states. This service communicates with WebSocket brokers through Redis Pub/Sub topics namespaced by `session_id`.
- Persist authoritative game state deltas in Redis (hash or stream) to support reconnection and to share state across instances.
- Continue using REST API for lobby CRUD and post-game persistence (scores, plays). WebSocket channels focus on low-latency updates only.
- Adopt an event-driven approach: final results are pushed from the match service to the API via internal REST callback or message queue, ensuring durability before notifying players.

## Consequences
- Redis becomes a critical dependency; we need monitoring, persistence (AOF), and sharding strategy for >1k concurrent rooms.
- Match service must be horizontally scalable; session affinity on WebSocket gateways is required so that all messages for a session reach the same worker.
- Testing requires simulation harnesses for concurrent WebSocket clients; we will rely on integration tests plus soak tests before production.
