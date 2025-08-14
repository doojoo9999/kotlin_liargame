import { useCallback, useEffect, useReducer } from 'react'

const INITIAL_SUBMISSION_STATE = {
  hint: { submitted: false, error: null },
  defense: { submitted: false, error: null },
  survivalVote: { submitted: false, error: null },
  wordGuess: { submitted: false, error: null },
}

function submissionReducer(state, action) {
  switch (action.type) {
    case 'SET_SUBMITTED':
      return { ...state, [action.field]: { ...state[action.field], submitted: true, error: null } }
    case 'SET_ERROR':
      return { ...state, [action.field]: { ...state[action.field], error: action.error } }
    case 'RESET_FIELD':
      return { ...state, [action.field]: { submitted: false, error: null } }
    case 'RESET_ALL':
      return INITIAL_SUBMISSION_STATE
    default:
      return state
  }
}

export default function useSubmissionFlows({
  gameStatus,
  submitHint,
  submitDefense,
  castSurvivalVote,
  guessWord,
  startGame,
}) {
  const [submissionStates, dispatchSubmission] = useReducer(submissionReducer, INITIAL_SUBMISSION_STATE)

  const handleHintSubmit = useCallback(async (hint) => {
    try {
      dispatchSubmission({ type: 'RESET_FIELD', field: 'hint' })
      console.log('[DEBUG_LOG] Submitting hint:', hint)
      await submitHint(hint)
      dispatchSubmission({ type: 'SET_SUBMITTED', field: 'hint' })
      console.log('[DEBUG_LOG] Hint submitted successfully')
    } catch (error) {
      console.error('[ERROR] Failed to submit hint:', error)
      dispatchSubmission({ type: 'SET_ERROR', field: 'hint', error: error.message || '힌트 제출에 실패했습니다.' })
    }
  }, [submitHint])

  const handleDefenseSubmit = useCallback(async (defenseText) => {
    try {
      dispatchSubmission({ type: 'RESET_FIELD', field: 'defense' })
      console.log('[DEBUG_LOG] Submitting defense:', defenseText)
      await submitDefense(defenseText)
      dispatchSubmission({ type: 'SET_SUBMITTED', field: 'defense' })
      console.log('[DEBUG_LOG] Defense submitted successfully')
    } catch (error) {
      console.error('[ERROR] Failed to submit defense:', error)
      dispatchSubmission({ type: 'SET_ERROR', field: 'defense', error: error.message || '변론 제출에 실패했습니다.' })
    }
  }, [submitDefense])

  const handleSurvivalVoteSubmit = useCallback(async (survival) => {
    try {
      dispatchSubmission({ type: 'RESET_FIELD', field: 'survivalVote' })
      console.log('[DEBUG_LOG] Casting survival vote:', survival)
      await castSurvivalVote(survival)
      dispatchSubmission({ type: 'SET_SUBMITTED', field: 'survivalVote' })
      console.log('[DEBUG_LOG] Survival vote cast successfully')
    } catch (error) {
      console.error('[ERROR] Failed to cast survival vote:', error)
      dispatchSubmission({ type: 'SET_ERROR', field: 'survivalVote', error: error.message || '생존 투표에 실패했습니다.' })
    }
  }, [castSurvivalVote])

  const handleWordGuessSubmit = useCallback(async (guessedWord) => {
    try {
      dispatchSubmission({ type: 'RESET_FIELD', field: 'wordGuess' })
      console.log('[DEBUG_LOG] Submitting word guess:', guessedWord)
      await guessWord(guessedWord)
      dispatchSubmission({ type: 'SET_SUBMITTED', field: 'wordGuess' })
      console.log('[DEBUG_LOG] Word guess submitted successfully')
    } catch (error) {
      console.error('[ERROR] Failed to submit word guess:', error)
      dispatchSubmission({ type: 'SET_ERROR', field: 'wordGuess', error: error.message || '단어 추리에 실패했습니다.' })
    }
  }, [guessWord])

  const handleRestartGame = useCallback(() => {
    console.log('[DEBUG_LOG] Restarting game')
    dispatchSubmission({ type: 'RESET_ALL' })
    startGame()
  }, [startGame])

  useEffect(() => {
    const resetFields = []
    if (gameStatus !== 'SPEAKING' && gameStatus !== 'HINT_PHASE') resetFields.push('hint')
    if (gameStatus !== 'DEFENSE') resetFields.push('defense')
    if (gameStatus !== 'SURVIVAL_VOTING') resetFields.push('survivalVote')
    if (gameStatus !== 'WORD_GUESS') resetFields.push('wordGuess')
    resetFields.forEach(field => dispatchSubmission({ type: 'RESET_FIELD', field }))
  }, [gameStatus])

  return {
    submissionStates,
    dispatchSubmission,
    handleHintSubmit,
    handleDefenseSubmit,
    handleSurvivalVoteSubmit,
    handleWordGuessSubmit,
    handleRestartGame,
  }
}
