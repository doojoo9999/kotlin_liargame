import type {GamePhase, Player} from '@/shared/types/game.types';

// 게임 로직 유틸리티 함수들
export const GameLogic = {
  // 라이어 수가 적절한지 확인
  isValidLiarCount: (totalPlayers: number, liarCount: number): boolean => {
    if (totalPlayers < 4) return false;
    if (liarCount < 1) return false;

    // 전체 플레이어의 1/3을 초과하지 않도록
    return liarCount <= Math.floor(totalPlayers / 3);
  },

  // 게임 승리 조건 확인
  checkWinCondition: (players: Player[], currentPhase: GamePhase): 'CITIZENS' | 'LIARS' | null => {
    const alivePlayers = players.filter(p => p.isAlive);
    const aliveCitizens = alivePlayers.filter(p => p.role === 'CITIZEN');
    const aliveLiars = alivePlayers.filter(p => p.role === 'LIAR');

    // 라이어가 모두 제거된 경우 시민 승리
    if (aliveLiars.length === 0) {
      return 'CITIZENS';
    }

    // 라이어 수가 시민 수와 같거나 많은 경우 라이어 승리
    if (aliveLiars.length >= aliveCitizens.length) {
      return 'LIARS';
    }

    return null;
  },

  // 투표 결과 계산
  calculateVoteResult: (players: Player[]): Player | null => {
    const voteCount = new Map<number, number>();

    players.forEach(player => {
      voteCount.set(player.id, player.votesReceived);
    });

    // 최다 득표자 찾기
    let maxVotes = 0;
    let mostVotedPlayers: Player[] = [];

    voteCount.forEach((votes, playerId) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        mostVotedPlayers = [players.find(p => p.id === playerId)!];
      } else if (votes === maxVotes && votes > 0) {
        const player = players.find(p => p.id === playerId);
        if (player) {
          mostVotedPlayers.push(player);
        }
      }
    });

    // 동점이거나 투표가 없는 경우
    if (mostVotedPlayers.length !== 1 || maxVotes === 0) {
      return null;
    }

    return mostVotedPlayers[0];
  },

  // 다음 페이즈 결정
  getNextPhase: (currentPhase: GamePhase): GamePhase => {
    const phaseOrder: GamePhase[] = [
      'WAITING',
      'ROLE_ASSIGNMENT',
      'HINT_PROVIDING',
      'DISCUSSION',
      'VOTING',
      'DEFENSE',
      'FINAL_VOTING',
      'RESULT',
      'FINISHED',
    ];

    const currentIndex = phaseOrder.indexOf(currentPhase);
    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
      return 'FINISHED';
    }

    return phaseOrder[currentIndex + 1];
  },

  // 역할 할당
  assignRoles: (players: Player[], liarCount: number): Player[] => {
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    return shuffledPlayers.map((player, index) => ({
      ...player,
      role: index < liarCount ? 'LIAR' : 'CITIZEN',
    }));
  },
};
