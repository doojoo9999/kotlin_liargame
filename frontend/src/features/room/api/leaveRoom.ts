import axios from 'axios';

export async function leaveRoom(roomId: string) {
  return axios.post(`/api/rooms/${roomId}/leave`);
}

