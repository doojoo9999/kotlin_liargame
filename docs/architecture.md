# Nemonemo Architecture

This document captures the high-level system design for the Nemonemo (Nonogram) platform. The diagrams below follow the requirements defined in `docs/nemonemo/DEVELOPMENT_PLAN.md`.

## 1. 전체 시스템 아키텍처

```mermaid
graph TD
    subgraph Client
        WebApp[React Web App]
        Editor[Puzzle Editor]
    end

    subgraph API["Spring Boot API"]
        RestAPI[REST Controllers]
        WS[WebSocket Gateway]
        Scheduler[Cron & Batch Jobs]
    end

    subgraph Services
        MatchService[Match-Making Service]
        AchievementService[Achievement Service]
        PuzzleWorker[Puzzle Worker\n(Solver & Analyzer)]
    end

    subgraph DataLayer
        PostgreSQL[(PostgreSQL)]
        Redis[(Redis)]
        ObjectStore[(CDN / Object Storage)]
    end

    WebApp -->|HTTPS| RestAPI
    Editor -->|HTTPS| RestAPI
    WebApp <-->|WebSocket| WS

    RestAPI -->|CRUD| PostgreSQL
    RestAPI -->|Cache / Sessions| Redis
    RestAPI -->|Assets| ObjectStore
    RestAPI -->|Tasks| PuzzleWorker
    Scheduler -->|Daily Picks / Season| RestAPI
    Scheduler -->|Preload| Redis

    WS -->|Match Events| MatchService
    MatchService -->|State| Redis

    AchievementService -->|Events| Redis
    AchievementService -->|Persistence| PostgreSQL
```

## 2. 플레이 시퀀스

```mermaid
sequenceDiagram
    participant Player
    participant WebApp as Web App
    participant API as Game API
    participant Redis
    participant DB as PostgreSQL

    Player->>WebApp: Load puzzle view
    WebApp->>API: GET /puzzles/{id}
    API->>Redis: Lookup cached puzzle
    alt cache miss
        API->>DB: Fetch puzzle & hints
        API->>Redis: Cache puzzle payload
    end
    API-->>WebApp: Puzzle details + state token
    Player->>WebApp: Cell interactions
    loop every 10 ops or 3s
        WebApp->>API: POST /plays/{id}/autosave
        API->>Redis: Store progress snapshot
    end
    Player->>WebApp: Submit solution
    WebApp->>API: POST /plays/{id}/submit
    API->>DB: Validate against puzzle_solutions
    API->>API: Calculate score & combo
    API->>DB: Persist play + score
    API->>Redis: Update leaderboard sorted sets
    API-->>WebApp: Result, score, updated stats
```

## 3. 업로드 파이프라인

```mermaid
flowchart TD
    subgraph Author Client
        EditorInput[Upload Puzzle/Grid]
    end

    EditorInput --> ValidateInputs{Validate size<br/>density<br/>isolated cells?}
    ValidateInputs -- No --> RejectLocal[Show validation errors]
    ValidateInputs -- Yes --> APIUpload[POST /puzzles/upload]

    APIUpload --> PersistDraft[Save draft puzzle<br/>status=DRAFT]
    PersistDraft --> QueueWorker[Enqueue analysis job]
    QueueWorker --> PuzzleWorker

    PuzzleWorker -->|Generate| Hints[puzzle_hints]
    PuzzleWorker -->|Solve| Solution[puzzle_solutions]
    PuzzleWorker -->|Compute| Difficulty[difficulty_score]
    PuzzleWorker -->|Classify| TextTagging[text_likeness_score<br/>content_style<br/>tags]
    PuzzleWorker -->|Validate| Uniqueness{Unique solution?}

    Uniqueness -- No --> FlagReject[Mark REJECTED + reason]
    Uniqueness -- Yes --> FlagApprove[Mark APPROVED]

    FlagReject --> NotifyAuthor[Notify with rejection reason]
    FlagApprove --> Publish[Expose to catalog & search]
```

## 4. 오늘의 추천 선정 흐름

```mermaid
sequenceDiagram
    participant Cron as KST 00:00 Cron
    participant API
    participant DB as PostgreSQL
    participant Redis
    participant CDN as CDN/Edge Cache

    Cron->>API: Trigger daily picks job
    API->>DB: Fetch candidate puzzles (filters & weights)
    API->>API: Evaluate diversity & fallback rules
    API->>DB: INSERT daily_picks(date, items)
    API->>Redis: Cache list with TTL 24h
    API->>CDN: Prime edge cache (ETag/Last-Modified)
    Note over Redis,CDN: Clients pull from cache-first path
```

## 5. 멀티플레이어 매칭 및 세션

```mermaid
sequenceDiagram
    participant Client as Player Client
    participant API
    participant Match as Match-Making Service
    participant WS as WebSocket Broker
    participant Redis

    Client->>API: POST /multiplayer/sessions (JWT)
    API->>Match: Create session request
    Match->>Redis: Store lobby state
    API-->>Client: Session token + WS endpoint

    Client->>WS: Connect /ws/multiplayer/{session_id}
    WS->>Redis: Load session participants
    Match->>WS: Broadcast join/ready events
    loop Game loop
        Client->>WS: CELL_MARK / READY messages
        WS->>Match: Forward with subject_key
        Match->>Redis: Apply state delta
        Match->>WS: Broadcast updates
    end
    Match->>API: Final results callback
    API->>DB: Persist plays & scores
```

## 6. 도전 과제 및 업적 처리

```mermaid
stateDiagram-v2
    [*] --> Inactive
    Inactive --> Active : challenge start_date reached
    Active --> Tracking : player engages with event bus
    state Tracking {
        [*] --> Progressing
        Progressing --> Completed : requirements met
        Completed --> RewardPending : player notified
        RewardPending --> Claimed : reward claimed API
    }
    Tracking --> Expired : end_date reached
    Claimed --> [*]
    Expired --> [*]
```

```mermaid
flowchart LR
    PlayEvents[Play Events\n(Kafka/Redis Stream)] --> Eval[Achievement Service]
    Eval --> UpdateProgress[Update user_challenges\nuser_achievements]
    Eval --> Notify[Send push/in-app notification]
    UpdateProgress --> DB[(PostgreSQL)]
    Notify --> Redis[(Redis Pub/Sub)]
    Redis --> WebApp[Web Client\n(Toast/Inbox)]
```
