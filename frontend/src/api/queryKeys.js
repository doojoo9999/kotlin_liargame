export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  rooms: {
    all: ['rooms'],
    list: (filters = {}) => ['rooms', 'list', filters],
    detail: (gameNumber) => ['rooms', 'detail', gameNumber],
  },
  subjects: {
    all: ['subjects'],
    list: (category) => ['subjects', 'list', category],
    detail: (id) => ['subjects', 'detail', id],
  },
  game: {
    state: (gameNumber) => ['game', 'state', gameNumber],
  },
}

export default queryKeys
