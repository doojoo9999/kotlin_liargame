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
  currentPlayerId: String
});

const emit = defineEmits(['playerSelected']);

const gameContainer = ref(null);
let game = null;

// Game configuration
const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: null, 
  backgroundColor: '#f8f8f8',
  scene: {
    init: function() {
      this.vueProps = props;
      this.vueEmit = emit;
    },
    preload: function() {
      this.load.image('player', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/phaser-dude.png');
      this.load.image('liar', 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/phaser-dude-cheer.png');
    },
    create: function() {
      this.add.text(400, 50, 'Liar Game', { fontSize: '32px', fill: '#000' }).setOrigin(0.5);
      
      this.subjectText = this.add.text(400, 100, '', { fontSize: '24px', fill: '#333' }).setOrigin(0.5);
      
      this.phaseText = this.add.text(400, 150, '', { fontSize: '20px', fill: '#666' }).setOrigin(0.5);
      
      this.playerSprites = [];
      
      this.updateGameState();
    },
    update: function() {
      this.updateGameState();
    },
    updateGameState: function() {
      if (this.vueProps.subject) {
        this.subjectText.setText(`Subject: ${this.vueProps.subject}`);
      }
      
      if (this.vueProps.currentPhase) {
        this.phaseText.setText(`Phase: ${this.vueProps.currentPhase}`);
      }
      
      this.updatePlayers();
    },
    updatePlayers: function() {
      this.playerSprites.forEach(sprite => sprite.destroy());
      this.playerSprites = [];
      
      if (this.vueProps.players && this.vueProps.players.length > 0) {
        const centerX = 400;
        const centerY = 350;
        const radius = 200;
        
        this.vueProps.players.forEach((player, index) => {
          const angle = (index / this.vueProps.players.length) * Math.PI * 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          
          const spriteKey = (this.vueProps.isLiar && player.userId === this.vueProps.currentPlayerId) ? 'liar' : 'player';
          
          const sprite = this.add.sprite(x, y, spriteKey).setInteractive();
          
          const nameText = this.add.text(x, y + 40, player.nickname, { fontSize: '16px', fill: '#000' }).setOrigin(0.5);
          
          sprite.on('pointerdown', () => {
            this.vueEmit('playerSelected', player.userId);
          });
          
          this.playerSprites.push(sprite);
          this.playerSprites.push(nameText);
        });
      }
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
  </div>
</template>

<style scoped>
.phaser-game-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.game-canvas {
  width: 800px;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>