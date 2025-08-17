import {useEffect, useRef} from 'react';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {debugLog} from '../utils/logger';
import config from '../config/environment';

/**
 * A hook to manage WebSocket side effects for the game.
 * This hook encapsulates all StompJS logic, including connection, subscription, and disconnection.
 * It interacts directly with the Zustand store to update the application state.
 *
 * @param {object} currentRoom - The current room object from the Zustand store.
 * @param {boolean} socketConnected - The current socket connection status from the Zustand store.
 * @param {function} dispatch - The dispatch function from GameContext for compatibility.
 * @param {function} setLoading - The setLoading action from the Zustand store.
 * @param {function} setError - The setError action from the Zustand store.
 * @param {object} actions - An object containing all necessary actions from the Zustand store.
 */
export const useSocketEffects = (
    currentRoom,
    socketConnected,
    dispatch,
    setLoading,
    setError,
    actions
) => {
    const clientRef = useRef(null);

    const {
        loadChatHistory,
        setGameState,
        setPlayers,
        addChatMessage,
        setVoteState,
        setLiar,
        clearChatMessages
    } = actions;

    useEffect(() => {
        const connect = () => {
            debugLog('Attempting to connect WebSocket...');
            setLoading('socket', true);

            const socket = new SockJS(`${config.websocketUrl}`);
            const stompClient = new Client({
                webSocketFactory: () => socket,
                reconnectDelay: 5000,
                debug: (str) => {
                    if (import.meta.env.DEV) {
                        // console.log(new Date(), str);
                    }
                },
                onConnect: () => {
                    debugLog(`WebSocket connected. Subscribing to topics for room: ${currentRoom.id}`);
                    dispatch({ type: 'SET_SOCKET_CONNECTION', payload: true });
                    setLoading('socket', false);

                    // --- Centralized Public Subscriptions ---
                    stompClient.subscribe(`/topic/game/${currentRoom.id}`, (message) => {
                        const gameState = JSON.parse(message.body);
                        debugLog('Received game state update:', gameState);
                        setGameState(gameState);
                    });

                    stompClient.subscribe(`/topic/game/${currentRoom.id}/players`, (message) => {
                        const players = JSON.parse(message.body);
                        debugLog('Received players update:', players);
                        setPlayers(players);
                    });

                    stompClient.subscribe(`/topic/chat/${currentRoom.id}`, (message) => {
                        const chatMessage = JSON.parse(message.body);
                        debugLog('Received chat message:', chatMessage);
                        addChatMessage(chatMessage);
                    });

                    // [SECURITY CRITICAL] Subscribe to a private, user-specific queue.
                    // The '/user' prefix is handled by the STOMP broker to route messages to this specific session.
                    stompClient.subscribe('/user/queue/private', (message) => {
                        const privateData = JSON.parse(message.body);
                        debugLog('Received private message:', privateData);

                        // Handle different types of private messages
                        switch (privateData.type) {
                            case 'LIAR_REVEAL':
                                setLiar(privateData.payload);
                                break;
                            case 'VOTE_STATE_UPDATE':
                                setVoteState(privateData.payload);
                                break;
                            // Add other private message types here in the future (e.g., SECRET_WORD)
                            default:
                                debugLog(`Unknown private message type: ${privateData.type}`);
                        }
                    });

                    // Send a message to notify the backend that this client has joined.
                    const token = localStorage.getItem('accessToken');
                    stompClient.publish({
                        destination: `/app/game/${currentRoom.id}/join`,
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    // Load initial data
                    loadChatHistory(currentRoom.id);
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                    setError('socket', '웹소켓 연결에 실패했습니다. 페이지를 새로고침 해주세요.');
                    setLoading('socket', false);
                    dispatch({ type: 'SET_SOCKET_CONNECTION', payload: false });
                },
            });

            stompClient.activate();
            clientRef.current = stompClient;
        };

        const disconnect = () => {
            if (clientRef.current && clientRef.current.active) {
                debugLog('Deactivating WebSocket client.');
                clientRef.current.deactivate();
                clientRef.current = null;
                dispatch({ type: 'SET_SOCKET_CONNECTION', payload: false });
                clearChatMessages();
            }
        };

        if (currentRoom && currentRoom.id && !socketConnected) {
            connect();
        }

        return () => {
            debugLog('Running cleanup for useSocketEffects.');
            disconnect();
        };
    }, [
        currentRoom,
        socketConnected,
        dispatch,
        setLoading,
        setError,
        loadChatHistory, // Kept for dependency tracking if needed, though actions object is now used
        actions
    ]);
};