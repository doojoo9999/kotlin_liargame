/**
 * Game logic-related WebSocket event handlers
 * Handles game state changes, voting, turns, timers, and game results
 */

import {normalizeGameResults, normalizeVotingData} from '../dataTransformers.js';

/**
 * Creates game event handlers with access to dispatch function
 * @param {Function} dispatch - Redux-style dispatch function for state updates
 * @returns {Object} Object containing game event handlers
 */
export const createGameEventHandlers = (dispatch) => {
  if (typeof dispatch !== 'function') {
    throw new Error('[gameEventHandlers] dispatch must be a function');
  }

  /**
   * Handles game state changes
   * @param {Object} stateUpdate - Game state update from WebSocket
   */
  const handleGameStatusUpdate = (stateUpdate) => {
    try {
      console.log('[DEBUG_LOG] Received game status update:', stateUpdate);
      
      if (stateUpdate.gameStatus) {
        dispatch({
          type: 'SET_GAME_STATUS',
          payload: stateUpdate.gameStatus
        });
      }

      if (stateUpdate.currentRound !== undefined) {
        dispatch({
          type: 'SET_CURRENT_ROUND',
          payload: stateUpdate.currentRound
        });
      }

      if (stateUpdate.gameTimer !== undefined) {
        dispatch({
          type: 'SET_GAME_TIMER',
          payload: stateUpdate.gameTimer
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling game status update:', error, stateUpdate);
    }
  };

  /**
   * Handles game start event
   * @param {Object} gameStartData - Game initialization data
   */
  const handleGameStart = (gameStartData) => {
    try {
      console.log('[DEBUG_LOG] Game starting:', gameStartData);
      
      // Set game status to speaking/first phase
      dispatch({
        type: 'SET_GAME_STATUS',
        payload: 'SPEAKING'
      });

      // Set player role if provided
      if (gameStartData.playerRole) {
        dispatch({
          type: 'SET_PLAYER_ROLE',
          payload: gameStartData.playerRole
        });
      }

      // Set assigned word if provided
      if (gameStartData.assignedWord) {
        dispatch({
          type: 'SET_ASSIGNED_WORD',
          payload: gameStartData.assignedWord
        });
      }

      // Set initial round
      dispatch({
        type: 'SET_CURRENT_ROUND',
        payload: gameStartData.currentRound || 1
      });

      // Set initial timer
      if (gameStartData.gameTimer !== undefined) {
        dispatch({
          type: 'SET_GAME_TIMER',
          payload: gameStartData.gameTimer
        });
      }

      // Clear any previous game data
      dispatch({
        type: 'SET_VOTING_RESULTS',
        payload: null
      });

      dispatch({
        type: 'SET_GAME_RESULTS',
        payload: null
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling game start:', error, gameStartData);
    }
  };

  /**
   * Handles turn changes
   * @param {Object} turnData - Turn change information
   */
  const handleTurnChange = (turnData) => {
    try {
      console.log('[DEBUG_LOG] Turn changed:', turnData);
      
      if (turnData.currentTurnPlayerId) {
        dispatch({
          type: 'SET_CURRENT_TURN_PLAYER',
          payload: turnData.currentTurnPlayerId
        });
      }

      if (turnData.gameTimer !== undefined) {
        dispatch({
          type: 'SET_GAME_TIMER',
          payload: turnData.gameTimer
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling turn change:', error, turnData);
    }
  };

  /**
   * Handles voting phase start
   * @param {Object} votingData - Voting initialization data
   */
  const handleVotingStart = (votingData) => {
    try {
      console.log('[DEBUG_LOG] Voting started:', votingData);
      
      dispatch({
        type: 'SET_GAME_STATUS',
        payload: 'VOTING'
      });

      const normalizedVotingData = normalizeVotingData(votingData);
      if (normalizedVotingData) {
        dispatch({
          type: 'SET_VOTING_DATA',
          payload: normalizedVotingData
        });
      }

      // Reset voting progress
      dispatch({
        type: 'SET_VOTING_PROGRESS',
        payload: { voted: 0, total: votingData.totalPlayers || 0 }
      });

      // Clear previous vote
      dispatch({
        type: 'SET_MY_VOTE',
        payload: null
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling voting start:', error, votingData);
    }
  };

  /**
   * Handles voting progress updates
   * @param {Object} progressData - Voting progress information
   */
  const handleVotingProgress = (progressData) => {
    try {
      console.log('[DEBUG_LOG] Voting progress update:', progressData);
      
      dispatch({
        type: 'SET_VOTING_PROGRESS',
        payload: {
          voted: progressData.voted || progressData.votedCount || 0,
          total: progressData.total || progressData.totalCount || 0
        }
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling voting progress:', error, progressData);
    }
  };

  /**
   * Handles voting results
   * @param {Object} resultsData - Voting results data
   */
  const handleVotingResults = (resultsData) => {
    try {
      console.log('[DEBUG_LOG] Voting results received:', resultsData);
      
      dispatch({
        type: 'SET_VOTING_RESULTS',
        payload: resultsData
      });

      // Update game status if provided
      if (resultsData.nextPhase) {
        dispatch({
          type: 'SET_GAME_STATUS',
          payload: resultsData.nextPhase
        });
      }

      // Set accused player if voting was for liar detection
      if (resultsData.accusedPlayerId) {
        dispatch({
          type: 'SET_ACCUSED_PLAYER',
          payload: resultsData.accusedPlayerId
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling voting results:', error, resultsData);
    }
  };

  /**
   * Handles survival voting (spare/eliminate) events
   * @param {Object} survivalData - Survival voting data
   */
  const handleSurvivalVoting = (survivalData) => {
    try {
      console.log('[DEBUG_LOG] Survival voting update:', survivalData);
      
      if (survivalData.defendingPlayerId) {
        dispatch({
          type: 'SET_DEFENDING_PLAYER',
          payload: survivalData.defendingPlayerId
        });
      }

      if (survivalData.defenseText) {
        dispatch({
          type: 'SET_DEFENSE_TEXT',
          payload: survivalData.defenseText
        });
      }

      if (survivalData.votingProgress) {
        dispatch({
          type: 'SET_SURVIVAL_VOTING_PROGRESS',
          payload: survivalData.votingProgress
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling survival voting:', error, survivalData);
    }
  };

  /**
   * Handles word guess events
   * @param {Object} wordGuessData - Word guess result data
   */
  const handleWordGuess = (wordGuessData) => {
    try {
      console.log('[DEBUG_LOG] Word guess result:', wordGuessData);
      
      dispatch({
        type: 'SET_WORD_GUESS_RESULT',
        payload: {
          correct: wordGuessData.correct || false,
          guessedWord: wordGuessData.guessedWord || null,
          actualWord: wordGuessData.actualWord || null
        }
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling word guess:', error, wordGuessData);
    }
  };

  /**
   * Handles game results/end
   * @param {Object} gameResults - Final game results
   */
  const handleGameResults = (gameResults) => {
    try {
      console.log('[DEBUG_LOG] Game results received:', gameResults);
      
      const normalizedResults = normalizeGameResults(gameResults);
      if (normalizedResults) {
        dispatch({
          type: 'SET_FINAL_GAME_RESULT',
          payload: normalizedResults
        });
      }

      dispatch({
        type: 'SET_GAME_STATUS',
        payload: 'FINISHED'
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling game results:', error, gameResults);
    }
  };

  /**
   * Handles game timer updates
   * @param {Object} timerData - Timer update data
   */
  const handleTimerUpdate = (timerData) => {
    try {
      if (timerData.gameTimer !== undefined) {
        dispatch({
          type: 'SET_GAME_TIMER',
          payload: timerData.gameTimer
        });
      }

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling timer update:', error, timerData);
    }
  };

  /**
   * Handles moderator messages
   * @param {Object} moderatorData - Moderator message data
   */
  const handleModeratorMessage = (moderatorData) => {
    try {
      console.log('[DEBUG_LOG] Moderator message received:', moderatorData);
      
      dispatch({
        type: 'SET_MODERATOR_MESSAGE',
        payload: moderatorData.message || moderatorData.content
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling moderator message:', error, moderatorData);
    }
  };

  /**
   * Handles game reset/restart
   */
  const handleGameReset = () => {
    try {
      console.log('[DEBUG_LOG] Game reset requested');
      
      dispatch({
        type: 'RESET_GAME_STATE',
        payload: null
      });

    } catch (error) {
      console.error('[DEBUG_LOG] Error handling game reset:', error);
    }
  };

  /**
   * Handles game error events
   * @param {Object} error - Game error information
   */
  const handleGameError = (error) => {
    try {
      console.error('[DEBUG_LOG] Game error received:', error);
      
      // Set error state if needed
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: 'game',
          value: error.message || '게임 오류가 발생했습니다'
        }
      });

    } catch (err) {
      console.error('[DEBUG_LOG] Error handling game error:', err, error);
    }
  };

  // Return all game event handlers
  return {
    handleGameStatusUpdate,
    handleGameStart,
    handleTurnChange,
    handleVotingStart,
    handleVotingProgress,
    handleVotingResults,
    handleSurvivalVoting,
    handleWordGuess,
    handleGameResults,
    handleTimerUpdate,
    handleModeratorMessage,
    handleGameReset,
    handleGameError
  };
};

/**
 * Validates game state transition
 * @param {string} currentState - Current game state
 * @param {string} newState - New game state
 * @returns {boolean} True if transition is valid
 */
export const validateGameStateTransition = (currentState, newState) => {
  const validTransitions = {
    'WAITING': ['SPEAKING'],
    'SPEAKING': ['VOTING', 'FINISHED'],
    'VOTING': ['RESULTS', 'SPEAKING', 'FINISHED'],
    'RESULTS': ['SPEAKING', 'VOTING', 'FINISHED'],
    'FINISHED': ['WAITING']
  };

  return validTransitions[currentState]?.includes(newState) || false;
};

/**
 * Calculates remaining time for display
 * @param {number} timer - Timer in seconds
 * @returns {string} Formatted time string
 */
export const formatGameTimer = (timer) => {
  if (typeof timer !== 'number' || timer < 0) {
    return '0:00';
  }

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default createGameEventHandlers;