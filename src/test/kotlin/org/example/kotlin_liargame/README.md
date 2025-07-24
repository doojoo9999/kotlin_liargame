# Liar Game Simulation

This directory contains files for simulating the Liar Game with 10 users.

## Files

1. `LiarGameApiSimulation.kt` - Documentation of the API calls needed to play the Liar Game
2. `LiarGameSimulationRunner.kt` - A standalone application that simulates 10 users playing the Liar Game

## How to Run the Simulation

### Option 1: Run the Simulation Runner

The `LiarGameSimulationRunner.kt` file contains a main method that simulates 10 users playing the Liar Game. To run it:

1. Make sure the application is running
2. Run the file as a Kotlin application:
   ```
   cd D:\workspaces\kotlin_liargame
   ./gradlew test --tests "org.example.kotlin_liargame.LiarGameSimulationRunner"
   ```

Note: The simulation doesn't actually make HTTP requests to the API endpoints, but instead simulates the game flow with console output. In a real implementation, you would need to make HTTP requests to the API endpoints.

### Option 2: Use the API Documentation

The `LiarGameApiSimulation.kt` file contains documentation of the API calls needed to play the Liar Game. You can use this as a reference to make the actual API calls using a tool like Postman or curl.

## Expected Output

When running the simulation, you should see output similar to the following:

```
Starting Liar Game Simulation with 10 users

=== Creating 10 users ===
Created user: Player1_1234
Created user: Player2_5678
...

=== Registering subject: 동물 ===
Registered subject: 동물

=== Registering words for subject: 동물 ===
Registered word: 사자
Registered word: 호랑이
...

=== Creating game room ===
Created game room: 1

=== Users joining game ===
User Player2_5678 joined the game
...

=== Starting game ===
Player Player1_1234 has role CITIZEN and ID 1
Player Player2_5678 has role LIAR and ID 2
...
Game started

=== Playing rounds ===

--- Round 1 ---

- Players giving hints
Player Player1_1234 (CITIZEN) gave hint: This animal is related to 사
Player Player2_5678 (LIAR) gave hint: I'm thinking of something with legs
...

- Players voting
Player Player1_1234 voted for Player2_5678
...

- Player Player3_9012 was accused

Accused player Player3_9012 defended: I am not the liar, I swear!

- Players voting on survival
Player Player1_1234 voted to eliminate Player3_9012
...

- Player Player3_9012 was eliminated

--- Round 2 ---
...

=== Getting game result ===
Game result: CITIZENS win!

Simulation completed successfully!
```

## Game Flow

The Liar Game follows this flow:

1. Create users with nicknames
2. Register a subject
3. Register words for the subject
4. Create a game room
5. Make users join the game
6. Start the game
7. Play multiple rounds:
   a. All players give hints
   b. All players vote for who they think is the liar
   c. The accused player defends
   d. All players vote on whether the accused player survives
   e. If the accused player is a liar and was eliminated, they can guess the word
8. Get the final game result

## Game Rules

- The game has citizens and liars
- Citizens know the correct subject and word
- Liars don't know the correct subject and word
- Players take turns giving hints about the word
- Players vote for who they think is the liar
- The most voted player is accused and can defend themselves
- Players vote on whether the accused player survives
- If the accused player is a liar and is eliminated, they can guess the word
- If the liar guesses correctly, the liar team wins
- If all liars are eliminated, the citizen team wins