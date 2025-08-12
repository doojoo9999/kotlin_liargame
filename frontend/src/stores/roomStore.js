import {create} from 'zustand';
import {useQuery} from '@tanstack/react-query';
import {getAllRooms} from '../api/queries/roomQueries';

export const useRoomStore = create((set, get) => ({
  roomList: [],
  currentRoom: null,
  isLoading: false,
  error: null,

  // Action to set the current room, typically when joining or creating one
  setCurrentRoom: (room) => set({ currentRoom: room }),

  // Action to clear the current room, typically when leaving
  leaveRoom: () => set({ currentRoom: null }),

  // Action to update a single room in the list (e.g., player count changes)
  updateRoomInList: (updatedRoom) =>
    set((state) => ({
      roomList: state.roomList.map((room) =>
        room.gameNumber === updatedRoom.gameNumber ? { ...room, ...updatedRoom } : room
      ),
    })),

  // TanStack Query is used for fetching, but we can sync its state here
  setRoomList: (rooms) => set({ roomList: rooms }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// Custom hook to fetch rooms and sync with the store
export const useFetchRooms = () => {
  const { setRoomList, setLoading, setError } = useRoomStore.getState();

  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      setLoading(true);
      try {
        const rooms = await getAllRooms();
        setRoomList(rooms);
        return rooms;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
  });
};
