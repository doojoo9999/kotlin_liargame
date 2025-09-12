# Enhanced WebSocket Protocol for Complete Game Flow

## Overview
This document defines the comprehensive WebSocket message protocol for the enhanced Liar Game backend, supporting real-time moderator commentary, dynamic scoring updates, victory conditions, and post-game flow management.

## 1. Enhanced Subscription Channels

### Core Game Channels (Existing + Enhanced)
```typescript
// Enhanced existing channels
'/topic/game/{gameNumber}/state'      // Game state with flow transitions
'/topic/game/{gameNumber}/chat'       // Chat with moderator messages
'/topic/game/{gameNumber}/events'     // Real-time game events

// New specialized channels
'/topic/game/{gameNumber}/flow'       // Game flow transitions and phases
'/topic/game/{gameNumber}/scoring'    // Real-time score updates and calculations
'/topic/game/{gameNumber}/moderator'  // Dedicated moderator commentary
'/topic/game/{gameNumber}/victory'    // Victory announcements and celebrations
'/topic/game/{gameNumber}/post-game'  // Post-game options and choices
'/topic/game/{gameNumber}/analytics'  // Real-time game analytics
```

### User-Specific Channels
```typescript
'/topic/user/{userId}/notifications'  // Personal achievements, warnings
'/topic/user/{userId}/statistics'     // Personal performance updates
'/topic/user/{userId}/achievements'   // Achievement unlocks
```

## 2. Message Type Definitions

### Game Flow Messages

#### Phase Transition Message
```typescript
interface PhaseTransitionMessage {
  type: 'PHASE_TRANSITION'
  gameNumber: number
  previousPhase: GamePhase
  currentPhase: GamePhase
  trigger: TransitionTrigger
  moderatorCommentary: ModeratorCommentary
  phaseEndTime: string | null  // ISO 8601
  timeLimit: number | null     // seconds
  nextActions: string[]        // What players should do
  playersReady: number
  totalPlayers: number
  timestamp: string           // ISO 8601
}

// Example:
{
  "type": "PHASE_TRANSITION",
  "gameNumber": 123,
  "previousPhase": "SPEECH",
  "currentPhase": "VOTING_FOR_LIAR", 
  "trigger": "ALL_HINTS_COLLECTED",
  "moderatorCommentary": {
    "phase": "VOTING_FOR_LIAR",
    "messages": [
      "모든 플레이어의 힌트가 나왔습니다!",
      "이제 투표 시간입니다. 지금까지 들은 힌트를 바탕으로 가장 의심스러운 플레이어를 선택해주세요."
    ],
    "importance": "HIGH",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "phaseEndTime": "2025-01-15T10:31:00Z",
  "timeLimit": 60,
  "nextActions": [
    "투표할 플레이어를 선택하세요",
    "과반수가 모이면 바로 변론 단계로 넘어갑니다"
  ],
  "playersReady": 6,
  "totalPlayers": 6,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### Moderator Commentary Message
```typescript
interface ModeratorCommentaryMessage {
  type: 'MODERATOR_COMMENTARY'
  gameNumber: number
  commentary: ModeratorCommentary
  context: GameContext | null
  isRealtime: boolean  // true for dynamic commentary during gameplay
  timestamp: string
}

interface ModeratorCommentary {
  phase: GamePhase
  messages: string[]
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  context?: string
  timestamp: string
}

// Example - Dynamic voting commentary:
{
  "type": "MODERATOR_COMMENTARY",
  "gameNumber": 123,
  "commentary": {
    "phase": "VOTING_FOR_LIAR",
    "messages": [
      "곧 과반수에 도달할 것 같습니다!",
      "남은 2명, 신중하게 투표해주세요."
    ],
    "importance": "MEDIUM",
    "timestamp": "2025-01-15T10:30:30Z"
  },
  "context": {
    "votesRemaining": 2,
    "totalVotes": 6,
    "topCandidate": "player2",
    "topVotes": 3
  },
  "isRealtime": true,
  "timestamp": "2025-01-15T10:30:30Z"
}
```

### Scoring and Victory Messages

#### Real-Time Score Update
```typescript
interface ScoreUpdateMessage {
  type: 'SCORE_UPDATE'
  gameNumber: number
  updateType: 'ROUND_SCORES' | 'CUMULATIVE_UPDATE' | 'BONUS_AWARDED'
  playerScores: { [userId: string]: PlayerScoreInfo }
  roundScores?: { [userId: string]: RoundScoreDetail }
  reason: string
  timestamp: string
}

interface PlayerScoreInfo {
  userId: number
  nickname: string
  currentScore: number
  scoreChange: number
  rank: number
  isLeader: boolean
}

interface RoundScoreDetail {
  baseScore: number
  bonusScore: number
  totalScore: number
  reason: string
  performance: PlayerPerformanceMetrics
}

// Example:
{
  "type": "SCORE_UPDATE",
  "gameNumber": 123,
  "updateType": "ROUND_SCORES",
  "playerScores": {
    "1": {
      "userId": 1,
      "nickname": "player1",
      "currentScore": 7,
      "scoreChange": 4,
      "rank": 1,
      "isLeader": true
    },
    "2": {
      "userId": 2,
      "nickname": "player2", 
      "currentScore": 3,
      "scoreChange": 0,
      "rank": 3,
      "isLeader": false
    }
  },
  "roundScores": {
    "1": {
      "baseScore": 4,
      "bonusScore": 0,
      "totalScore": 4,
      "reason": "정확한 투표로 라이어 제거에 기여",
      "performance": {
        "votingAccuracy": 1.0,
        "hintQuality": 0.8,
        "reactionTime": 15.2
      }
    }
  },
  "reason": "Round 2 completed - Liar eliminated correctly",
  "timestamp": "2025-01-15T10:35:00Z"
}
```

#### Victory Achievement Message
```typescript
interface VictoryMessage {
  type: 'VICTORY_ACHIEVED'
  gameNumber: number
  winner: PlayerInfo
  victoryType: VictoryType
  finalScores: { [userId: string]: number }
  gameStatistics: GameStatistics
  moderatorCommentary: ModeratorCommentary
  postGameOptions: PostGameOptions
  celebrationData: CelebrationData
  timestamp: string
}

interface CelebrationData {
  confettiDuration: number  // milliseconds
  victorySound: string      // audio file path
  specialEffects: string[]  // Array of effect names
  personalizedMessage: string
}

// Example:
{
  "type": "VICTORY_ACHIEVED",
  "gameNumber": 123,
  "winner": {
    "userId": 1,
    "nickname": "player1",
    "score": 12,
    "avatar": "avatar_1.png"
  },
  "victoryType": "TARGET_POINTS_REACHED",
  "finalScores": {
    "1": 12,
    "2": 8,
    "3": 6,
    "4": 5
  },
  "gameStatistics": {
    "totalDuration": 1847,
    "totalRounds": 4,
    "totalHints": 24,
    "accuracyRate": 75.0,
    "mostActivePlayer": "player1",
    "bestLiarPerformance": "player3"
  },
  "moderatorCommentary": {
    "phase": "GAME_OVER",
    "messages": [
      "🎉 축하합니다! player1님이 목표 점수에 먼저 도달했습니다!",
      "최종 점수: 12점",
      "정확한 판단력으로 시민의 역할을 완벽하게 해냈습니다!"
    ],
    "importance": "CRITICAL",
    "timestamp": "2025-01-15T10:45:00Z"
  },
  "postGameOptions": {
    "playAgain": {
      "available": true,
      "description": "같은 설정으로 다시 게임하기",
      "requiresConsensus": true,
      "votes": 0,
      "requiredVotes": 3
    },
    "returnToLobby": {
      "available": true,
      "description": "로비로 돌아가기",
      "requiresConsensus": false,
      "votes": 0,
      "requiredVotes": 1
    }
  },
  "celebrationData": {
    "confettiDuration": 3000,
    "victorySound": "victory_fanfare.mp3",
    "specialEffects": ["crown_animation", "score_burst"],
    "personalizedMessage": "뛰어난 추리력으로 승리를 쟁취했습니다!"
  },
  "timestamp": "2025-01-15T10:45:00Z"
}
```

### Advanced Voting Messages

#### Voting Progress Update
```typescript
interface VotingProgressMessage {
  type: 'VOTING_PROGRESS'
  gameNumber: number
  phase: GamePhase
  currentVotes: number
  requiredVotes: number
  votedPlayers: VotedPlayerInfo[]
  pendingPlayers: PendingPlayerInfo[]
  voteDistribution: { [targetId: string]: number }
  topCandidate: CandidateInfo | null
  isMajorityReached: boolean
  canProgressImmediately: boolean
  timeRemaining: number | null
  timestamp: string
}

interface CandidateInfo {
  playerId: number
  nickname: string
  votes: number
  percentage: number
  isLeading: boolean
}

// Example:
{
  "type": "VOTING_PROGRESS",
  "gameNumber": 123,
  "phase": "VOTING_FOR_LIAR",
  "currentVotes": 4,
  "requiredVotes": 6,
  "votedPlayers": [
    {
      "userId": 1,
      "nickname": "player1",
      "votedAt": "2025-01-15T10:30:15Z",
      "confidence": 0.8
    }
  ],
  "pendingPlayers": [
    {
      "userId": 2,
      "nickname": "player2",
      "timeRemaining": 45
    }
  ],
  "voteDistribution": {
    "3": 3,
    "4": 1
  },
  "topCandidate": {
    "playerId": 3,
    "nickname": "player3",
    "votes": 3,
    "percentage": 75.0,
    "isLeading": true
  },
  "isMajorityReached": false,
  "canProgressImmediately": false,
  "timeRemaining": 45,
  "timestamp": "2025-01-15T10:30:45Z"
}
```

#### Majority Reached Notification
```typescript
interface MajorityReachedMessage {
  type: 'MAJORITY_REACHED'
  gameNumber: number
  phase: GamePhase
  accusedPlayer: PlayerInfo
  finalVoteCount: number
  totalVoters: number
  votePercentage: number
  moderatorReaction: ModeratorCommentary
  nextPhaseStartsIn: number  // seconds
  timestamp: string
}

// Example:
{
  "type": "MAJORITY_REACHED",
  "gameNumber": 123,
  "phase": "VOTING_FOR_LIAR",
  "accusedPlayer": {
    "userId": 3,
    "nickname": "player3",
    "avatar": "avatar_3.png"
  },
  "finalVoteCount": 4,
  "totalVoters": 6,
  "votePercentage": 66.7,
  "moderatorReaction": {
    "phase": "VOTING_FOR_LIAR",
    "messages": [
      "🗳️ 과반수에 도달했습니다!",
      "player3님이 4표로 변론 기회를 가집니다.",
      "정말 라이어일까요? 변론을 들어보겠습니다!"
    ],
    "importance": "HIGH",
    "timestamp": "2025-01-15T10:31:00Z"
  },
  "nextPhaseStartsIn": 5,
  "timestamp": "2025-01-15T10:31:00Z"
}
```

### Post-Game Flow Messages

#### Post-Game Options Available
```typescript
interface PostGameOptionsMessage {
  type: 'POST_GAME_OPTIONS_AVAILABLE'
  gameNumber: number
  sessionToken: string
  hostUserId: number
  options: PostGameOptions
  playerChoices: { [userId: string]: PostGameAction | null }
  consensusStatus: ConsensusStatus
  expiresAt: string  // ISO 8601
  timestamp: string
}

interface PostGameOptions {
  playAgain: PostGameOption
  returnToLobby: PostGameOption
  viewDetailedStats: PostGameOption
  customOptions?: PostGameOption[]
}

interface ConsensusStatus {
  required: boolean
  achieved: boolean
  playersRemaining: number
  playersResponded: number
  leadingChoice: PostGameAction | null
  leadingVotes: number
}

// Example:
{
  "type": "POST_GAME_OPTIONS_AVAILABLE",
  "gameNumber": 123,
  "sessionToken": "pg_abc123def456",
  "hostUserId": 1,
  "options": {
    "playAgain": {
      "available": true,
      "description": "같은 설정으로 다시 게임하기",
      "requiresConsensus": true,
      "estimatedDuration": 1800,
      "votes": 2,
      "requiredVotes": 4
    },
    "returnToLobby": {
      "available": true,
      "description": "로비로 돌아가기",
      "requiresConsensus": false,
      "votes": 1,
      "requiredVotes": 1
    },
    "viewDetailedStats": {
      "available": true,
      "description": "상세 통계 및 분석 보기",
      "requiresConsensus": false,
      "votes": 0,
      "requiredVotes": 1
    }
  },
  "playerChoices": {
    "1": "PLAY_AGAIN",
    "2": "PLAY_AGAIN", 
    "3": "RETURN_LOBBY",
    "4": null,
    "5": null,
    "6": null
  },
  "consensusStatus": {
    "required": true,
    "achieved": false,
    "playersRemaining": 6,
    "playersResponded": 3,
    "leadingChoice": "PLAY_AGAIN",
    "leadingVotes": 2
  },
  "expiresAt": "2025-01-15T10:50:00Z",
  "timestamp": "2025-01-15T10:45:30Z"
}
```

#### Post-Game Choice Update
```typescript
interface PostGameChoiceMessage {
  type: 'POST_GAME_CHOICE_UPDATE'
  gameNumber: number
  sessionToken: string
  playerUserId: number
  playerNickname: string
  chosenAction: PostGameAction
  updatedChoices: { [userId: string]: PostGameAction | null }
  consensusStatus: ConsensusStatus
  finalDecision: PostGameFinalDecision | null
  timestamp: string
}

interface PostGameFinalDecision {
  action: PostGameAction
  reason: string
  newGameNumber?: number
  redirectUrl?: string
  countdown?: number  // seconds until action
}

// Example - Consensus reached:
{
  "type": "POST_GAME_CHOICE_UPDATE",
  "gameNumber": 123,
  "sessionToken": "pg_abc123def456",
  "playerUserId": 4,
  "playerNickname": "player4",
  "chosenAction": "PLAY_AGAIN",
  "updatedChoices": {
    "1": "PLAY_AGAIN",
    "2": "PLAY_AGAIN", 
    "3": "PLAY_AGAIN",
    "4": "PLAY_AGAIN",
    "5": "PLAY_AGAIN",
    "6": "RETURN_LOBBY"
  },
  "consensusStatus": {
    "required": true,
    "achieved": true,
    "playersRemaining": 6,
    "playersResponded": 6,
    "leadingChoice": "PLAY_AGAIN",
    "leadingVotes": 5
  },
  "finalDecision": {
    "action": "PLAY_AGAIN",
    "reason": "과반수가 다시 플레이를 선택했습니다 (5/6)",
    "newGameNumber": 124,
    "countdown": 10
  },
  "timestamp": "2025-01-15T10:47:15Z"
}
```

### Enhanced Timer Messages

#### Dynamic Phase Timer Update
```typescript
interface PhaseTimerMessage {
  type: 'PHASE_TIMER_UPDATE'
  gameNumber: number
  phase: GamePhase
  timeRemaining: number
  totalDuration: number
  warningLevel: 'NONE' | 'NORMAL' | 'WARNING' | 'URGENT' | 'CRITICAL'
  canExtend: boolean
  extensionsUsed: number
  maxExtensions: number
  playersReady: number
  totalPlayers: number
  autoProgressConditions: AutoProgressCondition[]
  timestamp: string
}

interface AutoProgressCondition {
  type: string  // 'ALL_PLAYERS_READY', 'MAJORITY_REACHED', etc.
  satisfied: boolean
  description: string
}

// Example:
{
  "type": "PHASE_TIMER_UPDATE",
  "gameNumber": 123,
  "phase": "VOTING_FOR_LIAR",
  "timeRemaining": 15,
  "totalDuration": 60,
  "warningLevel": "URGENT",
  "canExtend": true,
  "extensionsUsed": 0,
  "maxExtensions": 1,
  "playersReady": 4,
  "totalPlayers": 6,
  "autoProgressConditions": [
    {
      "type": "MAJORITY_REACHED",
      "satisfied": false,
      "description": "과반수 투표 완료 시 즉시 진행"
    },
    {
      "type": "ALL_VOTES_CAST",
      "satisfied": false, 
      "description": "모든 플레이어 투표 완료 시 즉시 진행"
    }
  ],
  "timestamp": "2025-01-15T10:30:45Z"
}
```

### Achievement and Statistics Messages

#### Achievement Unlocked
```typescript
interface AchievementMessage {
  type: 'ACHIEVEMENT_UNLOCKED'
  userId: number
  achievement: AchievementInfo
  unlockedInGame: number
  progressData: any
  isSecret: boolean
  rewardPoints: number
  celebrationData: AchievementCelebration
  timestamp: string
}

interface AchievementInfo {
  id: number
  code: string
  name: string
  description: string
  category: string
  difficulty: string
  iconUrl: string
}

interface AchievementCelebration {
  duration: number
  animation: string
  sound: string
  showGlobal: boolean  // Show to all players in game
}

// Example:
{
  "type": "ACHIEVEMENT_UNLOCKED",
  "userId": 1,
  "achievement": {
    "id": 15,
    "code": "PERFECT_CITIZEN",
    "name": "완벽한 시민",
    "description": "한 게임에서 시민으로서 모든 라운드에서 정확하게 투표",
    "category": "SCORING",
    "difficulty": "MEDIUM",
    "iconUrl": "/achievements/perfect_citizen.png"
  },
  "unlockedInGame": 123,
  "progressData": {
    "accurateVotes": 4,
    "totalVotes": 4,
    "accuracyRate": 1.0
  },
  "isSecret": false,
  "rewardPoints": 250,
  "celebrationData": {
    "duration": 4000,
    "animation": "achievement_sparkle",
    "sound": "achievement_chime.mp3",
    "showGlobal": true
  },
  "timestamp": "2025-01-15T10:45:00Z"
}
```

## 3. Client-Side Implementation Examples

### Enhanced WebSocket Connection Setup
```typescript
class EnhancedGameWebSocket {
  private stompClient: Stomp.Client
  private subscriptions: Map<string, Subscription> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  constructor(private gameNumber: number, private userId: number) {
    this.connect()
  }
  
  private connect(): void {
    const socket = new SockJS('/ws')
    this.stompClient = Stomp.over(socket)
    
    // Enhanced connection headers for session recovery
    const connectHeaders: any = {
      'x-game-number': this.gameNumber.toString(),
      'x-user-id': this.userId.toString()
    }
    
    // Include session recovery token if available
    const recoveryToken = localStorage.getItem(`game_${this.gameNumber}_recovery_token`)
    if (recoveryToken) {
      connectHeaders['x-recovery-token'] = recoveryToken
    }
    
    this.stompClient.connect(connectHeaders, (frame) => {
      console.log('Connected to enhanced WebSocket:', frame)
      
      // Store new recovery token
      const newToken = frame.headers['x-recovery-token']
      if (newToken) {
        localStorage.setItem(`game_${this.gameNumber}_recovery_token`, newToken)
      }
      
      this.subscribeToChannels()
      this.resetReconnectAttempts()
    }, (error) => {
      console.error('WebSocket connection error:', error)
      this.handleConnectionError()
    })
  }
  
  private subscribeToChannels(): void {
    // Core game channels
    this.subscribe('/topic/game/' + this.gameNumber + '/state', this.handleGameState.bind(this))
    this.subscribe('/topic/game/' + this.gameNumber + '/chat', this.handleChatMessage.bind(this))
    this.subscribe('/topic/game/' + this.gameNumber + '/events', this.handleGameEvent.bind(this))
    
    // Enhanced channels
    this.subscribe('/topic/game/' + this.gameNumber + '/flow', this.handleGameFlow.bind(this))
    this.subscribe('/topic/game/' + this.gameNumber + '/scoring', this.handleScoring.bind(this))
    this.subscribe('/topic/game/' + this.gameNumber + '/moderator', this.handleModerator.bind(this))
    this.subscribe('/topic/game/' + this.gameNumber + '/victory', this.handleVictory.bind(this))
    this.subscribe('/topic/game/' + this.gameNumber + '/post-game', this.handlePostGame.bind(this))
    
    // User-specific channels
    this.subscribe('/topic/user/' + this.userId + '/notifications', this.handleUserNotification.bind(this))
    this.subscribe('/topic/user/' + this.userId + '/achievements', this.handleAchievement.bind(this))
  }
  
  private handleGameFlow(message: Stomp.Message): void {
    const data: PhaseTransitionMessage = JSON.parse(message.body)
    
    switch (data.type) {
      case 'PHASE_TRANSITION':
        this.onPhaseTransition(data)
        break
    }
  }
  
  private onPhaseTransition(data: PhaseTransitionMessage): void {
    // Update UI for new phase
    this.updatePhaseUI(data.currentPhase)
    
    // Display moderator commentary
    if (data.moderatorCommentary) {
      this.displayModeratorCommentary(data.moderatorCommentary)
    }
    
    // Start phase-specific timers
    if (data.timeLimit) {
      this.startPhaseTimer(data.timeLimit, data.currentPhase)
    }
    
    // Show next actions to players
    if (data.nextActions.length > 0) {
      this.displayActionInstructions(data.nextActions)
    }
    
    // Trigger phase-specific UI changes
    this.setupPhaseInterface(data.currentPhase, data)
  }
  
  private handleScoring(message: Stomp.Message): void {
    const data: ScoreUpdateMessage = JSON.parse(message.body)
    
    switch (data.type) {
      case 'SCORE_UPDATE':
        this.updateScoreboard(data)
        break
    }
  }
  
  private handleVictory(message: Stomp.Message): void {
    const data: VictoryMessage = JSON.parse(message.body)
    
    // Show victory celebration
    this.showVictoryCelebration(data)
    
    // Display final statistics
    this.displayGameStatistics(data.gameStatistics)
    
    // Show post-game options
    setTimeout(() => {
      this.showPostGameOptions(data.postGameOptions)
    }, data.celebrationData.confettiDuration)
  }
  
  private handlePostGame(message: Stomp.Message): void {
    const data = JSON.parse(message.body)
    
    switch (data.type) {
      case 'POST_GAME_OPTIONS_AVAILABLE':
        this.displayPostGameOptions(data)
        break
      case 'POST_GAME_CHOICE_UPDATE':
        this.updatePostGameChoices(data)
        break
    }
  }
  
  // Enhanced error handling and recovery
  private handleConnectionError(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000 // Exponential backoff
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    } else {
      console.error('Max reconnection attempts reached')
      this.onConnectionFailed()
    }
  }
  
  private onConnectionFailed(): void {
    // Show connection failed UI
    // Offer manual reconnect option
    // Optionally redirect to lobby
  }
}
```

### Phase-Specific UI Handlers
```typescript
class GameFlowUIManager {
  private currentPhase: GamePhase
  private phaseTimer: number | null = null
  
  setupPhaseInterface(phase: GamePhase, data: PhaseTransitionMessage): void {
    this.currentPhase = phase
    this.clearPreviousPhaseUI()
    
    switch (phase) {
      case 'SPEECH':
        this.setupHintPhase(data)
        break
      case 'VOTING_FOR_LIAR':
        this.setupVotingPhase(data)
        break
      case 'DEFENDING':
        this.setupDefensePhase(data)
        break
      case 'VOTING_FOR_SURVIVAL':
        this.setupSurvivalVotingPhase(data)
        break
      case 'GUESSING_WORD':
        this.setupWordGuessPhase(data)
        break
      case 'GAME_OVER':
        this.setupGameOverPhase(data)
        break
    }
  }
  
  private setupVotingPhase(data: PhaseTransitionMessage): void {
    // Show voting interface
    const votingUI = document.getElementById('voting-interface')
    if (votingUI) {
      votingUI.style.display = 'block'
      this.populateVotingCandidates()
    }
    
    // Show voting progress indicator
    const progressUI = document.getElementById('voting-progress')
    if (progressUI) {
      progressUI.style.display = 'block'
      this.initializeVotingProgress()
    }
    
    // Enable voting controls
    this.enableVotingControls()
  }
  
  updateVotingProgress(data: VotingProgressMessage): void {
    // Update progress bar
    const progressBar = document.getElementById('vote-progress-bar') as HTMLProgressElement
    if (progressBar) {
      progressBar.value = data.currentVotes
      progressBar.max = data.requiredVotes
    }
    
    // Update vote distribution visualization
    this.updateVoteDistribution(data.voteDistribution)
    
    // Show top candidate if majority is close
    if (data.topCandidate && data.currentVotes / data.requiredVotes > 0.8) {
      this.highlightTopCandidate(data.topCandidate)
    }
    
    // Auto-progress if majority reached
    if (data.isMajorityReached && data.canProgressImmediately) {
      this.showMajorityReachedNotification(data.topCandidate!)
    }
  }
  
  displayModeratorCommentary(commentary: ModeratorCommentary): void {
    const commentaryBox = document.getElementById('moderator-commentary')
    if (!commentaryBox) return
    
    // Clear previous commentary
    commentaryBox.innerHTML = ''
    
    // Add importance-based styling
    commentaryBox.className = `moderator-commentary ${commentary.importance.toLowerCase()}`
    
    // Display messages with typing animation
    commentary.messages.forEach((message, index) => {
      setTimeout(() => {
        const messageElement = document.createElement('p')
        messageElement.textContent = message
        commentaryBox.appendChild(messageElement)
        
        // Add typing animation
        this.animateTextTyping(messageElement, message)
        
        // Auto-hide low importance messages
        if (commentary.importance === 'LOW') {
          setTimeout(() => {
            messageElement.style.opacity = '0.7'
          }, 5000)
        }
      }, index * 1500) // Stagger message display
    })
  }
  
  showVictoryCelebration(data: VictoryMessage): void {
    // Show confetti animation
    if (data.celebrationData.confettiDuration > 0) {
      this.startConfettiAnimation(data.celebrationData.confettiDuration)
    }
    
    // Play victory sound
    if (data.celebrationData.victorySound) {
      this.playSound(data.celebrationData.victorySound)
    }
    
    // Show winner announcement
    const winnerElement = document.getElementById('victory-winner')
    if (winnerElement && data.winner) {
      winnerElement.innerHTML = `
        <div class="winner-card">
          <div class="crown-animation"></div>
          <h2>🏆 Winner: ${data.winner.nickname}</h2>
          <p>Final Score: ${data.winner.score} points</p>
          <p class="victory-type">${this.getVictoryTypeMessage(data.victoryType)}</p>
          <div class="personalized-message">${data.celebrationData.personalizedMessage}</div>
        </div>
      `
    }
    
    // Show final scoreboard with rankings
    this.displayFinalScoreboard(data.finalScores, data.winner.userId)
  }
}
```

## 4. Integration with Existing Backend

### Enhanced GameMessagingService Integration
```kotlin
@Service
class EnhancedGameMessagingService(
    private val messagingTemplate: SimpMessagingTemplate,
    private val moderatorService: ModeratorService,
    private val gameAnalyticsService: GameAnalyticsService
) {
    
    /**
     * Broadcast enhanced phase transition with moderator commentary
     */
    fun broadcastPhaseTransition(gameNumber: Int, transition: GamePhaseTransitionResponse) {
        val message = mapOf(
            "type" to "PHASE_TRANSITION",
            "gameNumber" to gameNumber,
            "previousPhase" to transition.previousPhase.toString(),
            "currentPhase" to transition.currentPhase.toString(),
            "trigger" to transition.trigger.toString(),
            "moderatorCommentary" to transition.moderatorCommentary,
            "phaseEndTime" to transition.phaseEndTime?.toString(),
            "timeLimit" to transition.timeLimit,
            "nextActions" to transition.nextActions,
            "timestamp" to transition.timestamp.toString()
        )
        
        // Send to game flow channel
        messagingTemplate.convertAndSend("/topic/game/$gameNumber/flow", message)
        
        // Also send to main events channel for backward compatibility
        messagingTemplate.convertAndSend("/topic/game/$gameNumber/events", message)
        
        // Track analytics
        gameAnalyticsService.recordPhaseTransition(gameNumber, transition)
    }
    
    /**
     * Send dynamic moderator commentary
     */
    fun sendDynamicModeratorCommentary(gameNumber: Int, commentary: ModeratorCommentary) {
        val message = mapOf(
            "type" to "MODERATOR_COMMENTARY",
            "gameNumber" to gameNumber,
            "commentary" to commentary,
            "isRealtime" to true,
            "timestamp" to Instant.now().toString()
        )
        
        messagingTemplate.convertAndSend("/topic/game/$gameNumber/moderator", message)
    }
    
    /**
     * Broadcast score updates with detailed breakdown
     */
    fun broadcastScoreUpdate(gameNumber: Int, scoreResult: RoundScoringResult) {
        val message = mapOf(
            "type" to "SCORE_UPDATE",
            "gameNumber" to gameNumber,
            "updateType" to "ROUND_SCORES",
            "playerScores" to scoreResult.playerScores.mapValues { (userId, score) ->
                mapOf(
                    "userId" to userId,
                    "nickname" to score.nickname,
                    "currentScore" to score.totalScore,
                    "scoreChange" to score.totalScore,
                    "rank" to calculateRank(userId, scoreResult.playerScores),
                    "isLeader" to isCurrentLeader(userId, scoreResult.playerScores)
                )
            },
            "roundScores" to scoreResult.playerScores,
            "reason" to scoreResult.outcome.description,
            "timestamp" to scoreResult.timestamp.toString()
        )
        
        messagingTemplate.convertAndSend("/topic/game/$gameNumber/scoring", message)
    }
}
```

This comprehensive WebSocket protocol enhancement provides:

1. **Rich Real-time Communication** - Detailed message types for every aspect of game flow
2. **Moderator Commentary Integration** - Dynamic, contextual commentary system
3. **Advanced Scoring Updates** - Real-time score calculation and distribution
4. **Victory Celebration System** - Immersive victory announcements with personalization
5. **Post-Game Flow Management** - Seamless transitions between games
6. **Enhanced Error Handling** - Robust reconnection and recovery mechanisms
7. **Performance Analytics** - Real-time game performance tracking
8. **Achievement System** - Instant achievement notifications and celebrations

The protocol is designed to be backward-compatible while providing rich new functionality for the complete game flow experience.