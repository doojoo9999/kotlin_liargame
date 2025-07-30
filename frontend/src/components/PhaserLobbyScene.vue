<script setup>
import {onBeforeUnmount, onMounted, ref, watch} from 'vue';
import Phaser from 'phaser';

const props = defineProps({
  gameNumber: Number,      // Game number
  gameState: Object,       // Current game state
  players: Array,          // List of players in the game
  messages: Array,         // Chat messages
  isHost: Boolean,         // Whether the current player is the host
  canStartGame: Boolean,   // Whether the game can be started
  currentPlayerId: String  // ID of the current player
});

const emit = defineEmits(['startGame', 'leaveGame', 'sendMessage']);

const gameContainer = ref(null); // Reference to the DOM element for the Phaser game
const chatInput = ref('');       // Chat input text
let game = null;                 // Phaser game instance

const ASSETS = {
  BACKGROUND: '/src/assets/game-assets/background.svg',
  TABLE: '/src/assets/game-assets/table.svg',
  
  PLAYER: '/src/assets/game-assets/player.svg',
  PLAYER_SELECTED: '/src/assets/game-assets/player_selected.svg',
  
  CROWN: '/src/assets/game-assets/crown.svg',
  SETTINGS: '/src/assets/game-assets/settings.svg',
  
  BUTTON: '/src/assets/game-assets/button.svg',
  BUTTON_DISABLED: '/src/assets/game-assets/button_disabled.svg',
  
  CHAT_BUBBLE: '/src/assets/game-assets/chat_bubble.svg'
};

const gameConfig = {
  type: Phaser.AUTO,
  width: 1000,
  height: 800,
  parent: null,
  backgroundColor: '#f8f8f8',
  scene: {
    init: function() {
      this.vueProps = props;
      this.vueEmit = emit;
      
      // 모든 배열을 초기화
      this.buttons = [];
      this.playerSprites = [];
      this.chatMessages = [];
      this.notifications = [];
      
      // scene이 재시작될 때마다 sceneInitialized를 true로 설정
      sceneInitialized.value = true;
    },
    
    preload: function() {
      this.load.image('background', ASSETS.BACKGROUND);
      this.load.image('table', ASSETS.TABLE);
      this.load.image('player', ASSETS.PLAYER);
      this.load.image('player_selected', ASSETS.PLAYER_SELECTED);
      this.load.image('crown', ASSETS.CROWN);
      this.load.image('settings', ASSETS.SETTINGS);
      this.load.image('button', ASSETS.BUTTON);
      this.load.image('button_disabled', ASSETS.BUTTON_DISABLED);
      this.load.image('chat_bubble', ASSETS.CHAT_BUBBLE);
    },
    
    create: function() {
      // 기존 버튼들이 있다면 제거
      if (this.buttons) {
        this.buttons.forEach(button => {
            if (button && button.destroy) {
                button.destroy();
            }
        });
      }
      
      // 배열 재초기화
      this.buttons = [];
      
      // Add background
      this.add.image(500, 400, 'background').setScale(2);
      
      // Add table
      this.table = this.add.image(500, 400, 'table').setScale(2);
      
      // Add game info panel
      this.gameInfoPanel = this.add.rectangle(500, 100, 600, 120, 0xffffff, 0.8).setOrigin(0.5);
      
      // Add game title
      this.gameTitleText = this.add.text(500, 70, '게임 로비', {
        fontSize: '32px', 
        fontFamily: 'Arial', 
        color: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Add game number
      this.gameNumberText = this.add.text(500, 110, `게임 번호: ${this.vueProps.gameNumber}`, {
        fontSize: '20px', 
        fontFamily: 'Arial', 
        color: '#000000'
      }).setOrigin(0.5);
      
      // Add player count
      this.playerCountText = this.add.text(500, 140, '참가자: 0/0', {
        fontSize: '20px', 
        fontFamily: 'Arial', 
        color: '#000000'
      }).setOrigin(0.5);
      
      // Add chat background
      this.chatBackground = this.add.rectangle(500, 600, 600, 200, 0xffffff, 0.8).setOrigin(0.5);
      
      // Add chat title
      this.chatTitleText = this.add.text(500, 510, '채팅', {
        fontSize: '24px', 
        fontFamily: 'Arial', 
        color: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Add chat container - position it below the round table
      this.chatContainer = this.add.container(250, 540);
      
      // Make sure the chat container is visible and above other elements
      this.chatContainer.setDepth(10);
      
      // Add notification container
      this.notificationContainer = this.add.container(500, 750);
      
      // Create buttons
      this.createButtons();
      
      // Update game state
      this.updateGameState();
    },
    
    update: function() {
      this.updateGameState();
    },
    
    updateGameState: function() {
      if (this.vueProps.gameState && this.vueProps.players) {
        const currentPlayers = this.vueProps.players.length || 0;
        const maxPlayers = this.vueProps.gameState.playerCount || 0;

        if (this.playerCountText) {
          const previousText = this.playerCountText.text;
          const newText = `참가자: ${currentPlayers}/${maxPlayers}`;

          this.playerCountText.setText(newText);

          if (previousText !== '참가자: 0/0' && previousText !== newText) {
            this.tweens.add({
              targets: this.playerCountText,
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 200,
              yoyo: true,
              ease: 'Sine.InOut'
            });
          }
          console.log(`Player count updated: ${currentPlayers}/${maxPlayers}`);
        } else {
          console.error('playerCountText is not defined');
        }
      } else {
        console.warn('gameState or players is undefined');
      }
      
      // Update players
      this.updatePlayers();
      
      // Update chat messages
      this.updateChatMessages();
      
      // Update buttons
      this.updateButtons();
    },
    
    createButtons: function() {
      // 안전 검사 추가
      if (!this.buttons) {
        this.buttons = [];
      }
      
      // 기존 버튼 제거
      this.buttons.forEach(button => {
        if (button && button.destroy) {
          button.destroy();
        }
      });
      this.buttons = [];
      
      // Start game button (only for host)
      if (this.vueProps.isHost) {
        const startButtonX = 350;
        const startButtonY = 700;
        
        const startButton = this.add.image(startButtonX, startButtonY, 'button').setScale(1.5).setInteractive();
        const startButtonText = this.add.text(startButtonX, startButtonY, '게임 시작', {
          fontSize: '20px',
          fontFamily: 'Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        
        startButton.on('pointerdown', () => {
          if (this.vueProps.canStartGame) {
            this.vueEmit('startGame');
          }
        });
        
        this.buttons.push(startButton);
        this.buttons.push(startButtonText);
        
        // Settings button (only for host)
        const settingsButtonX = 500;
        const settingsButtonY = 700;
        
        const settingsButton = this.add.image(settingsButtonX, settingsButtonY, 'button').setScale(1.5).setInteractive();
        const settingsButtonText = this.add.text(settingsButtonX, settingsButtonY, '설정 변경', {
          fontSize: '20px',
          fontFamily: 'Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        
        settingsButton.on('pointerdown', () => {
          this.addNotification('설정 변경 기능은 아직 구현되지 않았습니다.');
        });
        
        this.buttons.push(settingsButton);
        this.buttons.push(settingsButtonText);
      }
      
      // Leave game button (for all players)
      const leaveButtonX = this.vueProps.isHost ? 650 : 500;
      const leaveButtonY = 700;
      
      const leaveButton = this.add.image(leaveButtonX, leaveButtonY, 'button').setScale(1.5).setInteractive();
      const leaveButtonText = this.add.text(leaveButtonX, leaveButtonY, '나가기', {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      leaveButton.on('pointerdown', () => {
        this.vueEmit('leaveGame');
      });
      
      this.buttons.push(leaveButton);
      this.buttons.push(leaveButtonText);
    },
    
    updateButtons: function() {
      // Update start button state based on canStartGame
      if (this.vueProps.isHost && this.buttons.length >= 2) {
        const startButton = this.buttons[0];
        
        if (this.vueProps.canStartGame) {
          startButton.setTint(0x4caf50);
        } else {
          startButton.setTint(0x999999);
        }
      }
    },
    
    updatePlayers: function() {
      // Clear existing player sprites
      this.playerSprites.forEach(sprite => sprite.destroy());
      this.playerSprites = [];
      
      if (this.vueProps.players && this.vueProps.players.length > 0) {
        const centerX = 500;
        const centerY = 350;
        const radius = 200;
        
        // Store previous player IDs to identify new players
        const previousPlayerIds = this.previousPlayerIds || [];
        
        // Log for debugging
        console.log('Previous player IDs:', previousPlayerIds);
        console.log('Current players:', this.vueProps.players);
        
        // Update the list of previous player IDs
        this.previousPlayerIds = this.vueProps.players.map(player => player.userId);
        
        this.vueProps.players.forEach((player, index) => {
          const angle = (index / this.vueProps.players.length) * Math.PI * 2;
          const targetX = centerX + radius * Math.cos(angle);
          const targetY = centerY + radius * Math.sin(angle);
          
          const isCurrentPlayer = player.userId === this.vueProps.currentPlayerId;
          const isNewPlayer = !previousPlayerIds.includes(player.userId);
          
          // Log new players for debugging
          if (isNewPlayer) {
            console.log('New player detected:', player.nickname, player.userId);
          }
          
          // Starting position for new players (off-screen)
          let startX = targetX;
          let startY = targetY;
          
          if (isNewPlayer) {
            // Start from outside the visible area
            const randomAngle = Math.random() * Math.PI * 2;
            startX = centerX + (radius + 300) * Math.cos(randomAngle);
            startY = centerY + (radius + 300) * Math.sin(randomAngle);
            
            // Add notification for new player
            this.addNotification(`${player.nickname} 님이 입장했습니다.`);
          }
          
          // Add player sprite
          const sprite = this.add.sprite(startX, startY, 'player').setScale(isNewPlayer ? 0 : 1.5).setInteractive();
          
          // Add player name
          const nameText = this.add.text(startX, startY + 40, player.nickname, {
            fontSize: '16px', 
            fontFamily: 'Arial',
            color: isCurrentPlayer ? '#ff0000' : '#000000',
            fontStyle: isCurrentPlayer ? 'bold' : 'normal'
          }).setOrigin(0.5);
          nameText.alpha = isNewPlayer ? 0 : 1;
          
          // Add crown for host
          let crown = null;
          if (player.isHost) {
            crown = this.add.image(startX, startY - 40, 'crown').setScale(isNewPlayer ? 0 : 0.5);
            this.playerSprites.push(crown);
          }
          
          // Animate new players entering
          if (isNewPlayer) {
            // Move to target position with a bounce effect
            this.tweens.add({
              targets: sprite,
              x: targetX,
              y: targetY,
              scale: 1.5,
              ease: 'Bounce.Out',
              duration: 1000,
              onComplete: () => {
                console.log('Animation completed for player:', player.nickname);
              }
            });
            
            // Fade in the name
            this.tweens.add({
              targets: nameText,
              x: targetX,
              y: targetY + 40,
              alpha: 1,
              ease: 'Sine.InOut',
              duration: 1000
            });
            
            // Animate crown if player is host
            if (crown) {
              this.tweens.add({
                targets: crown,
                x: targetX,
                y: targetY - 40,
                scale: 0.5,
                ease: 'Bounce.Out',
                duration: 1000
              });
            }
          }
          
          this.playerSprites.push(sprite);
          this.playerSprites.push(nameText);
        });
      }
    },
    
    updateChatMessages: function() {
      // Clear existing chat messages
      this.chatMessages.forEach(item => item.destroy());
      this.chatMessages = [];
      
      const messages = this.vueProps.messages || [];
      
      // Display the last 8 messages
      const displayMessages = messages.slice(-8);
      
      // Log for debugging
      console.log('Updating chat messages:', displayMessages.length, 'messages');
      
      displayMessages.forEach((message, index) => {
        const isCurrentUser = message.senderId === this.vueProps.currentPlayerId;
        
        const textStyle = {
          fontSize: '14px',
          fontFamily: 'Arial',
          color: isCurrentUser ? '#ff0000' : '#000000',
          fontStyle: isCurrentUser ? 'bold' : 'normal',
          wordWrap: { width: 580 }
        };
        
        const messageText = this.add.text(0, index * 25, `${message.senderName}: ${message.content}`, textStyle);
        
        // Make sure the message text is visible
        messageText.setDepth(10);
        
        this.chatContainer.add(messageText);
        
        this.chatMessages.push(messageText);
      });
      
      // Force the chat container to update its display
      this.chatContainer.setVisible(false);
      this.chatContainer.setVisible(true);
    },
    
    addNotification: function(message) {
      if (this.notifications.length > 3) {
        const oldNotification = this.notifications.shift();
        oldNotification.destroy();
      }
      
      const notification = this.add.text(0, this.notifications.length * 30, message, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 }
      });
      
      this.notificationContainer.add(notification);
      
      this.notifications.push(notification);
      
      this.time.delayedCall(5000, () => {
        if (this.notifications.includes(notification)) {
          const index = this.notifications.indexOf(notification);
          if (index > -1) {
            this.notifications.splice(index, 1);
            notification.destroy();
            
            this.notifications.forEach((note, i) => {
              note.y = i * 30;
            });
          }
        }
      });
    }
  }
};

// Flag to track if the scene is fully initialized
const sceneInitialized = ref(false);

const initGame = () => {
  if (gameContainer.value) {
    gameConfig.parent = gameContainer.value;
    game = new Phaser.Game(gameConfig);
    
    // Add event listener for scene creation to set the initialized flag
    game.events.once('ready', () => {
      // Give a small delay to ensure all scene methods are available
      setTimeout(() => {
        console.log('Phaser scene fully initialized');
        sceneInitialized.value = true;
      }, 500);
    });
  }
};

const destroyGame = () => {
  if (game) {
    game.destroy(true);
    game = null;
  }
};

// Watch for changes in props
watch(() => props.gameState, () => {
  // Only attempt to update if the scene is fully initialized
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].updateGameState === 'function') {
      game.scene.scenes[0].updateGameState();
    } else {
      console.log('updateGameState function not found, scene may not be fully initialized');
      // Only restart if we're sure the scene should be initialized by now
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        // Reset initialization flag until scene is ready again
        sceneInitialized.value = false;
      }
    }
  }
}, { deep: true });

watch(() => props.players, () => {
  // Only attempt to update if the scene is fully initialized
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].updatePlayers === 'function') {
      game.scene.scenes[0].updatePlayers();
    } else {
      console.log('updatePlayers function not found, scene may not be fully initialized');
      // Only restart if we're sure the scene should be initialized by now
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        // Reset initialization flag until scene is ready again
        sceneInitialized.value = false;
      }
    }
  }
}, { deep: true });

watch(() => props.messages, (newMessages, oldMessages) => {
  console.log('Messages changed:', newMessages?.length, 'messages');
  
  // Only attempt to update if the scene is fully initialized
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].updateChatMessages === 'function') {
      // Force immediate update of chat messages when they change
      game.scene.scenes[0].updateChatMessages();
      
      // If a new message was added, add a notification
      if (newMessages && oldMessages && newMessages.length > oldMessages.length) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage && typeof game.scene.scenes[0].addNotification === 'function') {
          game.scene.scenes[0].addNotification(`새 메시지: ${latestMessage.senderName}`);
        }
      }
    } else {
      console.log('updateChatMessages function not found, scene may not be fully initialized');
      // Only restart if we're sure the scene should be initialized by now
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        // Reset initialization flag until scene is ready again
        sceneInitialized.value = false;
      }
    }
  }
}, { deep: true, immediate: true });

watch(() => props.isHost, () => {
  // Only attempt to update if the scene is fully initialized
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].createButtons === 'function') {
      game.scene.scenes[0].createButtons();
    } else {
      console.log('createButtons function not found, scene may not be fully initialized');
      // Only restart if we're sure the scene should be initialized by now
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        // Reset initialization flag until scene is ready again
        sceneInitialized.value = false;
      }
    }
  }
}, { deep: true });

watch(() => props.canStartGame, () => {
  // Only attempt to update if the scene is fully initialized
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].updateButtons === 'function') {
      game.scene.scenes[0].updateButtons();
    } else {
      console.log('updateButtons function not found, scene may not be fully initialized');
      // Only restart if we're sure the scene should be initialized by now
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        // Reset initialization flag until scene is ready again
        sceneInitialized.value = false;
      }
    }
  }
});

// Track player count changes for notifications
const previousPlayerCount = ref(0);
watch(() => props.players?.length, (newCount, oldCount) => {
  // Only attempt to update if the scene is fully initialized
  if (sceneInitialized.value && game && game.scene.scenes[0] && oldCount !== undefined) {
    if (typeof game.scene.scenes[0].addNotification === 'function') {
      if (newCount > oldCount) {
        const newPlayer = props.players[props.players.length - 1];
        game.scene.scenes[0].addNotification(`${newPlayer.nickname} 님이 입장했습니다.`);
      } else if (newCount < oldCount) {
        game.scene.scenes[0].addNotification('플레이어가 퇴장했습니다.');
      }
    } else {
      console.log('addNotification function not found, scene may not be fully initialized');
      // Only restart if we're sure the scene should be initialized by now
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        // Reset initialization flag until scene is ready again
        sceneInitialized.value = false;
      }
    }
  }
  previousPlayerCount.value = newCount;
});

const isSending = ref(false);
const sendMessage = async () => {
  if (chatInput.value.trim() && !isSending.value) {
    try {
      isSending.value = true;
      
      // Store the message locally
      const messageText = chatInput.value.trim();
      
      // Clear input immediately for better UX
      chatInput.value = '';
      
      // Emit the event to parent component
      await emit('sendMessage', messageText);
      
      // If we get here, the message was sent successfully
      console.log('Message sent successfully');
      
      // If the game scene exists, add a notification
      if (game && game.scene.scenes[0] && typeof game.scene.scenes[0].addNotification === 'function') {
        game.scene.scenes[0].addNotification('메시지가 전송되었습니다.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // If the game scene exists, add an error notification
      if (game && game.scene.scenes[0] && typeof game.scene.scenes[0].addNotification === 'function') {
        game.scene.scenes[0].addNotification('메시지 전송에 실패했습니다.');
      }
      
      // Put the message back in the input field
      chatInput.value = messageText;
    } finally {
      isSending.value = false;
    }
  }
};

onMounted(() => {
  initGame();
});

onBeforeUnmount(() => {
  destroyGame();
});
</script>

<template>
  <div class="phaser-lobby-container">
    <div ref="gameContainer" class="game-canvas"></div>
    
    <!-- Chat input below the game canvas -->
    <div class="chat-input-container">
      <input 
        v-model="chatInput" 
        class="chat-input"
        placeholder="메시지를 입력하세요..."
        @keyup.enter="sendMessage"
      />
      <button class="send-button" @click="sendMessage">전송</button>
    </div>
  </div>
</template>

<style scoped>
.phaser-lobby-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
}

.game-canvas {
  width: 1000px;
  height: 800px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.chat-input-container {
  display: flex;
  width: 100%;
  max-width: 1000px;
  margin-top: 1rem;
}

.chat-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
}

.send-button {
  padding: 0.75rem 1.5rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 1rem;
}

.send-button:hover {
  background-color: #45a049;
}

@media (max-width: 1024px) {
  .game-canvas {
    width: 100%;
    height: auto;
    aspect-ratio: 5/4;
  }
}
</style>