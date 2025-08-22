import {useEffect} from 'react';
import {useRoomStore} from '../stores/roomStore';

/**
 * A hook that ensures the client is subscribed to lobby updates.
 * It should be used in components that display lobby information.
 */
export const useLobbySocket = () => {
    const { subscribeToLobby, unsubscribeFromLobby } = useRoomStore();

    useEffect(() => {
        subscribeToLobby();

        // Cleanup on component unmount
        return () => {
            unsubscribeFromLobby();
        };
    }, [subscribeToLobby, unsubscribeFromLobby]);
};