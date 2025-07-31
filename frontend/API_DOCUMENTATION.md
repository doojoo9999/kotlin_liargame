# Liar Game Backend API Documentation

This document provides comprehensive information about all backend API endpoints, including request/response structures, service flows, responsibilities, roles, and validation rules for frontend development.

## Table of Contents

1. [Authentication](#authentication)
   - [Login](#login)
2. [Chat](#chat)
   - [Send Message](#send-message)
   - [Get Chat History](#get-chat-history)
   - [Get Post-Round Messages](#get-post-round-messages)
   - [WebSocket Chat](#websocket-chat)
3. [Game](#game)
   - [Create Game Room](#create-game-room)
   - [Join Game](#join-game)
   - [Leave Game](#leave-game)
   - [Start Game](#start-game)
   - [Give Hint](#give-hint)
   - [Vote](#vote)
   - [Defend](#defend)
   - [Survival Vote](#survival-vote)
   - [Guess Word](#guess-word)
   - [Get Game State](#get-game-state)
   - [Get Game Result](#get-game-result)
   - [End of Round](#end-of-round)
   - [Get All Game Rooms](#get-all-game-rooms)
4. [Subject](#subject)
   - [Apply Subject](#apply-subject)
   - [Delete Subject](#delete-subject)
   - [List Subjects](#list-subjects)
5. [User](#user)
   - [Add User](#add-user)
6. [Word](#word)
   - [Apply Word](#apply-word)
   - [Delete Word](#delete-word)
   - [List Words](#list-words)

---

## Authentication

### Login

Authenticates a user with a nickname and returns a JWT token.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "nickname": "string"
}
```

**Response:**
```json
{
  "accessToken": "string"
}
```

**Validation Rules:**
- Nickname must not be already authenticated
- Nickname must not be already in use but not authenticated
- Nickname must not have active tokens

**Error Responses:**
- 400 Bad Request: If validation fails
  ```json
  {
    "message": "중복 닉네임이 불가능합니다. 다른 닉네임을 사용해주세요."
  }
  ```
  or
  ```json
  {
    "message": "이미 사용 중인 비인증 닉네임입니다. 다른 닉네임을 사용해주세요."
  }
  ```
  or
  ```json
  {
    "message": "이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요."
  }
  ```
- 500 Internal Server Error: If an unexpected error occurs
  ```json
  {
    "message": "서버 오류가 발생했습니다"
  }
  ```

**Service Flow:**
1. Check if the nickname is already authenticated (throws IllegalArgumentException)
2. Check if the nickname is already in use but not authenticated (throws IllegalArgumentException)
3. Check if there are active tokens for the nickname (throws IllegalArgumentException)
4. If the user exists but is inactive, reactivate the user
5. If the user doesn't exist, create a new user
6. Generate a JWT token with a 1-hour expiration time
7. Save the token in the database
8. Return a TokenResponse with the accessToken

---

## Chat

### Send Message

Sends a chat message to a game room.

**Endpoint:** `POST /api/v1/chat/send`

**Request Body:**
```json
{
  "gNumber": 123,
  "content": "Hello, world!"
}
```

**Response:**
```json
{
  "id": 1,
  "playerId": 1,
  "playerNickname": "string",
  "content": "Hello, world!",
  "timestamp": "2023-07-31T16:12:00Z",
  "type": "NORMAL"
}
```

**Validation Rules:**
- Game number must be positive
- Message content cannot be empty
- Message content cannot exceed 500 characters

**Error Responses:**
- 400 Bad Request: If validation fails

**Service Flow:**
1. Validate the request
2. Determine if chat is available for the current game state
3. Determine the message type based on game state
4. Save the message to the database
5. Return the saved message as a response

### Get Chat History

Retrieves chat history for a game room with optional filters.

**Endpoint:** `GET /api/v1/chat/history`

**Query Parameters:**
- `gNumber` (required): Game number
- `type` (optional): Message type (e.g., NORMAL, HINT, VOTE, POST_ROUND)
- `round` (optional): Game round number
- `limit` (optional, default: 50): Maximum number of messages to return

**Response:**
```json
[
  {
    "id": 1,
    "playerId": 1,
    "playerNickname": "string",
    "content": "Hello, world!",
    "timestamp": "2023-07-31T16:12:00Z",
    "type": "NORMAL"
  }
]
```

**Validation Rules:**
- Game number must be positive
- Limit must be between 1 and 100
- If round is specified, it must be positive

**Error Responses:**
- 400 Bad Request: If validation fails

**Service Flow:**
1. Validate the request
2. Query the database for messages matching the criteria
3. Return the messages as a response

### Get Post-Round Messages

Retrieves post-round messages for a game room.

**Endpoint:** `GET /api/v1/chat/post-round/{gNumber}`

**Path Parameters:**
- `gNumber`: Game number

**Query Parameters:**
- `limit` (optional, default: 10): Maximum number of messages to return

**Response:**
```json
[
  {
    "id": 1,
    "playerId": 1,
    "playerNickname": "string",
    "content": "Good game!",
    "timestamp": "2023-07-31T16:12:00Z",
    "type": "POST_ROUND"
  }
]
```

**Validation Rules:**
- Game number must be positive
- Limit must be between 1 and 100

**Error Responses:**
- 400 Bad Request: If validation fails

**Service Flow:**
1. Create a GetChatHistoryRequest with type POST_ROUND
2. Call the getChatHistory method
3. Return the messages as a response

### WebSocket Chat

Handles real-time chat messages via WebSocket.

**Endpoint:** `/chat.send` (WebSocket)

**Message Format:**
```json
{
  "gNumber": 123,
  "content": "Hello, world!"
}
```

**Response Topic:** `/topic/chat.{gNumber}`

**Response Format:**
```json
{
  "id": 1,
  "playerId": 1,
  "playerNickname": "string",
  "content": "Hello, world!",
  "timestamp": "2023-07-31T16:12:00Z",
  "type": "NORMAL"
}
```

**Service Flow:**
1. Receive a message via WebSocket
2. Process the message using the sendMessage method
3. Broadcast the response to all subscribers of the game's topic

---

## Game

### Create Game Room

Creates a new game room.

**Endpoint:** `POST /api/v1/game/create`

**Request Body:**
```json
{
  "title": "string",
  "maxPlayers": 8,
  "password": "string",
  "subjectId": 1
}
```

**Response:**
```json
123
```
(Returns the game number)

**Service Flow:**
1. Create a new game room with the specified parameters
2. Return the game number

### Join Game

Joins an existing game room.

**Endpoint:** `POST /api/v1/game/join`

**Request Body:**
```json
{
  "gNumber": 123,
  "password": "string"
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "WAITING",
  "gamePhase": "NONE",
  "round": 0,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true,
      "hintGiven": false
    }
  ],
  "subject": {
    "id": 1,
    "name": "string"
  },
  "currentTurnPlayerId": null,
  "accusedPlayerId": null,
  "defendingPlayerId": null,
  "timeRemaining": 0,
  "word": null
}
```

**Service Flow:**
1. Validate the game number and password
2. Add the current user to the game
3. Return the updated game state

### Leave Game

Leaves a game room.

**Endpoint:** `POST /api/v1/game/leave`

**Request Body:**
```json
{
  "gNumber": 123
}
```

**Response:**
```json
true
```
(Returns true if successful)

**Service Flow:**
1. Remove the current user from the game
2. Return true if successful

### Start Game

Starts a game.

**Endpoint:** `POST /api/v1/game/start`

**Request Body:**
```json
{
  "gNumber": 123
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "gamePhase": "HINT",
  "round": 1,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true,
      "hintGiven": false
    }
  ],
  "subject": {
    "id": 1,
    "name": "string"
  },
  "currentTurnPlayerId": 1,
  "accusedPlayerId": null,
  "defendingPlayerId": null,
  "timeRemaining": 60,
  "word": "string"
}
```

**Service Flow:**
1. Validate that the current user is the host
2. Start the game if enough players are present
3. Assign roles (liar, normal players)
4. Return the updated game state

### Give Hint

Gives a hint during the hint phase.

**Endpoint:** `POST /api/v1/game/hint`

**Request Body:**
```json
{
  "gNumber": 123,
  "hint": "string"
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "gamePhase": "HINT",
  "round": 1,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true,
      "hintGiven": true
    }
  ],
  "subject": {
    "id": 1,
    "name": "string"
  },
  "currentTurnPlayerId": 2,
  "accusedPlayerId": null,
  "defendingPlayerId": null,
  "timeRemaining": 60,
  "word": "string"
}
```

**Service Flow:**
1. Validate that it's the current user's turn
2. Record the hint
3. Move to the next player's turn
4. Return the updated game state

### Vote

Votes for a player suspected to be the liar.

**Endpoint:** `POST /api/v1/game/vote`

**Request Body:**
```json
{
  "gNumber": 123,
  "targetPlayerId": 2
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "gamePhase": "VOTE",
  "round": 1,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true,
      "hintGiven": true
    }
  ],
  "subject": {
    "id": 1,
    "name": "string"
  },
  "currentTurnPlayerId": null,
  "accusedPlayerId": 2,
  "defendingPlayerId": null,
  "timeRemaining": 60,
  "word": "string"
}
```

**Service Flow:**
1. Record the vote
2. If all players have voted, determine the most voted player
3. Move to the defense phase if a player is accused
4. Return the updated game state

### Defend

Allows an accused player to defend themselves.

**Endpoint:** `POST /api/v1/game/defend`

**Request Body:**
```json
{
  "gNumber": 123,
  "defense": "string"
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "gamePhase": "SURVIVAL_VOTE",
  "round": 1,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true,
      "hintGiven": true
    }
  ],
  "subject": {
    "id": 1,
    "name": "string"
  },
  "currentTurnPlayerId": null,
  "accusedPlayerId": 2,
  "defendingPlayerId": 2,
  "timeRemaining": 60,
  "word": "string"
}
```

**Service Flow:**
1. Validate that the current user is the accused player
2. Record the defense
3. Move to the survival vote phase
4. Return the updated game state

### Survival Vote

Votes on whether the accused player should be eliminated.

**Endpoint:** `POST /api/v1/game/survival-vote`

**Request Body:**
```json
{
  "gNumber": 123,
  "voteToEliminate": true
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "gamePhase": "HINT",
  "round": 2,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true,
      "hintGiven": false
    }
  ],
  "subject": {
    "id": 1,
    "name": "string"
  },
  "currentTurnPlayerId": 1,
  "accusedPlayerId": null,
  "defendingPlayerId": null,
  "timeRemaining": 60,
  "word": "string"
}
```

**Service Flow:**
1. Record the survival vote
2. If all players have voted, determine if the accused player is eliminated
3. If the liar is eliminated, end the game
4. Otherwise, start the next round
5. Return the updated game state

### Guess Word

Allows the liar to guess the word.

**Endpoint:** `POST /api/v1/game/guess-word`

**Request Body:**
```json
{
  "gNumber": 123,
  "word": "string"
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "winner": "LIAR",
  "word": "string",
  "liarId": 2,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true
    }
  ]
}
```

**Service Flow:**
1. Validate that the current user is the liar
2. Check if the guessed word matches the actual word
3. End the game and determine the winner
4. Return the game result

### Get Game State

Retrieves the current state of a game.

**Endpoint:** `GET /api/v1/game/{gNumber}`

**Path Parameters:**
- `gNumber`: Game number

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "gamePhase": "HINT",
  "round": 1,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true,
      "hintGiven": false
    }
  ],
  "subject": {
    "id": 1,
    "name": "string"
  },
  "currentTurnPlayerId": 1,
  "accusedPlayerId": null,
  "defendingPlayerId": null,
  "timeRemaining": 60,
  "word": "string"
}
```

**Service Flow:**
1. Retrieve the game state for the specified game number
2. Return the game state

### Get Game Result

Retrieves the result of a completed game.

**Endpoint:** `GET /api/v1/game/result/{gNumber}`

**Path Parameters:**
- `gNumber`: Game number

**Response:**
```json
{
  "gameNumber": 123,
  "winner": "LIAR",
  "word": "string",
  "liarId": 2,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true
    }
  ]
}
```

**Service Flow:**
1. Retrieve the game result for the specified game number
2. Return the game result

### End of Round

Ends the current round of a game.

**Endpoint:** `POST /api/v1/game/end-of-round`

**Request Body:**
```json
{
  "gNumber": 123
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "gamePhase": "VOTE",
  "round": 1,
  "players": [
    {
      "id": 1,
      "nickname": "string",
      "avatarUrl": "string",
      "isHost": true,
      "isLiar": false,
      "isAlive": true,
      "hintGiven": true
    }
  ],
  "subject": {
    "id": 1,
    "name": "string"
  },
  "currentTurnPlayerId": null,
  "accusedPlayerId": null,
  "defendingPlayerId": null,
  "timeRemaining": 60,
  "word": "string"
}
```

**Service Flow:**
1. End the current round
2. Move to the vote phase
3. Return the updated game state

### Get All Game Rooms

Retrieves a list of all available game rooms.

**Endpoint:** `GET /api/v1/game/rooms`

**Response:**
```json
{
  "rooms": [
    {
      "gameNumber": 123,
      "title": "string",
      "host": "string",
      "playerCount": 4,
      "maxPlayers": 8,
      "hasPassword": true,
      "subject": "string",
      "state": "WAITING"
    }
  ]
}
```

**Service Flow:**
1. Retrieve all available game rooms
2. Return the list of game rooms

---

## Subject

### Apply Subject

Adds a new subject.

**Endpoint:** `POST /api/v1/subjects/applysubj`

**Request Body:**
```json
{
  "name": "string"
}
```

**Response:**
No content

**Service Flow:**
1. Add the new subject to the database

### Delete Subject

Deletes a subject.

**Endpoint:** `DELETE /api/v1/subjects/delsubj/{id}`

**Request Body:**
```json
{
  "id": 1,
  "name": "string"
}
```

**Response:**
No content

**Service Flow:**
1. Delete the subject from the database

### List Subjects

Retrieves a list of all subjects.

**Endpoint:** `GET /api/v1/subjects/listsubj`

**Response:**
```json
[
  {
    "id": 1,
    "name": "string"
  }
]
```

**Service Flow:**
1. Retrieve all subjects from the database
2. Return the list of subjects

---

## User

### Add User

Adds a new user.

**Endpoint:** `POST /api/v1/user/add`

**Request Body:**
```json
{
  "nickname": "string",
  "profileImgUrl": "string"
}
```

**Response:**
No content

**Service Flow:**
1. Add the new user to the database

---

## Word

### Apply Word

Adds a new word.

**Endpoint:** `POST /api/v1/words/applyw`

**Request Body:**
```json
{
  "word": "string",
  "subjectId": 1
}
```

**Response:**
No content

**Service Flow:**
1. Add the new word to the database

### Delete Word

Deletes a word.

**Endpoint:** `DELETE /api/v1/words/delw/{id}`

**Query Parameters:**
- `wordId`: Word ID

**Response:**
No content

**Service Flow:**
1. Delete the word from the database

### List Words

Retrieves a list of all words.

**Endpoint:** `GET /api/v1/words/wlist`

**Response:**
```json
[
  {
    "id": 1,
    "word": "string",
    "subjectId": 1,
    "subjectName": "string"
  }
]
```

**Service Flow:**
1. Retrieve all words from the database
2. Return the list of words