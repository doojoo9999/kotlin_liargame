// Predefined scenario messages for the narrator system
// As specified in requirements: 5 key game scenarios with appropriate styling and effects

const PRIORITY_LEVELS = {
  LOW: 1,
  NORMAL: 2, 
  HIGH: 3,
  CRITICAL: 4
}

// Message templates with dynamic content support
const scenarioMessages = {
  // 1. Game start message
  gameStart: {
    text: "라이어 게임을 시작합니다! 🎮",
    category: "info",
    icon: "🎮",
    priority: PRIORITY_LEVELS.HIGH,
    effects: [],
    variant: "h6"
  },

  // 2. Turn announcement - dynamic player name
  turnAnnouncement: (playerName) => ({
    text: `${playerName}님의 차례입니다. 힌트를 말해주세요! 🗣️`,
    category: "info", 
    icon: "🗣️",
    priority: PRIORITY_LEVELS.NORMAL,
    effects: [],
    variant: "body1"
  }),

  // 3. Time warning - critical priority with pulse effect
  timeWarning: (seconds = 10) => ({
    text: `${seconds}초 남았습니다! ⏰`,
    category: "warning",
    icon: "⏰", 
    priority: PRIORITY_LEVELS.CRITICAL,
    effects: ["pulse"],
    variant: "h6"
  }),

  // 4. Voting start message
  votingStart: {
    text: "이제 라이어를 찾아주세요! 🕵️",
    category: "info",
    icon: "🕵️",
    priority: PRIORITY_LEVELS.HIGH,
    effects: [],
    variant: "h6"
  },

  // 5. Game end - celebration with confetti for winners
  gameEnd: (winnerTeam, isWinner = false) => ({
    text: `${winnerTeam === 'LIAR' ? '라이어팀' : '시민팀'} 승리! ${isWinner ? '축하합니다! 🎉' : '다음에는 더 잘해보세요! 💪'}`,
    category: "celebration",
    icon: winnerTeam === 'LIAR' ? "🎭" : "👥",
    priority: PRIORITY_LEVELS.HIGH,
    effects: isWinner ? ["confetti", "victory"] : ["defeat"],
    variant: "h6"
  }),

  // Additional scenario messages for enhanced gameplay
  
  // Defense phase start
  defenseStart: (accusedPlayerName) => ({
    text: `${accusedPlayerName}님의 변론 시간입니다. 자신을 변호해주세요! 🛡️`,
    category: "info",
    icon: "🛡️",
    priority: PRIORITY_LEVELS.HIGH,
    effects: [],
    variant: "body1"
  }),

  // Word guess phase
  wordGuessStart: {
    text: "라이어가 주제어를 맞힐 차례입니다! 🤔",
    category: "warning",
    icon: "🤔",
    priority: PRIORITY_LEVELS.HIGH,
    effects: ["pulse"],
    variant: "h6"
  },

  // Survival voting
  survivalVotingStart: (accusedPlayerName) => ({
    text: `${accusedPlayerName}님을 처형할지 결정해주세요! ⚖️`,
    category: "warning",
    icon: "⚖️",
    priority: PRIORITY_LEVELS.HIGH,
    effects: ["pulse"],
    variant: "body1"
  }),

  // Round progression
  newRound: (roundNumber) => ({
    text: `라운드 ${roundNumber}가 시작됩니다! 🔄`,
    category: "info",
    icon: "🔄",
    priority: PRIORITY_LEVELS.NORMAL,
    effects: [],
    variant: "body1"
  }),

  // Connection status
  playerJoined: (playerName) => ({
    text: `${playerName}님이 게임에 참여했습니다! 👋`,
    category: "info",
    icon: "👋",
    priority: PRIORITY_LEVELS.LOW,
    effects: [],
    variant: "body2"
  }),

  playerLeft: (playerName) => ({
    text: `${playerName}님이 게임을 떠났습니다. 😔`,
    category: "warning",
    icon: "👋",
    priority: PRIORITY_LEVELS.NORMAL,
    effects: [],
    variant: "body2"
  }),

  // Error messages
  connectionError: {
    text: "연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요. 🔄",
    category: "warning",
    icon: "🚨",
    priority: PRIORITY_LEVELS.CRITICAL,
    effects: ["pulse"],
    variant: "body1"
  },

  // Game flow messages
  waitingForPlayers: {
    text: "다른 플레이어들을 기다리고 있습니다... ⏳",
    category: "info",
    icon: "⏳",
    priority: PRIORITY_LEVELS.LOW,
    effects: [],
    variant: "body2"
  },

  allSubmitted: {
    text: "모든 플레이어가 제출을 완료했습니다! ✅",
    category: "info",
    icon: "✅",
    priority: PRIORITY_LEVELS.NORMAL,
    effects: [],
    variant: "body1"
  }
}

// Helper function to create message with timestamp
export const createMessage = (messageKey, ...args) => {
  const messageTemplate = scenarioMessages[messageKey]
  
  if (typeof messageTemplate === 'function') {
    return {
      ...messageTemplate(...args),
      timestamp: Date.now()
    }
  }
  
  return {
    ...messageTemplate,
    timestamp: Date.now()
  }
}

// Helper function to get all available message keys
export const getAvailableMessages = () => Object.keys(scenarioMessages)

// Priority level constants for external use
export const PRIORITIES = PRIORITY_LEVELS

export default scenarioMessages