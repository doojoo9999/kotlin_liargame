/**
 * Pure utility functions for ActionGuide component
 * Separates guidance data generation logic from UI rendering
 */

/**
 * Builds action guidance data based on game state
 * @param {Object} params - Game state parameters
 * @param {string} params.gameStatus - Current game status
 * @param {boolean} params.isCurrentTurn - Whether it's current user's turn
 * @param {Object} params.currentUser - Current user object
 * @param {string} params.currentTurnPlayerId - ID of player whose turn it is
 * @param {Array} params.players - Array of player objects
 * @param {string} params.playerRole - Current user's role (LIAR or CITIZEN)
 * @param {number} params.gameTimer - Remaining time in seconds
 * @param {boolean} params.hintSubmitted - Whether hint has been submitted
 * @param {boolean} params.defenseSubmitted - Whether defense has been submitted
 * @param {boolean} params.survivalVoteSubmitted - Whether survival vote has been submitted
 * @param {boolean} params.wordGuessSubmitted - Whether word guess has been submitted
 * @param {string} params.accusedPlayerId - ID of accused player
 * @returns {Object} Guidance object with title, priority, iconKey, description, actions, nextStep, urgent, shortcuts
 */
export function buildActionGuidance({
  gameStatus = 'WAITING',
  isCurrentTurn = false,
  currentUser,
  currentTurnPlayerId,
  players = [],
  playerRole,
  gameTimer = 0,
  hintSubmitted = false,
  defenseSubmitted = false,
  survivalVoteSubmitted = false,
  wordGuessSubmitted = false,
  accusedPlayerId
}) {
  const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId)
  const accusedPlayer = players.find(p => p.id === accusedPlayerId)
  const isAccused = accusedPlayerId === currentUser?.id
  const isLiar = playerRole === 'LIAR'

  switch (gameStatus) {
    case 'WAITING':
      return {
        title: '게임 시작 대기',
        priority: 'info',
        iconKey: 'play',
        description: '게임이 시작되기를 기다리고 있습니다.',
        actions: [
          {
            key: 'wait-players',
            iconKey: 'wait',
            text: '다른 플레이어들이 준비될 때까지 기다려주세요',
            completed: false
          },
          {
            key: 'chat-players',
            iconKey: 'keyboard',
            text: '채팅으로 다른 플레이어들과 대화해보세요',
            completed: false
          }
        ],
        nextStep: '모든 플레이어가 준비되면 게임이 자동으로 시작됩니다.'
      }

    case 'HINT_PHASE':
    case 'SPEAKING':
      if (isCurrentTurn) {
        return {
          title: '내 차례 - 힌트 제출',
          priority: 'warning',
          iconKey: 'hint',
          description: `${isLiar ? '라이어로서 주어진 주제에 맞는' : '주어진 단어에 대한'} 힌트를 제출하세요.`,
          actions: [
            {
              key: 'write-hint',
              iconKey: 'hint',
              text: isLiar 
                ? '주제를 참고해서 그럴듯한 힌트를 작성하세요'
                : '할당된 단어에 대한 힌트를 작성하세요',
              completed: hintSubmitted
            },
            {
              key: 'submit-hint',
              iconKey: 'hint',
              text: '중앙의 힌트 입력창에 힌트를 입력하세요',
              completed: hintSubmitted
            }
          ],
          nextStep: '힌트를 제출하면 다음 플레이어 차례로 넘어갑니다.',
          urgent: gameTimer < 15
        }
      } else {
        return {
          title: '다른 플레이어 차례',
          priority: 'info',
          iconKey: 'wait',
          description: `${currentTurnPlayer?.nickname || '플레이어'}님이 힌트를 제출 중입니다.`,
          actions: [
            {
              key: 'wait-turn',
              iconKey: 'wait',
              text: '차례를 기다려주세요',
              completed: false
            },
            {
              key: 'observe-hints',
              iconKey: 'hint',
              text: '다른 플레이어의 힌트를 주의깊게 관찰하세요',
              completed: false
            }
          ],
          nextStep: '모든 플레이어가 힌트를 제출하면 투표 단계로 넘어갑니다.'
        }
      }

    case 'VOTING':
      return {
        title: '투표 진행중',
        priority: 'warning',
        iconKey: 'vote',
        description: '라이어로 의심되는 플레이어에게 투표하세요.',
        actions: [
          {
            key: 'cast-vote',
            iconKey: 'vote',
            text: '중앙의 투표 화면에서 의심되는 플레이어를 선택하세요',
            completed: false // 투표 완료 상태는 별도 관리 필요
          },
          {
            key: 'review-hints',
            iconKey: 'hint',
            text: '다른 플레이어들의 힌트를 다시 생각해보세요',
            completed: false
          }
        ],
        nextStep: '투표가 완료되면 가장 많은 표를 받은 플레이어가 지목됩니다.',
        shortcuts: [
          { key: '1-9', description: '숫자키로 빠른 투표' }
        ]
      }

    case 'DEFENSE':
      if (isAccused) {
        return {
          title: '내가 지목됨 - 변론 기회',
          priority: 'error',
          iconKey: 'defense',
          description: '자신이 라이어가 아님을 증명할 변론을 작성하세요.',
          actions: [
            {
              key: 'write-defense',
              iconKey: 'defense',
              text: '중앙의 변론 입력창에 변론을 작성하세요',
              completed: defenseSubmitted
            },
            {
              key: 'appeal-citizen',
              iconKey: 'hint',
              text: '자신이 시민임을 어필하는 내용을 작성하세요',
              completed: defenseSubmitted
            }
          ],
          nextStep: '변론을 제출하면 최종 투표가 진행됩니다.',
          urgent: gameTimer < 20
        }
      } else {
        return {
          title: '변론 듣기',
          priority: 'info',
          iconKey: 'defense',
          description: `${accusedPlayer?.nickname || '지목된 플레이어'}님의 변론을 듣고 판단하세요.`,
          actions: [
            {
              key: 'listen-defense',
              iconKey: 'wait',
              text: '변론을 주의깊게 들어보세요',
              completed: false
            },
            {
              key: 'compare-hints',
              iconKey: 'hint',
              text: '변론 내용과 이전 힌트를 비교해보세요',
              completed: false
            }
          ],
          nextStep: '변론이 끝나면 최종 투표가 진행됩니다.'
        }
      }

    case 'SURVIVAL_VOTING':
      return {
        title: '최종 투표',
        priority: 'error',
        iconKey: 'vote',
        description: `${accusedPlayer?.nickname || '지목된 플레이어'}님을 탈락시킬지 결정하세요.`,
        actions: [
          {
            key: 'survival-vote',
            iconKey: 'vote',
            text: '생존/탈락 중 하나를 선택하세요',
            completed: survivalVoteSubmitted
          },
          {
            key: 'consider-defense',
            iconKey: 'defense',
            text: '변론 내용을 고려해서 신중히 결정하세요',
            completed: false
          }
        ],
        nextStep: '투표 결과에 따라 게임이 계속되거나 종료됩니다.'
      }

    case 'WORD_GUESS':
      if (isLiar) {
        return {
          title: '마지막 기회 - 단어 추리',
          priority: 'secondary',
          iconKey: 'quiz',
          description: '다른 플레이어들의 힌트를 바탕으로 실제 단어를 추리하세요.',
          actions: [
            {
              key: 'guess-word',
              iconKey: 'quiz',
              text: '중앙의 단어 입력창에 추리한 단어를 입력하세요',
              completed: wordGuessSubmitted
            },
            {
              key: 'analyze-hints',
              iconKey: 'hint',
              text: '모든 힌트를 종합해서 정답을 추리하세요',
              completed: false
            }
          ],
          nextStep: '정답을 맞히면 라이어 승리, 틀리면 시민 승리입니다.',
          urgent: gameTimer < 30
        }
      } else {
        return {
          title: '라이어의 단어 추리',
          priority: 'info',
          iconKey: 'quiz',
          description: '라이어가 실제 단어를 추리하고 있습니다.',
          actions: [
            {
              key: 'wait-guess',
              iconKey: 'wait',
              text: '라이어의 추리를 기다려주세요',
              completed: false
            }
          ],
          nextStep: '라이어가 정답을 맞히면 라이어 승리입니다.'
        }
      }

    case 'RESULTS':
      return {
        title: '게임 결과',
        priority: 'success',
        iconKey: 'check',
        description: '게임이 끝났습니다. 결과를 확인하세요.',
        actions: [
          {
            key: 'check-results',
            iconKey: 'check',
            text: '게임 결과를 확인하세요',
            completed: false
          }
        ],
        nextStep: '새 게임을 시작하거나 로비로 돌아갈 수 있습니다.'
      }

    case 'FINISHED':
      return {
        title: '게임 종료',
        priority: 'default',
        iconKey: 'check',
        description: '게임이 완전히 종료되었습니다.',
        actions: [],
        nextStep: '새 게임을 시작하거나 로비로 돌아가세요.'
      }

    default:
      return {
        title: '게임 진행중',
        priority: 'info',
        iconKey: 'play',
        description: '게임이 진행중입니다.',
        actions: [],
        nextStep: ''
      }
  }
}

/**
 * Maps priority levels to MUI Alert severity and theme colors
 */
export const PRIORITY_MAPPING = {
  info: { severity: 'info', color: 'info' },
  warning: { severity: 'warning', color: 'warning' },
  error: { severity: 'error', color: 'error' },
  success: { severity: 'success', color: 'success' },
  secondary: { severity: 'info', color: 'secondary' },
  default: { severity: 'info', color: 'primary' }
}