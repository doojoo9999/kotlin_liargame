import * as gameApi from '../api/gameApi'

// Loader for rooms data
export async function roomsLoader() {
  try {
    const rooms = await gameApi.getAllRooms()
    return { rooms: rooms || [] }
  } catch (error) {
    console.error('Failed to load rooms:', error)
    throw new Response('방 목록을 불러올 수 없습니다.', { 
      status: 500,
      statusText: 'Internal Server Error' 
    })
  }
}

// Loader for subjects data
export async function subjectsLoader() {
  try {
    const subjects = await gameApi.getAllSubjects()
    return { subjects: subjects || [] }
  } catch (error) {
    console.error('Failed to load subjects:', error)
    throw new Response('주제 목록을 불러올 수 없습니다.', { 
      status: 500,
      statusText: 'Internal Server Error' 
    })
  }
}

// Combined loader for lobby page
export async function lobbyLoader() {
  try {
    const [roomsResult, subjectsResult] = await Promise.allSettled([
      gameApi.getAllRooms(),
      gameApi.getAllSubjects()
    ])

    const rooms = roomsResult.status === 'fulfilled' ? roomsResult.value || [] : []
    const subjects = subjectsResult.status === 'fulfilled' ? subjectsResult.value || [] : []

    return { 
      rooms,
      subjects,
      errors: {
        rooms: roomsResult.status === 'rejected' ? roomsResult.reason?.message : null,
        subjects: subjectsResult.status === 'rejected' ? subjectsResult.reason?.message : null
      }
    }
  } catch (error) {
    console.error('Failed to load lobby data:', error)
    throw new Response('로비 데이터를 불러올 수 없습니다.', { 
      status: 500,
      statusText: 'Internal Server Error' 
    })
  }
}