import {create} from 'zustand';
import {normalizeRoomData} from '../utils/normalizers';

/**
 * @typedef {import('../models/Room').Room} Room
 */

/**
 * Zustand store for managing room-related state, including the list of all rooms and the current room.
 */
export const useRoomStore = create((set) => ({
  /** @type {Room[]} */
  roomList: [],
  /** @type {Room | null} */
  currentRoom: null,

  /**
   * Sets the list of all available rooms, ensuring data is normalized.
   * @param {object[]} rawRooms - The raw array of room objects from the API.
   */
  setRoomList: (rawRooms) =>
    set((state) => ({
      ...state,
      roomList: rawRooms.map(normalizeRoomData),
    })),

  /**
   * Sets the current room the user is in, ensuring data is normalized.
   * @param {object} rawRoom - The raw room object from the API.
   */
  setCurrentRoom: (rawRoom) =>
    set((state) => ({
      ...state,
      currentRoom: normalizeRoomData(rawRoom),
    })),

  /**
   * Clears the current room data, typically when a user leaves.
   */
  leaveRoom: () =>
    set((state) => ({
      ...state,
      currentRoom: null,
    })),

  /**
   * Updates a single room in the main list with new data (e.g., from a WebSocket update).
   * @param {object} rawUpdatedRoom - The raw updated room data.
   */
  updateRoomInList: (rawUpdatedRoom) => {
    const normalizedRoom = normalizeRoomData(rawUpdatedRoom);
    set((state) => ({
      ...state,
      roomList: state.roomList.map((room) =>
        room.gameNumber === normalizedRoom.gameNumber ? normalizedRoom : room
      ),
    }));
  },
}));
