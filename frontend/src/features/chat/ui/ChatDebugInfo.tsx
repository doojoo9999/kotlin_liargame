import {useEffect, useState} from 'react';
import {Badge, Button, Card, Group, Stack, Text} from '@mantine/core';
import {socketManager} from '../../../shared/socket/SocketManager';
import {useSocketStore} from '../../../shared/stores/socketStore';

interface ChatDebugInfoProps {
  gameNumber: number;
}

export function ChatDebugInfo({ gameNumber }: ChatDebugInfoProps) {
  const connectionState = useSocketStore((state) => state.connectionState);
  const [debugInfo, setDebugInfo] = useState({
    url: '',
    lastError: '',
    testMessageSent: false,
    testResult: ''
  });

  useEffect(() => {
    // WebSocket URL 확인 (WEBSOCKET > API > window.origin 순)
    const baseUrl = (import.meta.env.VITE_WEBSOCKET_URL as string) || (import.meta.env.VITE_API_BASE_URL as string) || window.location.origin;
    const wsUrl = baseUrl.endsWith('/ws') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/ws`;
    setDebugInfo(prev => ({
      ...prev,
      url: wsUrl
    }));
  }, []);

  const testWebSocketConnection = async () => {
    try {
      console.log('[ChatDebug] Testing WebSocket connection...');
      setDebugInfo(prev => ({ ...prev, testResult: 'Testing...' }));
      
      // 강제로 연결 시도
      await socketManager.subscribe('/topic/test', (message) => {
        console.log('[ChatDebug] Test message received:', message);
      });
      
      setDebugInfo(prev => ({ ...prev, testResult: 'Connection successful!' }));
    } catch (error) {
      console.error('[ChatDebug] Connection test failed:', error);
      setDebugInfo(prev => ({ 
        ...prev, 
        testResult: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastError: String(error)
      }));
    }
  };

  const testChatMessage = async () => {
    try {
      console.log('[ChatDebug] Testing chat message send...');
      setDebugInfo(prev => ({ ...prev, testMessageSent: true }));
      
      await socketManager.publish('/app/chat.send', JSON.stringify({
        gameNumber,
        content: '[DEBUG] Test message from debug component'
      }));
      
      console.log('[ChatDebug] Test message sent successfully');
      setDebugInfo(prev => ({
        ...prev,
        testResult: 'Test message sent successfully!'
      }));
    } catch (error) {
      console.error('[ChatDebug] Test message failed:', error);
      setDebugInfo(prev => ({ 
        ...prev, 
        lastError: String(error),
        testResult: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const testDirectChatStore = async () => {
    try {
      console.log('[ChatDebug] Testing direct ChatStore sendMessage...');
      const { useChatStore } = await import('../stores/chatStore');
      const actions = useChatStore.getState().actions;

      await actions.sendMessage(gameNumber, '[DEBUG] Direct ChatStore test message');
      console.log('[ChatDebug] Direct ChatStore test completed');
      setDebugInfo(prev => ({
        ...prev,
        testResult: 'Direct ChatStore test completed!'
      }));
    } catch (error) {
      console.error('[ChatDebug] Direct ChatStore test failed:', error);
      setDebugInfo(prev => ({
        ...prev,
        lastError: String(error),
        testResult: `ChatStore test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const testDirectWebSocketSend = async () => {
    try {
      console.log('[ChatDebug] Testing direct WebSocket send...');
      setDebugInfo(prev => ({ ...prev, testResult: 'Testing direct WebSocket...' }));

      // STOMP 클라이언트에 직접 접근하여 메시지 전송
      const { stompClient } = await import('../../../shared/socket/stompClient');

      if (!stompClient.connected) {
        throw new Error('STOMP client is not connected');
      }

      console.log('[ChatDebug] STOMP client connected, sending message...');
      stompClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({
          gameNumber,
          content: '[DEBUG] Direct STOMP client test message'
        })
      });

      console.log('[ChatDebug] Direct STOMP message sent');
      setDebugInfo(prev => ({
        ...prev,
        testResult: 'Direct STOMP message sent successfully!'
      }));
    } catch (error) {
      console.error('[ChatDebug] Direct WebSocket test failed:', error);
      setDebugInfo(prev => ({
        ...prev,
        lastError: String(error),
        testResult: `Direct WebSocket test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  const checkWebSocketConnections = () => {
    try {
      console.log('[ChatDebug] Checking WebSocket connection details...');
      const connectionInfo = {
        currentUrl: window.location.href,
        webSocketUrl: debugInfo.url,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      console.log('[ChatDebug] Connection info:', connectionInfo);
      setDebugInfo(prev => ({
        ...prev,
        testResult: `Connection check completed. See console for details.`
      }));
    } catch (error) {
      console.error('[ChatDebug] Connection check failed:', error);
      setDebugInfo(prev => ({
        ...prev,
        lastError: String(error)
      }));
    }
  };

  const getConnectionStateColor = (state: string) => {
    switch (state) {
      case 'connected': return 'green';
      case 'connecting': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card withBorder padding="md" mb="md">
      <Stack gap="xs">
        <Text size="sm" fw={600}>🔧 채팅 디버그 정보</Text>
        
        <Group gap="xs">
          <Text size="xs">연결 상태:</Text>
          <Badge color={getConnectionStateColor(connectionState)} size="sm">
            {connectionState}
          </Badge>
        </Group>
        
        <Text size="xs">WebSocket URL: {debugInfo.url}</Text>
        <Text size="xs">게임 번호: {gameNumber}</Text>
        
        {debugInfo.testResult && (
          <Text size="xs" c={debugInfo.testResult.includes('Failed') ? 'red' : 'green'}>
            테스트 결과: {debugInfo.testResult}
          </Text>
        )}
        
        {debugInfo.lastError && (
          <Text size="xs" c="red">
            마지막 에러: {debugInfo.lastError}
          </Text>
        )}
        
        <Group gap="xs">
          <Button size="xs" variant="outline" onClick={testWebSocketConnection}>
            연결 테스트
          </Button>
          <Button size="xs" variant="outline" onClick={testChatMessage}>
            메시지 전송 테스트
          </Button>
          <Button size="xs" variant="outline" onClick={testDirectChatStore}>
            ChatStore 직접 테스트
          </Button>
          <Button size="xs" variant="outline" onClick={testDirectWebSocketSend}>
            WebSocket 직접 전송 테스트
          </Button>
          <Button size="xs" variant="outline" onClick={checkWebSocketConnections}>
            연결 상태 확인
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
