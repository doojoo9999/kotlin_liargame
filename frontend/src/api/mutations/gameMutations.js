import apiClient from '../apiClient';

export const sendMessage = async (gameNumber, message) => {
  const response = await apiClient.post('/chat/send', { gameNumber, message });
  return response;
};

export const completeSpeech = async (gameNumber) => {
  const response = await apiClient.post('/chat/speech/complete', { gameNumber: parseInt(gameNumber) });
  return response;
};

export const submitHint = async (gameNumber, hint) => {
  const response = await apiClient.post('/game/hint', { gameNumber: parseInt(gameNumber), hint: hint.trim() });
  return response;
};

export const submitDefense = async (gameNumber, defenseText) => {
  const response = await apiClient.post('/game/submit-defense', { gameNumber: parseInt(gameNumber), defenseText: defenseText.trim() });
  return response;
};

export const castFinalJudgment = async (gameNumber, judgment) => {
  const response = await apiClient.post('/game/cast-final-judgment', { gameNumber: parseInt(gameNumber), judgment });
  return response;
};

export const castVote = async (gameNumber, targetPlayerId) => {
  const response = await apiClient.post('/game/vote', { gameNumber, targetPlayerId });
  return response;
};

export const castSurvivalVote = async (gameNumber, survival) => {
  const response = await apiClient.post('/game/survival-vote', { gameNumber: parseInt(gameNumber), survival });
  return response;
};

export const guessWord = async (gameNumber, guessedWord) => {
  const response = await apiClient.post('/game/guess-word', { gameNumber: parseInt(gameNumber), guessedWord: guessedWord.trim() });
  return response;
};

export const submitLiarGuess = async (gameNumber, guess) => {
  const response = await apiClient.post('/game/submit-liar-guess', { gameNumber: parseInt(gameNumber), guess: guess.trim() });
  return response;
};
