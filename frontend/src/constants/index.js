export const GAME_STATUS = {
  WAITING: 'WAITING',
  SPEAKING: 'SPEAKING',
  VOTING: 'VOTING',
  DEFENSE: 'DEFENSE',
  SURVIVAL_VOTING: 'SURVIVAL_VOTING',
  WORD_GUESS: 'WORD_GUESS',
  RESULTS: 'RESULTS',
  FINISHED: 'FINISHED',
};

export const PLAYER_ROLES = {
  LIAR: 'LIAR',
  CITIZEN: 'CITIZEN',
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  GET_ALL_ROOMS: '/game/rooms',
  CREATE_ROOM: '/game/create',
  JOIN_ROOM: '/game/join',
  LEAVE_ROOM: '/game/leave',
  GET_ROOM_DETAILS: (gameNumber) => `/game/${gameNumber}`,
  START_GAME: '/game/start',
  RECOVER_GAME_STATE: (gameNumber) => `/game/recover-state/${gameNumber}`,
  SUBMIT_HINT: '/game/hint',
  CAST_VOTE: '/game/vote',
  SUBMIT_DEFENSE: '/game/submit-defense',
  CAST_FINAL_JUDGMENT: '/game/cast-final-judgment',
  CAST_SURVIVAL_VOTE: '/game/survival-vote',
  GUESS_WORD: '/game/guess-word',
  SUBMIT_LIAR_GUESS: '/game/submit-liar-guess',
  GET_ALL_SUBJECTS: '/subjects/listsubj',
  ADD_SUBJECT: '/subjects/applysubj',
  ADD_WORD: '/words/applyw',
  SEND_CHAT_MESSAGE: '/chat/send',
  GET_CHAT_HISTORY: '/chat/history',
  COMPLETE_SPEECH: '/chat/speech/complete',
};

export const WEBSOCKET_TOPICS = {
  ROOM_UPDATE: (gameNumber) => `/topic/room.${gameNumber}`,
  CHAT_MESSAGE: (gameNumber) => `/topic/chat.${gameNumber}`,
  PLAYER_UPDATES: (gameNumber) => `/topic/players.${gameNumber}`,
  MODERATOR_MESSAGE: (gameNumber) => `/topic/game/${gameNumber}/moderator`,
  TURN_UPDATE: (gameNumber) => `/topic/game/${gameNumber}/turn`,
  APP_CHAT_SEND: '/app/chat.send',
  APP_GAME_ACTION: (gameNumber, action) => `/app/game/${gameNumber}/${action}`,
};
