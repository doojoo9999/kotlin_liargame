# Liar Game Complete Flow Mechanics & Progression System

## Executive Summary

This document outlines the complete game flow mechanics and progression system for the Liar Game, designed to provide balanced, engaging, and replayable gameplay with clear progression and satisfying conclusion mechanics.

## 1. Complete Game Flow Design

### 1.1 Primary Game Sequence
```
게임시작 → 주제+답안 확인 → 힌트 타임 → 라이어 지목 → 라이어 변론 → 생존 투표 → 
승점 획득 → 승점 확인 → [승리 조건 달성 시] 게임 승리 → 한판 더하기 or 로비로 나가기
```

### 1.2 Detailed Phase Breakdown

#### Phase 1: Game Initialization (게임시작)
- **Duration**: 10 seconds countdown
- **Actions**:
  - Display topic assignment animation
  - Show role assignments (Citizen vs Liar)
  - Initialize player turn order randomly
  - Display current round info (Round X/Total Rounds)
  - Show current scoreboard

#### Phase 2: Topic & Answer Confirmation (주제+답안 확인)
- **Duration**: 15 seconds
- **Citizen Actions**:
  - View topic category
  - View assigned specific word
  - Prepare hint strategy
- **Liar Actions**:
  - View topic category only
  - Analyze available hints from others
  - Prepare deduction strategy

#### Phase 3: Hint Time (힌트 타임)
- **Duration**: 45 seconds per player
- **Turn-based Mechanics**:
  - Sequential hint giving (round-robin)
  - 45-second individual timer per player
  - Visual countdown with warnings (10, 5 seconds remaining)
- **Hint Rules**:
  - Maximum 20 characters per hint
  - Cannot use the exact word or obvious derivatives
  - Cannot give hints about previous hints
- **Real-time Updates**:
  - Display all given hints immediately
  - Show whose turn it is next
  - Highlight current speaker

#### Phase 4: Liar Identification (라이어 지목)
- **Duration**: 60 seconds
- **Voting Mechanics**:
  - Each player votes for one suspected liar
  - Cannot vote for themselves
  - Visual voting interface with player portraits
  - Real-time vote tally (hidden from players)
- **Majority System**:
  - Player with most votes becomes accused
  - Tie-breaker: Random selection among tied players
  - Minimum 50% participation required

#### Phase 5: Liar Defense (라이어 변론)
- **Duration**: 90 seconds
- **Defense Mechanics**:
  - Accused player gets defense opportunity
  - Can provide reasoning for innocence
  - Can attempt to identify real liar
  - Other players can ask one clarifying question each

#### Phase 6: Survival Vote (생존 투표)
- **Duration**: 45 seconds
- **Final Judgment**:
  - Vote "Guilty" or "Innocent" for accused player
  - Simple majority rules (>50%)
  - Abstention counts as "Innocent"

#### Phase 7: Point Award & Victory Check (승점 획득 및 승리 확인)
- **Immediate Scoring**: Apply round results to cumulative scores
- **Victory Condition Check**: Check if any player reached target points
- **Results Display**: Show round summary and updated scoreboard

## 2. Detailed Scoring System

### 2.1 Point Allocation Matrix

#### Scenario 1: Liar Correctly Identified and Eliminated
- **Citizens who voted correctly**: +3 points
- **Citizens who voted incorrectly**: +0 points  
- **Eliminated Liar**: +0 points
- **Non-accused Liar (if multiple)**: +5 points (survived)

#### Scenario 2: Innocent Player Eliminated
- **All Liars**: +4 points each
- **Citizens who voted to eliminate**: -1 point each
- **Citizens who voted to save**: +1 point each
- **Eliminated Innocent**: +0 points

#### Scenario 3: Liar Survives Vote
- **Surviving Liar**: +6 points
- **Citizens**: +0 points
- **Other Liars**: +2 points each

#### Scenario 4: Topic Guessing Bonus (Post-Vote)
- **Liar guesses topic correctly**: +3 bonus points
- **Liar guesses incorrectly**: +0 bonus points

### 2.2 Victory Conditions
- **Primary Victory**: First player to reach 10 points wins
- **Secondary Victory**: Highest score after maximum rounds (default: 8 rounds)
- **Tie-breaker**: Sudden death round with winner-takes-all scoring

### 2.3 Scoring Balance Considerations
- **Liar Advantage**: Higher potential points to offset information disadvantage
- **Citizen Cooperation**: Rewards for correct group decisions
- **Risk/Reward**: Higher stakes for accusation accuracy

## 3. Game Balance Design

### 3.1 Turn Timing & Phase Duration

#### Optimal Time Allocations
```javascript
const PHASE_TIMINGS = {
  gameStart: 10,           // Quick role confirmation
  topicConfirm: 15,        // Adequate word absorption
  hintTime: 45,            // Per player, allows strategic thinking
  voting: 60,              // Sufficient deliberation time
  defense: 90,             // Fair defense opportunity
  finalVote: 45,           // Quick decisive voting
  results: 30,             // Score update and celebration
  nextRound: 15            // Preparation time
}
```

#### Dynamic Time Adjustments
- **Player Count Scaling**: +5 seconds per player above 4 for voting phases
- **Round Progression**: -5 seconds from hint time after round 3 (players get faster)
- **Emergency Extensions**: Host can add 30 seconds once per phase

### 3.2 Voting Thresholds & Majority Mechanics

#### Primary Voting (Liar Identification)
- **Participation Threshold**: Minimum 75% of players must vote
- **Decision Method**: Plurality wins (most votes)
- **Tie Resolution**: Random selection among tied players
- **Auto-vote**: Non-voters receive random assignment after timeout

#### Survival Voting  
- **Binary Choice**: Guilty (eliminate) vs Innocent (save)
- **Majority Requirement**: >50% for elimination
- **Default**: Insufficient votes = player survives
- **Weighted Impact**: Show vote confidence levels

### 3.3 Hint Giving Constraints

#### Content Restrictions
- **Character Limit**: 20 characters maximum
- **Word Restrictions**: Cannot contain root word or direct translations
- **Uniqueness**: Cannot repeat or closely mirror previous hints
- **Language**: Single language consistency per game

#### Quality Enforcement
```javascript
const HINT_VALIDATION = {
  maxLength: 20,
  bannedWords: [], // populated with topic words
  similarity: 0.7, // maximum similarity to existing hints
  profanity: true, // enable filter
  emoji: false     // disable emoji use
}
```

### 3.4 Defense Time Limits

#### Defense Mechanics
- **Initial Defense**: 90 seconds uninterrupted
- **Q&A Round**: 30 seconds per question, max 5 questions
- **Rebuttal Time**: 30 seconds for final statement
- **Total Maximum**: 4 minutes defense phase

## 4. Player Psychology & Engagement

### 4.1 Information Asymmetry Design

#### Citizen Advantages
- **Topic Knowledge**: Full information about the topic
- **Collaboration**: Can coordinate through hints
- **Majority Power**: Numerical advantage in voting

#### Liar Advantages  
- **Hidden Information**: Other players don't know their identity
- **Deduction Skills**: Can gather information from citizen hints
- **Higher Scoring**: Potential for greater point rewards

#### Balance Mechanism
- **Progressive Difficulty**: Liar task becomes easier as more hints are given
- **Social Dynamics**: Liars can create suspicion between citizens
- **Score Compensation**: Higher point potential for liars balances difficulty

### 4.2 Tension Building Mechanics

#### Escalating Stakes
```javascript
const TENSION_CURVE = {
  hintPhase: {
    early: "Information gathering",
    middle: "Pattern recognition", 
    late: "Suspicion formation"
  },
  votingPhase: {
    building: "Alliance formation",
    climax: "Accusation moment",
    resolution: "Collective decision"
  },
  defensePhase: {
    uncertainty: "Doubt creation",
    revelation: "Truth or deception",
    judgment: "Final decision"
  }
}
```

#### Psychological Pressure Points
- **Time Pressure**: Countdown creates urgency
- **Social Pressure**: Public voting creates accountability  
- **Information Pressure**: Limited clues force deduction
- **Performance Pressure**: Individual spotlight during defense

### 4.3 Social Deduction Elements

#### Trust Building Mechanics
- **Consistent Behavior**: Reward logical hint patterns
- **Collaborative Hints**: Citizens can build on each other's hints
- **Voting History**: Display past voting accuracy

#### Deception Detection
- **Behavioral Indicators**: Track hesitation, hint quality, voting patterns
- **Linguistic Analysis**: Hint sophistication and relevance
- **Social Dynamics**: Alliance formation and betrayal patterns

### 4.4 Engagement Hooks for Different Player Types

#### Competitive Players
- **Leaderboard System**: Session and all-time statistics
- **Achievement System**: Special accomplishments and badges
- **Ranking System**: ELO-based skill rating
- **Tournament Mode**: Structured competitive play

#### Social Players  
- **Team Victories**: Shared celebration for successful citizen cooperation
- **Drama Moments**: Memorable defense and accusation moments
- **Chat Integration**: Pre-game and post-round discussion
- **Storytelling**: Round recap with narrative elements

#### Analytical Players
- **Statistical Feedback**: Detailed performance analytics
- **Strategy Guides**: Advanced tips and meta-game analysis
- **Pattern Recognition**: Historical data on player behaviors
- **Optimization Challenges**: Efficiency in hint giving and deduction

## 5. End Game Options & Flow

### 5.1 Victory Celebration & Statistics

#### Victory Announcement
```javascript
const VICTORY_SEQUENCE = {
  animation: "Confetti and crown graphic",
  duration: 8000,
  music: "Triumphant victory theme",
  statistics: {
    totalPoints: number,
    roundsWon: number,
    accuracy: percentage,
    hintsGiven: number,
    correctGuesses: number
  }
}
```

#### Individual Performance Summary
- **Round-by-Round Breakdown**: Points earned each round
- **Role Performance**: Success rate as Citizen vs Liar
- **Social Impact**: Influence on other players' decisions
- **Improvement Areas**: Suggested focus for future games

### 5.2 "Play Again" Mechanics

#### Instant Rematch Options
- **Same Players**: Keep current lobby for immediate next game
- **Role Shuffle**: Randomize roles for variety
- **Difficulty Adjustment**: Modify settings based on previous game
- **Quick Start**: Skip lobby wait time for continuing players

#### Progression Continuity
```javascript
const PROGRESSION_SYSTEM = {
  sessionStats: {
    gamesPlayed: 0,
    wins: 0,
    totalPoints: 0,
    longestStreak: 0
  },
  carryOver: {
    achievements: true,
    unlocks: true,
    preferences: true,
    skillRating: true
  }
}
```

### 5.3 Return to Lobby Flow

#### Graceful Exit Options
- **Individual Exit**: Players can leave without disrupting others
- **Group Dissolution**: All players return to main lobby together
- **Host Migration**: Automatic host transfer if leader leaves
- **Room Persistence**: Option to keep room open for new players

#### Lobby Integration
- **Recent Players**: Quick access to players from last game
- **Recommended Matches**: Suggest games based on skill level
- **Achievement Notifications**: Display new unlocks from previous game
- **Social Features**: Friend requests and player endorsements

### 5.4 Score Persistence & Long-term Progression

#### Session Management
```javascript
const SCORE_PERSISTENCE = {
  shortTerm: {
    currentSession: "In-memory tracking",
    duration: "Until browser close",
    scope: "Current game lobby"
  },
  longTerm: {
    userProfile: "Server-side storage", 
    duration: "Permanent",
    scope: "Account-wide statistics"
  }
}
```

#### Meta-Progression Systems
- **Skill Rating**: ELO-based matchmaking score
- **Experience Points**: General progression system
- **Unlockable Content**: New themes, avatars, achievements
- **Seasonal Content**: Limited-time events and rewards

## 6. Technical Implementation Considerations

### 6.1 State Management Architecture

#### Game State Transitions
```javascript
const GAME_STATES = {
  WAITING: "Players joining lobby",
  STARTING: "Game initialization", 
  TOPIC_REVEAL: "Topic assignment phase",
  HINT_PHASE: "Sequential hint giving",
  VOTING_PHASE: "Liar identification voting",
  DEFENSE_PHASE: "Accused player defense",
  SURVIVAL_VOTE: "Final elimination vote",
  ROUND_RESULTS: "Score calculation and display",
  GAME_END: "Final results and options",
  TRANSITION: "Between rounds"
}
```

### 6.2 Scoring Calculation Engine

#### Real-time Score Updates
```javascript
class ScoreCalculator {
  calculateRoundScore(gameState, playerActions, roundResult) {
    const scores = {};
    
    // Base scoring logic
    players.forEach(player => {
      scores[player.id] = this.getBaseScore(player, roundResult);
      scores[player.id] += this.getBonusScore(player, playerActions);
      scores[player.id] += this.getPenaltyScore(player, playerActions);
    });
    
    // Apply balance adjustments
    return this.applyBalanceModifiers(scores, gameState);
  }
  
  checkVictoryCondition(playerScores, targetPoints) {
    return Object.values(playerScores).some(score => score >= targetPoints);
  }
}
```

### 6.3 Timer Management System

#### Synchronized Countdown System
```javascript
class GameTimer {
  startPhaseTimer(phase, duration, callbacks) {
    this.currentPhase = phase;
    this.startTime = Date.now();
    this.duration = duration * 1000;
    
    // Broadcast timer updates
    this.timerInterval = setInterval(() => {
      const remaining = this.getRemainingTime();
      callbacks.onTick(remaining);
      
      if (remaining <= 0) {
        this.endPhase(callbacks.onComplete);
      }
    }, 1000);
  }
}
```

## 7. Balancing Formulas & Mathematical Models

### 7.1 Point Distribution Mathematical Model

#### Expected Value Calculations
```javascript
// Citizen Expected Value per Round
const citizenEV = (p_correct * 3) + (p_incorrect * 0) + (p_false_positive * -1);

// Liar Expected Value per Round  
const liarEV = (p_survival * 6) + (p_elimination * 0) + (p_correct_guess * 3);

// Balance Condition: citizenEV ≈ liarEV for fair gameplay
```

#### Dynamic Difficulty Adjustment
```javascript
const DIFFICULTY_MODIFIERS = {
  playerCount: {
    4: { liarBonus: 1.2, citizenPenalty: 0.9 },
    5: { liarBonus: 1.1, citizenPenalty: 0.95 },
    6: { liarBonus: 1.0, citizenPenalty: 1.0 },
    7: { liarBonus: 0.9, citizenPenalty: 1.05 },
    8: { liarBonus: 0.8, citizenPenalty: 1.1 }
  },
  roundProgression: {
    early: { information: 0.7, tension: 0.8 },
    middle: { information: 1.0, tension: 1.0 },
    late: { information: 1.3, tension: 1.2 }
  }
}
```

### 7.2 Engagement Retention Model

#### Player Retention Prediction
```javascript
const RETENTION_FACTORS = {
  gameLength: -0.1,        // Longer games reduce retention
  winRate: 0.8,           // Higher win rate increases retention  
  socialInteraction: 0.6, // More interaction improves retention
  skillBalance: 0.4,      // Balanced matches increase retention
  newContent: 0.3         // Fresh content maintains interest
}
```

## 8. Implementation Roadmap

### Phase 1: Core Game Flow (2 weeks)
- Implement complete game state machine
- Build timer management system
- Create basic scoring calculation
- Develop phase transition logic

### Phase 2: Advanced Mechanics (2 weeks)  
- Implement dynamic scoring adjustments
- Add tie-breaker resolution
- Create defense mechanics
- Build vote validation system

### Phase 3: Player Experience (1 week)
- Design victory celebration sequences
- Implement play-again flow
- Create statistics tracking
- Add progression persistence

### Phase 4: Balance & Polish (1 week)
- Tune scoring formulas based on playtesting
- Optimize timer durations
- Refine user interface elements
- Conduct final balance testing

## Conclusion

This comprehensive game flow design creates a balanced, engaging, and replayable Liar Game experience. The system provides clear progression mechanics, fair scoring, and satisfying conclusion options while maintaining the core social deduction gameplay that makes the genre compelling.

The mathematical models ensure fair competition between roles, while the psychological elements create memorable and engaging social interactions. The technical implementation supports real-time gameplay with robust state management and synchronized timing systems.

Key success factors:
- **Balanced scoring** that rewards both successful citizens and clever liars
- **Clear progression** from hint-giving through final voting
- **Engaging social dynamics** that create memorable moments
- **Satisfying conclusions** with meaningful victory conditions
- **Replayability** through varied scenarios and progressive difficulty

This design framework provides the foundation for a compelling multiplayer social deduction game that will engage players across multiple sessions and create lasting entertainment value.