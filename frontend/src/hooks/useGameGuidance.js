import {useCallback, useMemo} from 'react'


const useGameGuidance = ({
  gameStatus = 'WAITING',
  currentUser,
  currentTurnPlayerId,
  players = [],
  playerRole,
  gameTimer = 0,
  accusedPlayerId,
  hintSubmitted = false,
  defenseSubmitted = false,
  survivalVoteSubmitted = false,
  wordGuessSubmitted = false,
  votingResults = null,
  gamePhase = null
}) => {

  const userContext = useMemo(() => {
    const isCurrentTurn = currentTurnPlayerId === currentUser?.id
    const isAccused = accusedPlayerId === currentUser?.id
    const isLiar = playerRole === 'LIAR'
    const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId)
    const accusedPlayer = players.find(p => p.id === accusedPlayerId)

    return {
      isCurrentTurn,
      isAccused,
      isLiar,
      currentTurnPlayer,
      accusedPlayer,
      isSpectator: !currentUser || !players.find(p => p.id === currentUser.id)
    }
  }, [currentTurnPlayerId, currentUser, accusedPlayerId, playerRole, players])

  const getUrgencyLevel = useCallback((timer, status) => {
    if (timer <= 0) return 'none'
    
    const urgencyThresholds = {
      'HINT_PHASE': { critical: 10, warning: 20, normal: 30 },
      'SPEAKING': { critical: 10, warning: 20, normal: 30 },
      'VOTING': { critical: 15, warning: 30, normal: 45 },
      'DEFENSE': { critical: 15, warning: 30, normal: 45 },
      'SURVIVAL_VOTING': { critical: 10, warning: 20, normal: 30 },
      'WORD_GUESS': { critical: 20, warning: 40, normal: 60 }
    }

    const thresholds = urgencyThresholds[status] || { critical: 10, warning: 20, normal: 30 }

    if (timer <= thresholds.critical) return 'critical'
    if (timer <= thresholds.warning) return 'warning'
    if (timer <= thresholds.normal) return 'normal'
    return 'low'
  }, [])

  const getPrimaryGuidance = useCallback(() => {
    const urgency = getUrgencyLevel(gameTimer, gameStatus)
    const { isCurrentTurn, isAccused, isLiar, currentTurnPlayer, accusedPlayer, isSpectator } = userContext

    if (isSpectator) {
      return {
        type: 'info',
        title: '관전 모드',
        description: '게임을 관전하고 있습니다.',
        actions: [],
        urgency: 'none'
      }
    }

    switch (gameStatus) {
      case 'WAITING':
        return {
          type: 'info',
          title: '게임 시작 대기',
          description: '모든 플레이어가 준비되면 게임이 시작됩니다.',
          actions: [
            { type: 'wait', text: '다른 플레이어들을 기다려주세요' },
            { type: 'chat', text: '채팅으로 다른 플레이어들과 소통해보세요' }
          ],
          urgency: 'none',
          nextStep: '게임이 시작되면 역할이 배정되고 힌트 단계가 시작됩니다.'
        }

      case 'HINT_PHASE':
      case 'SPEAKING':
        if (isCurrentTurn) {
          return {
            type: isLiar ? 'warning' : 'primary',
            title: '내 차례 - 힌트 제출',
            description: isLiar 
              ? '라이어로서 들키지 않게 그럴듯한 힌트를 제출하세요!'
              : '할당받은 단어에 대한 힌트를 제출하세요.',
            actions: [
              { 
                type: 'submit', 
                text: '중앙 입력창에 힌트를 작성하고 제출하세요',
                completed: hintSubmitted,
                critical: urgency === 'critical'
              },
              { 
                type: 'think', 
                text: isLiar ? '주제를 참고해서 자연스러운 힌트를 생각해보세요' : '단어의 특징을 잘 나타내는 힌트를 생각해보세요',
                completed: false
              }
            ],
            urgency,
            nextStep: '힌트를 제출하면 다음 플레이어 차례로 넘어갑니다.',
            tips: isLiar ? [
              '너무 구체적이지 않게 주의하세요',
              '다른 플레이어들의 반응을 관찰하세요'
            ] : [
              '라이어가 추측하기 어렵도록 적절한 수준의 힌트를 주세요',
              '너무 쉽거나 어렵지 않게 균형을 맞추세요'
            ]
          }
        } else {
          return {
            type: 'info',
            title: '다른 플레이어 차례',
            description: `${currentTurnPlayer?.nickname || '플레이어'}님이 힌트를 제출하고 있습니다.`,
            actions: [
              { type: 'wait', text: '차례를 기다려주세요', completed: false },
              { type: 'observe', text: '다른 플레이어의 힌트를 주의깊게 관찰하세요', completed: false },
              { type: 'analyze', text: '누가 라이어일지 생각해보세요', completed: false }
            ],
            urgency: urgency === 'critical' ? 'warning' : 'low',
            nextStep: '모든 플레이어가 힌트를 제출하면 투표 단계로 넘어갑니다.'
          }
        }

      case 'VOTING':
        return {
          type: 'warning',
          title: '투표 진행중',
          description: '라이어로 의심되는 플레이어에게 투표하세요.',
          actions: [
            { 
              type: 'vote', 
              text: '중앙의 투표 화면에서 의심스러운 플레이어를 선택하세요',
              completed: false, // Would need to track voting status
              critical: urgency === 'critical'
            },
            { type: 'analyze', text: '지금까지의 힌트들을 다시 검토해보세요', completed: false }
          ],
          urgency,
          nextStep: '투표 결과에 따라 가장 많은 표를 받은 플레이어가 지목됩니다.',
          tips: [
            '이상했던 힌트를 기억해보세요',
            '다른 플레이어들의 반응도 고려하세요'
          ]
        }

      case 'DEFENSE':
        if (isAccused) {
          return {
            type: 'error',
            title: '변론 기회',
            description: '자신이 라이어가 아님을 증명하세요!',
            actions: [
              { 
                type: 'defend', 
                text: '중앙의 변론 입력창에 변론을 작성하세요',
                completed: defenseSubmitted,
                critical: urgency === 'critical'
              },
              { type: 'explain', text: '자신의 힌트가 왜 적절했는지 설명하세요', completed: defenseSubmitted }
            ],
            urgency,
            nextStep: '변론을 제출하면 최종 투표가 진행됩니다.',
            tips: [
              '구체적이고 설득력 있는 근거를 제시하세요',
              '감정에 호소하기보다는 논리적으로 설명하세요'
            ]
          }
        } else {
          return {
            type: 'info',
            title: '변론 듣기',
            description: `${accusedPlayer?.nickname || '지목된 플레이어'}님의 변론을 들어보세요.`,
            actions: [
              { type: 'listen', text: '변론을 주의깊게 들어보세요', completed: false },
              { type: 'evaluate', text: '변론의 설득력을 판단해보세요', completed: false }
            ],
            urgency: 'low',
            nextStep: '변론이 끝나면 최종 투표가 진행됩니다.'
          }
        }

      case 'SURVIVAL_VOTING':
        return {
          type: 'error',
          title: '최종 투표',
          description: `${accusedPlayer?.nickname || '지목된 플레이어'}님을 탈락시킬지 결정하세요.`,
          actions: [
            { 
              type: 'vote', 
              text: '생존 또는 탈락 중 하나를 선택하세요',
              completed: survivalVoteSubmitted,
              critical: urgency === 'critical'
            },
            { type: 'consider', text: '변론 내용을 신중히 고려하세요', completed: false }
          ],
          urgency,
          nextStep: '투표 결과에 따라 게임이 계속되거나 종료됩니다.',
          tips: [
            '변론의 내용과 이전 힌트를 종합적으로 판단하세요'
          ]
        }

      case 'WORD_GUESS':
        if (isLiar) {
          return {
            type: 'secondary',
            title: '마지막 기회 - 단어 맞히기',
            description: '다른 플레이어들의 힌트를 바탕으로 실제 단어를 추리하세요!',
            actions: [
              { 
                type: 'guess', 
                text: '중앙의 입력창에 추리한 단어를 입력하세요',
                completed: wordGuessSubmitted,
                critical: urgency === 'critical'
              },
              { type: 'analyze', text: '모든 힌트를 종합해서 정답을 추리하세요', completed: false }
            ],
            urgency,
            nextStep: '정답을 맞히면 라이어 승리, 틀리면 시민 승리입니다.',
            tips: [
              '힌트들의 공통점을 찾아보세요',
              '주제와 관련된 단어를 생각해보세요'
            ]
          }
        } else {
          return {
            type: 'info',
            title: '라이어의 추리',
            description: '라이어가 실제 단어를 추리하고 있습니다.',
            actions: [
              { type: 'wait', text: '결과를 기다려주세요', completed: false }
            ],
            urgency: 'low',
            nextStep: '라이어가 정답을 맞히면 라이어 승리입니다.'
          }
        }

      case 'RESULTS':
        return {
          type: 'success',
          title: '게임 결과',
          description: '게임이 끝났습니다! 결과를 확인하세요.',
          actions: [
            { type: 'review', text: '게임 결과를 확인하세요', completed: false }
          ],
          urgency: 'none',
          nextStep: '새 게임을 시작하거나 로비로 돌아갈 수 있습니다.'
        }

      case 'FINISHED':
        return {
          type: 'info',
          title: '게임 종료',
          description: '게임이 완전히 종료되었습니다.',
          actions: [
            { type: 'navigate', text: '새 게임을 시작하거나 로비로 돌아가세요', completed: false }
          ],
          urgency: 'none',
          nextStep: ''
        }

      default:
        return {
          type: 'info',
          title: '게임 진행중',
          description: '게임이 진행중입니다.',
          actions: [],
          urgency: 'none',
          nextStep: ''
        }
    }
  }, [gameStatus, gameTimer, userContext, hintSubmitted, defenseSubmitted, survivalVoteSubmitted, wordGuessSubmitted, getUrgencyLevel])

  const getSecondaryGuidance = useCallback(() => {
    const { isLiar, isCurrentTurn, isAccused } = userContext
    const urgency = getUrgencyLevel(gameTimer, gameStatus)
    const secondaryGuidance = []

    if (urgency === 'critical' && (isCurrentTurn || isAccused)) {
      secondaryGuidance.push({
        type: 'warning',
        title: '시간 부족!',
        description: '시간이 얼마 남지 않았습니다. 빨리 결정하세요!',
        priority: 'high'
      })
    }

    if (isLiar && gameStatus === 'HINT_PHASE') {
      secondaryGuidance.push({
        type: 'tip',
        title: '라이어 팁',
        description: '다른 플레이어의 힌트를 참고해서 자연스럽게 섞여보세요.',
        priority: 'medium'
      })
    }

    if (gameStatus === 'VOTING' && players.length > 6) {
      secondaryGuidance.push({
        type: 'info',
        title: '투표 전략',
        description: '플레이어가 많으니 신중하게 선택하세요.',
        priority: 'low'
      })
    }

    return secondaryGuidance
  }, [gameStatus, gameTimer, userContext, players.length, getUrgencyLevel])

  const getKeyboardShortcuts = useCallback(() => {
    const shortcuts = []

    switch (gameStatus) {
      case 'VOTING':
        for (let i = 0; i < Math.min(players.length, 9); i++) {
          shortcuts.push({
            key: (i + 1).toString(),
            description: `${players[i]?.nickname || '플레이어'}에게 투표`,
            action: `vote-${players[i]?.id}`
          })
        }
        break
      
      case 'SURVIVAL_VOTING':
        shortcuts.push(
          { key: 'Y', description: '생존 투표', action: 'vote-survive' },
          { key: 'N', description: '탈락 투표', action: 'vote-eliminate' }
        )
        break

      case 'HINT_PHASE':
      case 'SPEAKING':
        if (userContext.isCurrentTurn) {
          shortcuts.push(
            { key: 'Enter', description: '힌트 제출', action: 'submit-hint' },
            { key: 'Esc', description: '취소', action: 'cancel' }
          )
        }
        break
    }

    return shortcuts
  }, [gameStatus, players, userContext.isCurrentTurn])

  return {
    primaryGuidance: getPrimaryGuidance(),
    
    secondaryGuidance: getSecondaryGuidance(),
    
    userContext,
    
    urgencyLevel: getUrgencyLevel(gameTimer, gameStatus),
    isUrgent: getUrgencyLevel(gameTimer, gameStatus) === 'critical',
    timeRemaining: gameTimer,
    
    keyboardShortcuts: getKeyboardShortcuts(),
    
    canAct: userContext.isCurrentTurn || gameStatus === 'VOTING' || gameStatus === 'SURVIVAL_VOTING',
    shouldWait: !userContext.isCurrentTurn && gameStatus !== 'VOTING' && gameStatus !== 'SURVIVAL_VOTING',
    needsAttention: userContext.isAccused || userContext.isCurrentTurn || getUrgencyLevel(gameTimer, gameStatus) === 'critical'
  }
}

export default useGameGuidance