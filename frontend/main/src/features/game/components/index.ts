import React from 'react';
import {AdvancedPlayerCard} from './AdvancedPlayerCard';
import {GameBoard} from './GameBoard';
import {VotingPanel} from './VotingPanel';
import {GamePhaseIndicator} from './GamePhaseIndicator';

// 메모이제이션된 플레이어 카드
export const MemoizedPlayerCard = React.memo(AdvancedPlayerCard, (prevProps, nextProps) => {
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.state === nextProps.player.state &&
    prevProps.player.votesReceived === nextProps.player.votesReceived &&
    prevProps.player.hasVoted === nextProps.player.hasVoted &&
    prevProps.player.isAlive === nextProps.player.isAlive &&
    prevProps.gamePhase === nextProps.gamePhase &&
    prevProps.isCurrentTurn === nextProps.isCurrentTurn &&
    prevProps.isVotingTarget === nextProps.isVotingTarget &&
    prevProps.disabled === nextProps.disabled
  );
});

// 메모이제이션된 게임 보드
export const MemoizedGameBoard = React.memo(GameBoard, (prevProps, nextProps) => {
  return (
    prevProps.players.length === nextProps.players.length &&
    prevProps.players.every((player, index) =>
      player.id === nextProps.players[index]?.id &&
      player.state === nextProps.players[index]?.state &&
      player.isAlive === nextProps.players[index]?.isAlive
    ) &&
    prevProps.gameState.gamePhase === nextProps.gameState.gamePhase &&
    prevProps.gameState.currentTurnIndex === nextProps.gameState.currentTurnIndex &&
    prevProps.layout === nextProps.layout &&
    prevProps.interactive === nextProps.interactive
  );
});

// 메모이제이션된 투표 패널
export const MemoizedVotingPanel = React.memo(VotingPanel, (prevProps, nextProps) => {
  return (
    prevProps.votingType === nextProps.votingType &&
    prevProps.timeRemaining === nextProps.timeRemaining &&
    prevProps.currentVotes.length === nextProps.currentVotes.length &&
    prevProps.userVote === nextProps.userVote &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.players.length === nextProps.players.length
  );
});

// 메모이제이션된 단계 표시기
export const MemoizedGamePhaseIndicator = React.memo(GamePhaseIndicator, (prevProps, nextProps) => {
  return (
    prevProps.currentPhase === nextProps.currentPhase &&
    prevProps.timeRemaining === nextProps.timeRemaining &&
    prevProps.totalTime === nextProps.totalTime &&
    prevProps.nextPhase === nextProps.nextPhase
  );
});

export {
  MemoizedPlayerCard as PlayerCard,
  MemoizedGameBoard as GameBoard,
  MemoizedVotingPanel as VotingPanel,
  MemoizedGamePhaseIndicator as GamePhaseIndicator
};
