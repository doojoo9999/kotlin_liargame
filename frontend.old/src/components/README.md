# Phaser-based Liar Game Implementation

## Overview

This directory contains the Phaser-based implementation of the Liar Game. The game has been completely refactored to use Phaser for all visual elements, providing a more immersive and interactive gaming experience.

## Components

### PhaserGameNew.vue

The main component that implements the Phaser game interface. It visualizes the game state using Phaser, including:

- Round table layout with players arranged in a circle
- Chalkboard for displaying subject and word
- Central chat area with message highlighting
- Clock for time display
- Game entry/exit notifications

### GameViewNew.vue

The main game view component that integrates the Phaser-based game interface. It handles:

- Game state management through Pinia stores
- Game phase transitions
- Player interactions (voting, defense, etc.)
- Chat functionality
- Timer management

## Features

### 1. Round Table Layout

Players are arranged in a circle around a central table, creating a more immersive game experience. Each player is represented by a sprite that can be clicked to select the player.

### 2. Chalkboard for Subject and Word

A chalkboard is displayed at the top of the screen, showing the current subject and word (the word is hidden for the liar).

### 3. Central Chat Area

Chat messages are displayed in the center of the table, making it easy for players to follow the conversation.

### 4. Message Highlighting

- The current player's messages are highlighted in bold red text
- When a player is selected, their messages are also highlighted in bold red text
- This makes it easier to follow specific players' contributions to the discussion

### 5. Clock for Time Display

A clock is displayed showing the remaining time for the current phase, helping players keep track of time.

### 6. Game Entry/Exit Notifications

Notifications are displayed when players join or leave the game, keeping everyone informed of changes in the player roster.

## Architecture

The implementation follows a clean separation of concerns:

1. **Vue Components**: Handle the UI structure, user input, and integration with the Vue ecosystem
2. **Phaser Game**: Handles all visual rendering and interactive elements
3. **Pinia Stores**: Manage the application state and communication with the backend

Data flows from the Vue components to Phaser through props, and from Phaser back to Vue through events.

## Asset Management

The implementation uses CDN-hosted assets from the Phaser examples repository for simplicity. In a production environment, these assets should be replaced with custom assets hosted locally.

## Extending the Implementation

### Adding New Visual Elements

To add new visual elements to the game:

1. Add the asset URL to the `ASSETS` object in PhaserGameNew.vue
2. Load the asset in the `preload` function
3. Create and position the element in the `create` function
4. Update the element as needed in the `update` or other functions

### Modifying Game Logic

Game logic is primarily handled in the GameViewNew.vue component and the Pinia stores. To modify the game logic:

1. Update the relevant store actions in gameStore.js, chatStore.js, or userStore.js
2. Update the corresponding methods in GameViewNew.vue
3. Update the visual representation in PhaserGameNew.vue if needed

## Maintenance

### Performance Considerations

- The Phaser game is destroyed and recreated when the component is mounted/unmounted to prevent memory leaks
- Chat messages are limited to the last 10 to prevent performance issues with large numbers of messages
- Notifications are automatically removed after 5 seconds to keep the UI clean

### Browser Compatibility

The implementation uses Phaser 3, which is compatible with all modern browsers. However, it may not work correctly on older browsers or mobile devices with limited resources.

### Responsive Design

The game canvas is designed to be responsive, adapting to different screen sizes. However, for the best experience, a minimum width of 1000px is recommended.