package org.example.kotlin_liargame

/**
 * This file demonstrates the sequence of API calls needed to simulate 10 users playing the Liar Game.
 * It's not an actual test, but rather a documentation of how to use the API.
 * 
 * The game flow is as follows:
 * 1. Create 10 users with nicknames
 * 2. Register a subject
 * 3. Register appropriate words for the subject
 * 4. Create a game room
 * 5. Make users join the game
 * 6. Start the game
 * 7. Play multiple rounds:
 *    a. All players give hints
 *    b. All players vote for who they think is the liar
 *    c. The accused player defends
 *    d. All players vote on whether the accused player survives
 *    e. If the accused player is a liar and was eliminated, they can guess the word
 * 8. Get the final game result
 */

/**
 * Step 1: Create 10 users with nicknames
 * 
 * POST /api/v1/user/add
 * {
 *   "nickname": "Player1",
 *   "profileImgUrl": "https://example.com/profile1.jpg"
 * }
 * 
 * Repeat for Player2 through Player10
 */

/**
 * Step 2: Register a subject
 * 
 * POST /api/v1/subject
 * {
 *   "content": "동물"
 * }
 */

/**
 * Step 3: Register words for the subject
 * 
 * POST /api/v1/word
 * {
 *   "subject": "동물",
 *   "word": "사자"
 * }
 * 
 * Repeat for other words: "호랑이", "코끼리", "기린", "팬더", "원숭이", "고릴라", "하마", "악어", "코알라"
 */

/**
 * Step 4: Create a game room with the first user
 * 
 * POST /api/v1/game/room
 * {
 *   "nickname": "Player1",
 *   "gName": "Test Game",
 *   "gPassword": null,
 *   "gParticipants": 10,
 *   "gTotalRounds": 3,
 *   "gLiarCount": 2,
 *   "gGameMode": "LIARS_KNOW"
 * }
 * 
 * Response: Game number (e.g., 1)
 */

/**
 * Step 5: Make all users join the game
 * 
 * POST /api/v1/game/join
 * {
 *   "gNumber": 1,
 *   "gPassword": null
 * }
 * 
 * Repeat for Player2 through Player10
 * 
 * Response: GameStateResponse with current game state and players
 */

/**
 * Step 6: Start the game
 * 
 * POST /api/v1/game/start
 * {
 *   "gNumber": 1,
 *   "subjectId": null  // Optional, if null a random subject will be selected
 * }
 * 
 * Response: GameStateResponse with updated game state and players
 * Players will be assigned roles (CITIZEN or LIAR) and subjects
 */

/**
 * Step 7a: All players give hints
 * 
 * POST /api/v1/game/hint
 * {
 *   "gNumber": 1,
 *   "hint": "This animal is related to 사"  // For citizens, hint related to the word
 * }
 * 
 * For liars, the hint would be more vague:
 * {
 *   "gNumber": 1,
 *   "hint": "I'm thinking of something with legs"
 * }
 * 
 * Repeat for all players
 * 
 * Response: GameStateResponse with updated game state and players
 */

/**
 * Step 7b: All players vote for who they think is the liar
 * 
 * POST /api/v1/game/vote
 * {
 *   "gNumber": 1,
 *   "targetPlayerId": 3  // ID of the player being voted for
 * }
 * 
 * Repeat for all players
 * 
 * Response: GameStateResponse with updated game state and players
 * One player will be marked as ACCUSED
 */

/**
 * Step 7c: Accused player defends
 * 
 * POST /api/v1/game/defend
 * {
 *   "gNumber": 1,
 *   "defense": "I am not the liar, I swear!"
 * }
 * 
 * Response: GameStateResponse with updated game state and players
 */

/**
 * Step 7d: All players vote on whether the accused player survives
 * 
 * POST /api/v1/game/survival-vote
 * {
 *   "gNumber": 1,
 *   "accusedPlayerId": 3,  // ID of the accused player
 *   "voteToSurvive": true  // true to vote for survival, false to vote for elimination
 * }
 * 
 * Repeat for all players except the accused
 * 
 * Response: GameStateResponse with updated game state and players
 * The accused player will be marked as SURVIVED or ELIMINATED
 */

/**
 * Step 7e: If the accused player is a liar and was eliminated, they can guess the word
 * 
 * POST /api/v1/game/guess
 * {
 *   "gNumber": 1,
 *   "guess": "호랑이"  // Liar's guess of the word
 * }
 * 
 * Response: GameResultResponse with game result
 * If the guess is correct, the liar team wins
 */

/**
 * Step 8: Get the final game result
 * 
 * GET /api/v1/game/result?gNumber=1
 * 
 * Response: GameResultResponse with final game result
 * The winning team will be CITIZENS or LIARS
 */

/**
 * Example of a complete round:
 * 
 * 1. All players give hints:
 *    - Player1 (CITIZEN): "This animal is related to 사"
 *    - Player2 (CITIZEN): "This animal is related to 호"
 *    - Player3 (LIAR): "I'm thinking of something with legs"
 *    - Player4 (CITIZEN): "This animal is related to 코"
 *    - ...
 * 
 * 2. All players vote:
 *    - Player1 votes for Player3
 *    - Player2 votes for Player3
 *    - Player3 votes for Player5
 *    - Player4 votes for Player3
 *    - ...
 * 
 * 3. Player3 is accused and defends:
 *    - "I am not the liar, I swear!"
 * 
 * 4. All players vote on survival:
 *    - Player1 votes to eliminate
 *    - Player2 votes to eliminate
 *    - Player4 votes to eliminate
 *    - ...
 * 
 * 5. Player3 is eliminated and guesses the word:
 *    - "호랑이"
 * 
 * 6. If the guess is incorrect, the game continues to the next round
 *    If the guess is correct, the liar team wins
 *    If all liars are eliminated, the citizen team wins
 */