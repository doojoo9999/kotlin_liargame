<script setup>

import {onBeforeUnmount, onMounted, ref, watch} from 'vue';
import Phaser from 'phaser';

const props = defineProps({
  gameState: Object,      
  players: Array,         
  currentRound: Number,   
  subject: String,        
  word: String,           
  isLiar: Boolean,        
  currentPhase: String,   
  currentPlayerId: String, 
  messages: Array,        
  timeRemaining: Number   
});

const emit = defineEmits(['playerSelected', 'sendMessage']);

const gameContainer = ref(null); 
const chatInput = ref('');       
let game = null;                 

const ASSETS = {
  BACKGROUND: '/src/assets/game-assets/background.svg',
  TABLE: '/src/assets/game-assets/table.svg',
  
  PLAYER: '/src/assets/game-assets/player.svg',
  PLAYER_SELECTED: '/src/assets/game-assets/player_selected.svg',
  
  CHALKBOARD: '/src/assets/game-assets/chalkboard.svg',
  CLOCK: '/src/assets/game-assets/clock.svg',
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
      
      this.selectedPlayerId = null;
      this.highlightedPlayerId = null;
      this.playerSprites = [];
      this.chatMessages = [];
      this.notifications = [];
    },
    
    preload: function() {
      this.load.image('background', ASSETS.BACKGROUND);
      this.load.image('table', ASSETS.TABLE);
      this.load.image('player', ASSETS.PLAYER);
      this.load.image('player_selected', ASSETS.PLAYER_SELECTED);
      this.load.image('chalkboard', ASSETS.CHALKBOARD);
      this.load.image('clock', ASSETS.CLOCK);
      this.load.image('chat_bubble', ASSETS.CHAT_BUBBLE);
    },
    
    create: function() {
      this.add.image(500, 400, 'background').setScale(2);
      
      this.table = this.add.image(500, 400, 'table').setScale(2);
      
      this.chalkboard = this.add.image(500, 150, 'chalkboard').setScale(0.5);
      
      this.subjectText = this.add.text(500, 130, '주제: ', {
        fontSize: '28px', 
        fontFamily: 'Arial', 
        color: '#ffffff',
        stroke: '#ffffff',
        strokeThickness: 1
      }).setOrigin(0.5);
      
      this.wordText = this.add.text(500, 170, '단어: ', { 
        fontSize: '28px', 
        fontFamily: 'Arial', 
        color: '#ffffff',
        stroke: '#ffffff',
        strokeThickness: 1
      }).setOrigin(0.5);
      
      this.clockSprite = this.add.image(900, 100, 'clock').setScale(0.5);
      this.timerText = this.add.text(900, 100, '', { 
        fontSize: '20px', 
        fontFamily: 'Arial', 
        color: '#000000',
        stroke: '#ffffff',
        strokeThickness: 1
      }).setOrigin(0.5);
      
      this.phaseText = this.add.text(500, 50, '', {
        fontSize: '24px', 
        fontFamily: 'Arial', 
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);
      
      this.chatBackground = this.add.rectangle(500, 400, 400, 300, 0xffffff, 0.8).setOrigin(0.5);
      
      this.chatContainer = this.add.container(300, 250);
      
      this.notificationContainer = this.add.container(500, 650);
      
      this.updateGameState();
    },
    
    update: function() {
      if (this.vueProps.timeRemaining) {
        const minutes = Math.floor(this.vueProps.timeRemaining / 60);
        const seconds = this.vueProps.timeRemaining % 60;
        this.timerText.setText(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      }
      
      this.updateGameState();
    },
    
    updateGameState: function() {
      if (this.vueProps.subject) {
        this.subjectText.setText(`주제: ${this.vueProps.subject}`);
      }
      
      if (this.vueProps.word && !this.vueProps.isLiar) {
        this.wordText.setText(`단어: ${this.vueProps.word}`);
      } else {
        this.wordText.setText('단어: ???');
      }
      
      if (this.vueProps.currentPhase) {
        this.phaseText.setText(`${this.vueProps.currentPhase}`);
      }
      
      this.updatePlayers();
      
      this.updateChatMessages();
    },
    
    updatePlayers: function() {
      this.playerSprites.forEach(sprite => sprite.destroy());
      this.playerSprites = [];
      
      if (this.vueProps.players && this.vueProps.players.length > 0) {
        const centerX = 500;
        const centerY = 400;
        const radius = 250;
        
        this.vueProps.players.forEach((player, index) => {
          const angle = (index / this.vueProps.players.length) * Math.PI * 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          
          const isCurrentPlayer = player.userId === this.vueProps.currentPlayerId;
          const isSelected = player.userId === this.selectedPlayerId;
          const spriteKey = isSelected ? 'player_selected' : 'player';
          
          const sprite = this.add.sprite(x, y, spriteKey).setScale(2).setInteractive();
          
          const nameText = this.add.text(x, y + 50, player.nickname, {
            fontSize: '16px', 
            fontFamily: 'Arial',
            color: isCurrentPlayer ? '#ff0000' : '#000000',
            fontStyle: isCurrentPlayer ? 'bold' : 'normal'
          }).setOrigin(0.5);
          
          sprite.on('pointerdown', () => {
            if (this.selectedPlayerId === player.userId) {
              this.selectedPlayerId = null;
            } else {
              this.selectedPlayerId = player.userId;
            }
            
            this.highlightedPlayerId = this.selectedPlayerId;
            
            this.updateChatMessages();
            
            this.vueEmit('playerSelected', this.selectedPlayerId);
            
            this.updatePlayers();
          });
          
          this.playerSprites.push(sprite);
          this.playerSprites.push(nameText);
        });
      }
    },
    
    updateChatMessages: function() {
      this.chatMessages.forEach(item => item.destroy());
      this.chatMessages = [];
      
      const messages = this.vueProps.messages || [];
      
      const displayMessages = messages.slice(-10);
      
      displayMessages.forEach((message, index) => {
        const isCurrentUser = message.senderId === this.vueProps.currentPlayerId;
        const isHighlighted = message.senderId === this.highlightedPlayerId;
        
        const textStyle = {
          fontSize: '14px',
          fontFamily: 'Arial',
          color: isCurrentUser || isHighlighted ? '#ff0000' : '#000000',
          fontStyle: isCurrentUser || isHighlighted ? 'bold' : 'normal',
          wordWrap: { width: 380 }
        };
        
        const messageText = this.add.text(0, index * 30, `${message.senderName}: ${message.content}`, textStyle);
        
        this.chatContainer.add(messageText);
        
        this.chatMessages.push(messageText);
      });
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

const initGame = () => {
  if (gameContainer.value) {
    gameConfig.parent = gameContainer.value;
    game = new Phaser.Game(gameConfig);
  }
};

const destroyGame = () => {
  if (game) {
    game.destroy(true);
    game = null;
  }
};

watch(() => props.gameState, () => {
  if (game && game.scene.scenes[0]) {
    game.scene.scenes[0].updateGameState();
  }
}, { deep: true });

watch(() => props.players, () => {
  if (game && game.scene.scenes[0]) {
    game.scene.scenes[0].updatePlayers();
  }
}, { deep: true });

watch(() => props.messages, () => {
  if (game && game.scene.scenes[0]) {
    game.scene.scenes[0].updateChatMessages();
  }
}, { deep: true });

const previousPlayerCount = ref(0);
watch(() => props.players?.length, (newCount, oldCount) => {
  if (game && game.scene.scenes[0] && oldCount !== undefined) {
    if (newCount > oldCount) {
      const newPlayer = props.players[props.players.length - 1];
      game.scene.scenes[0].addNotification(`${newPlayer.nickname} 님이 게임에 참가했습니다`);
    } else if (newCount < oldCount) {
      game.scene.scenes[0].addNotification('플레이어가 게임을 나갔습니다');
    }
  }
  previousPlayerCount.value = newCount;
});

const sendMessage = async () => {
  if (chatInput.value.trim()) {
    
    const messageText = chatInput.value.trim();
    
    try {
      chatInput.value = '';

      await emit('sendMessage', messageText);
      
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);

      chatInput.value = messageText;
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
  <div class="phaser-game-container">
    <div ref="gameContainer" class="game-canvas"></div>
    
    
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
.phaser-game-container {
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