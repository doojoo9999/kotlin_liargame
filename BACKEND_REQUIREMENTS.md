# Backend API Requirements for Frontend Development

This document lists the required changes and additions to the backend API for the frontend to function correctly.

## 1. GameStateResponse DTO Enhancements

To complete the game loop and provide a better user experience, the `GameStateResponse` DTO needs the following fields:

### 1.1. Turn and Phase Management (Implemented)

- **`turnOrder: List<String>?`**: An array of player nicknames representing the order of play.
- **`currentTurnIndex: Int?`**: The index of the current player in the `turnOrder` array.
- **`phaseEndTime: String?`**: An ISO 8601 timestamp string indicating when the current phase (e.g., SPEECH, VOTE) will end.

### 1.2. Player State (Partially Implemented)

- **`PlayerResponse.hasVoted: Boolean`**: Should be `true` if the player has cast their vote in the current voting phase, `false` otherwise.

### 1.3. Game Result Information (NEW)

When the game state is `ENDED`, the following fields should be populated:

- **`winner: String?`**: A string indicating the winning team, e.g., `"CITIZEN"` or `"LIAR"`.
- **`reason: String?`**: A brief description of why the game ended, e.g., "라이어를 모두 찾아냈습니다." or "라이어가 단어를 맞혔습니다.".
- **All player roles**: When the game is over, the `role` field for every player in the `players` list should be revealed to everyone.

---

## 2. CreateGameRoomRequest DTO Enhancements (NEW)

To support advanced game creation options from the frontend, the `POST /api/v1/game/create` endpoint's request body DTO (`CreateGameRoomRequest`) should accept the following new fields:

- **`gameTotalRounds: Int`**: The total number of rounds for the game. (e.g., 1 to 10)
- **`gameLiarCount: Int`**: The number of liars in the game. (e.g., 1 to 5)

The backend should use these values to configure the created game room accordingly.

---

## 3. Game Logic and State Transition (NEW)

The frontend relies on the backend to be the single source of truth for all game logic and state transitions. The backend must automatically advance the game phase when certain conditions are met.

### 3.1. Phase Advancement Logic

The backend should monitor the game state and automatically transition the `currentPhase` when a phase is complete. This is critical for the game to progress.

- **`SPEECH` to `VOTE`**: After the last player in `turnOrder` submits their hint (or their turn times out), the `currentPhase` should change to `VOTE`, and a new `phaseEndTime` for the voting period should be set.
- **`VOTE` to `DEFENSE` or `SPEECH`**: After all players have voted (or the timer runs out), the backend must tally the votes. 
    - If there is a single player with the most votes, the `currentPhase` should become `DEFENSE`. The `accusedPlayer` field should be populated, and a new `phaseEndTime` for the defense period should be set.
    - If there is a tie, the game should ideally return to the `SPEECH` phase for another round of hints.
- **`DEFENSE` to `FINAL_VOTE`**: When the defense timer runs out, the `currentPhase` should change to `FINAL_VOTE`, and a new `phaseEndTime` should be set.
- **`FINAL_VOTE` to `LIAR_GUESS` or `SPEECH` or `ENDED`**: After the final vote is complete:
    - If the accused player is voted out AND they were the liar, the `currentPhase` should become `LIAR_GUESS`.
    - If the accused player is voted out AND they were a citizen, the game might continue to the next round (`SPEECH`) or end, depending on the number of remaining players.
    - If the accused player survives the vote, the game should continue to the next round (`SPEECH`).
- **`LIAR_GUESS` to `ENDED`**: After the liar submits their guess (or the timer runs out), the `currentPhase` must become `ENDED`.

### 3.2. Game End Logic

The backend is responsible for determining the winner. When `currentPhase` is set to `ENDED`, the `winner` and `reason` fields must be correctly populated based on the final game state. All player roles should also be revealed at this time.
