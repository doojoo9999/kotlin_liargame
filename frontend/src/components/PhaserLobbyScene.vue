<script setup>
import {onBeforeUnmount, onMounted, ref, watch} from 'vue';
import Phaser from 'phaser';

const props = defineProps({
  gameNumber: Number,      
  gameState: Object,       
  players: Array,          
  messages: Array,         
  isHost: Boolean,         
  canStartGame: Boolean,   
  currentPlayerId: String  
});

const emit = defineEmits(['startGame', 'leaveGame', 'sendMessage']);

const gameContainer = ref(null); 
const chatInput = ref('');       
let game = null;                 

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
      
      
      this.buttons = [];
      this.playerSprites = [];
      this.chatMessages = [];
      this.notifications = [];
      
      
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
      
      if (this.buttons) {
        this.buttons.forEach(button => {
            if (button && button.destroy) {
                button.destroy();
            }
        });
      }
      
      
      this.buttons = [];
      
      
      this.add.image(500, 400, 'background').setScale(2);
      
      
      this.table = this.add.image(500, 400, 'table').setScale(2);
      
      
      this.gameInfoPanel = this.add.rectangle(500, 100, 600, 120, 0xffffff, 0.8).setOrigin(0.5);
      
      
      this.gameTitleText = this.add.text(500, 70, 'Í≤åÏûÑ Î°úÎπÑ', {
        fontSize: '32px', 
        fontFamily: 'Arial', 
        color: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      
      this.gameNumberText = this.add.text(500, 110, `Í≤åÏûÑ Î≤àÌò∏: ${this.vueProps.gameNumber}`, {
        fontSize: '20px', 
        fontFamily: 'Arial', 
        color: '#000000'
      }).setOrigin(0.5);
      
      
      this.playerCountText = this.add.text(500, 140, 'Ï∞∏Í??? 0/0', {
        fontSize: '20px', 
        fontFamily: 'Arial', 
        color: '#000000'
      }).setOrigin(0.5);
      
      
      this.chatBackground = this.add.rectangle(500, 600, 600, 200, 0xffffff, 0.8).setOrigin(0.5);
      
      
      this.chatTitleText = this.add.text(500, 510, 'Ï±ÑÌåÖ', {
        fontSize: '24px', 
        fontFamily: 'Arial', 
        color: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      
      this.chatContainer = this.add.container(250, 540);
      
      
      this.chatContainer.setDepth(10);
      
      
      this.notificationContainer = this.add.container(500, 750);
      
      
      this.createButtons();
      
      
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
          const newText = `Ï∞∏Í??? ${currentPlayers}/${maxPlayers}`;

          this.playerCountText.setText(newText);

          if (previousText !== 'Ï∞∏Í??? 0/0' && previousText !== newText) {
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
      
      
      this.updatePlayers();
      
      
      this.updateChatMessages();
      
      
      this.updateButtons();
    },
    
    createButtons: function() {
      
      if (!this.buttons) {
        this.buttons = [];
      }
      
      
      this.buttons.forEach(button => {
        if (button && button.destroy) {
          button.destroy();
        }
      });
      this.buttons = [];
      
      
      if (this.vueProps.isHost) {
        const startButtonX = 350;
        const startButtonY = 700;
        
        const startButton = this.add.image(startButtonX, startButtonY, 'button').setScale(1.5).setInteractive();
        const startButtonText = this.add.text(startButtonX, startButtonY, 'Í≤åÏûÑ ?úÏûë', {
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
        
        
        const settingsButtonX = 500;
        const settingsButtonY = 700;
        
        const settingsButton = this.add.image(settingsButtonX, settingsButtonY, 'button').setScale(1.5).setInteractive();
        const settingsButtonText = this.add.text(settingsButtonX, settingsButtonY, '?§Ï†ï Î≥ÄÍ≤?, {
          fontSize: '20px',
          fontFamily: 'Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
        
        settingsButton.on('pointerdown', () => {
          this.addNotification('?§Ï†ï Î≥ÄÍ≤?Í∏∞Îä•?Ä ?ÑÏßÅ Íµ¨ÌòÑ?òÏ? ?äÏïò?µÎãà??');
        });
        
        this.buttons.push(settingsButton);
        this.buttons.push(settingsButtonText);
      }
      
      
      const leaveButtonX = this.vueProps.isHost ? 650 : 500;
      const leaveButtonY = 700;
      
      const leaveButton = this.add.image(leaveButtonX, leaveButtonY, 'button').setScale(1.5).setInteractive();
      const leaveButtonText = this.add.text(leaveButtonX, leaveButtonY, '?òÍ?Í∏?, {
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
      
      this.playerSprites.forEach(sprite => sprite.destroy());
      this.playerSprites = [];
      
      if (this.vueProps.players && this.vueProps.players.length > 0) {
        const centerX = 500;
        const centerY = 350;
        const radius = 200;
        
        
        const previousPlayerIds = this.previousPlayerIds || [];
        
        
        console.log('Previous player IDs:', previousPlayerIds);
        console.log('Current players:', this.vueProps.players);
        
        
        this.previousPlayerIds = this.vueProps.players.map(player => player.userId);
        
        this.vueProps.players.forEach((player, index) => {
          const angle = (index / this.vueProps.players.length) * Math.PI * 2;
          const targetX = centerX + radius * Math.cos(angle);
          const targetY = centerY + radius * Math.sin(angle);
          
          const isCurrentPlayer = player.userId === this.vueProps.currentPlayerId;
          const isNewPlayer = !previousPlayerIds.includes(player.userId);
          
          
          if (isNewPlayer) {
            console.log('New player detected:', player.nickname, player.userId);
          }
          
          
          let startX = targetX;
          let startY = targetY;
          
          if (isNewPlayer) {
            
            const randomAngle = Math.random() * Math.PI * 2;
            startX = centerX + (radius + 300) * Math.cos(randomAngle);
            startY = centerY + (radius + 300) * Math.sin(randomAngle);
            
            
            this.addNotification(`${player.nickname} ?òÏù¥ ?ÖÏû•?àÏäµ?àÎã§.`);
          }
          
          
          const sprite = this.add.sprite(startX, startY, 'player').setScale(isNewPlayer ? 0 : 1.5).setInteractive();
          
          
          const nameText = this.add.text(startX, startY + 40, player.nickname, {
            fontSize: '16px', 
            fontFamily: 'Arial',
            color: isCurrentPlayer ? '#ff0000' : '#000000',
            fontStyle: isCurrentPlayer ? 'bold' : 'normal'
          }).setOrigin(0.5);
          nameText.alpha = isNewPlayer ? 0 : 1;
          
          
          let crown = null;
          if (player.isHost) {
            crown = this.add.image(startX, startY - 40, 'crown').setScale(isNewPlayer ? 0 : 0.5);
            this.playerSprites.push(crown);
          }
          
          
          if (isNewPlayer) {
            
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
            
            
            this.tweens.add({
              targets: nameText,
              x: targetX,
              y: targetY + 40,
              alpha: 1,
              ease: 'Sine.InOut',
              duration: 1000
            });
            
            
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
      
      this.chatMessages.forEach(item => item.destroy());
      this.chatMessages = [];
      
      const messages = this.vueProps.messages || [];
      
      
      const displayMessages = messages.slice(-8);
      
      
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
        
        
        messageText.setDepth(10);
        
        this.chatContainer.add(messageText);
        
        this.chatMessages.push(messageText);
      });
      
      
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


const sceneInitialized = ref(false);

const initGame = () => {
  if (gameContainer.value) {
    gameConfig.parent = gameContainer.value;
    game = new Phaser.Game(gameConfig);
    
    
    game.events.once('ready', () => {
      
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


watch(() => props.gameState, () => {
  
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].updateGameState === 'function') {
      game.scene.scenes[0].updateGameState();
    } else {
      console.log('updateGameState function not found, scene may not be fully initialized');
      
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        
        sceneInitialized.value = false;
      }
    }
  }
}, { deep: true });

watch(() => props.players, () => {
  
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].updatePlayers === 'function') {
      game.scene.scenes[0].updatePlayers();
    } else {
      console.log('updatePlayers function not found, scene may not be fully initialized');
      
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        
        sceneInitialized.value = false;
      }
    }
  }
}, { deep: true });

watch(() => props.messages, (newMessages, oldMessages) => {
  console.log('Messages changed:', newMessages?.length, 'messages');
  
  
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].updateChatMessages === 'function') {
      
      game.scene.scenes[0].updateChatMessages();
      
      
      if (newMessages && oldMessages && newMessages.length > oldMessages.length) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (latestMessage && typeof game.scene.scenes[0].addNotification === 'function') {
          game.scene.scenes[0].addNotification(`??Î©îÏãúÏßÄ: ${latestMessage.senderName}`);
        }
      }
    } else {
      console.log('updateChatMessages function not found, scene may not be fully initialized');
      
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        
        sceneInitialized.value = false;
      }
    }
  }
}, { deep: true, immediate: true });

watch(() => props.isHost, () => {
  
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].createButtons === 'function') {
      game.scene.scenes[0].createButtons();
    } else {
      console.log('createButtons function not found, scene may not be fully initialized');
      
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        
        sceneInitialized.value = false;
      }
    }
  }
}, { deep: true });

watch(() => props.canStartGame, () => {
  
  if (sceneInitialized.value && game && game.scene.scenes[0]) {
    if (typeof game.scene.scenes[0].updateButtons === 'function') {
      game.scene.scenes[0].updateButtons();
    } else {
      console.log('updateButtons function not found, scene may not be fully initialized');
      
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        
        sceneInitialized.value = false;
      }
    }
  }
});


const previousPlayerCount = ref(0);
watch(() => props.players?.length, (newCount, oldCount) => {
  
  if (sceneInitialized.value && game && game.scene.scenes[0] && oldCount !== undefined) {
    if (typeof game.scene.scenes[0].addNotification === 'function') {
      if (newCount > oldCount) {
        const newPlayer = props.players[props.players.length - 1];
        game.scene.scenes[0].addNotification(`${newPlayer.nickname} ?òÏù¥ ?ÖÏû•?àÏäµ?àÎã§.`);
      } else if (newCount < oldCount) {
        game.scene.scenes[0].addNotification('?åÎ†à?¥Ïñ¥Í∞Ä ?¥Ïû•?àÏäµ?àÎã§.');
      }
    } else {
      console.log('addNotification function not found, scene may not be fully initialized');
      
      if (sceneInitialized.value) {
        console.log('Attempting to reinitialize scene');
        game.scene.scenes[0].scene.restart();
        
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
      
      
      const messageText = chatInput.value.trim();
      
      
      chatInput.value = '';
      
      
      await emit('sendMessage', messageText);
      
      
      console.log('Message sent successfully');
      
      
      if (game && game.scene.scenes[0] && typeof game.scene.scenes[0].addNotification === 'function') {
        game.scene.scenes[0].addNotification('Î©îÏãúÏßÄÍ∞Ä ?ÑÏÜ°?òÏóà?µÎãà??');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      
      if (game && game.scene.scenes[0] && typeof game.scene.scenes[0].addNotification === 'function') {
        game.scene.scenes[0].addNotification('Î©îÏãúÏßÄ ?ÑÏÜ°???§Ìå®?àÏäµ?àÎã§.');
      }
      
      
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
    
    
    <div class="chat-input-container">
      <input 
        v-model="chatInput" 
        class="chat-input"
        placeholder="Î©îÏãúÏßÄÎ•??ÖÎ†•?òÏÑ∏??.."
        @keyup.enter="sendMessage"
      />
      <button class="send-button" @click="sendMessage">?ÑÏÜ°</button>
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
