import * as gameApi from './gameApi'

// Game Play API functions
// This module handles only game play related API calls

export const startGameSession = async (gameNumber) => {
  console.log('[DEBUG_LOG] Starting game for room:', gameNumber)
  const result = await gameApi.startGame(gameNumber)
  console.log('[DEBUG_LOG] Game started successfully:', result)
  return result
}

export const castPlayerVote = async (gameNumber, targetPlayerId) => {
  if (!targetPlayerId) {
    throw new Error('Target player ID is required')
  }

  console.log('[DEBUG_LOG] Casting vote for player:', targetPlayerId, 'in game:', gameNumber)
  const result = await gameApi.castVote(gameNumber, targetPlayerId)
  console.log('[DEBUG_LOG] Vote cast successfully:', result)
  return result
}

export const submitPlayerHint = async (gameNumber, hint) => {
  if (!hint || !hint.trim()) {
    throw new Error('Hint cannot be empty')
  }

  console.log('[DEBUG_LOG] Submitting hint:', hint, 'for game:', gameNumber)
  const result = await gameApi.submitHint(gameNumber, hint.trim())
  console.log('[DEBUG_LOG] Hint submitted successfully:', result)
  return result
}

export const submitPlayerDefense = async (gameNumber, defenseText) => {
  if (!defenseText || !defenseText.trim()) {
    throw new Error('Defense text cannot be empty')
  }

  console.log('[DEBUG_LOG] Submitting defense:', defenseText, 'for game:', gameNumber)
  const result = await gameApi.submitDefense(gameNumber, defenseText.trim())
  console.log('[DEBUG_LOG] Defense submitted successfully:', result)
  return result
}

export const castPlayerSurvivalVote = async (gameNumber, survival) => {
  if (typeof survival !== 'boolean') {
    throw new Error('Survival vote must be boolean')
  }

  console.log('[DEBUG_LOG] Casting survival vote:', survival, 'for game:', gameNumber)
  const result = await gameApi.castSurvivalVote(gameNumber, survival)
  console.log('[DEBUG_LOG] Survival vote cast successfully:', result)
  return result
}

export const guessGameWord = async (gameNumber, guessedWord) => {
  if (!guessedWord || !guessedWord.trim()) {
    throw new Error('Guessed word cannot be empty')
  }

  console.log('[DEBUG_LOG] Submitting word guess:', guessedWord, 'for game:', gameNumber)
  const result = await gameApi.guessWord(gameNumber, guessedWord.trim())
  console.log('[DEBUG_LOG] Word guess submitted successfully:', result)
  return result
}

export const completeSpeechTurn = async (gameNumber) => {
  console.log('[DEBUG_LOG] Completing speech turn for game:', gameNumber)
  const result = await gameApi.completeSpeech(gameNumber)
  console.log('[DEBUG_LOG] Speech completed successfully:', result)
  return result
}