import {useCallback, useEffect} from 'react';
import {useSocketStore} from '../stores/socketStore';

export const useSocket = (gameNumber) => {
  const {
    connect,
    disconnect,
    subscribe,
    publish,
    isConnected,
    stompClient,
  } = useSocketStore();

  useEffect(() => {
    if (gameNumber) {
      connect();
    }

    return () => {
      if (stompClient?.connected) {
        disconnect();
      }
    };
  }, [gameNumber, connect, disconnect, stompClient]);

  const subscribeToTopic = useCallback((topic, callback) => {
    if (isConnected) {
      return subscribe(topic, callback);
    }
  }, [isConnected, subscribe]);

  const publishMessage = useCallback((destination, body) => {
    if (isConnected) {
      publish(destination, body);
    }
  }, [isConnected, publish]);

  return {
    isConnected,
    subscribe: subscribeToTopic,
    publish: publishMessage,
  };
};
