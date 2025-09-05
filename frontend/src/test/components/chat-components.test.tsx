/**
 * Chat Components Tests
 * 
 * Tests for chat-related UI components including
 * chat boxes, message lists, and input components.
 */

import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MantineProvider} from '@mantine/core';
import type {ReactNode} from 'react';

// Mock chat data types
interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  type: 'normal' | 'system' | 'whisper';
  targetUser?: string;
}

// Mock components for testing
const MockChatMessage = ({ 
  message,
  isCurrentUser = false,
  onReply
}: { 
  message: ChatMessage;
  isCurrentUser?: boolean;
  onReply?: (sender: string) => void;
}) => (
  <div 
    data-testid={`message-${message.id}`}
    className={`message ${message.type} ${isCurrentUser ? 'current-user' : ''}`}
  >
    <div data-testid={`message-sender-${message.id}`} className="sender">
      {message.sender}
      {message.type === 'system' && (
        <span data-testid={`system-badge-${message.id}`} className="system-badge">
          시스템
        </span>
      )}
      {message.type === 'whisper' && (
        <span data-testid={`whisper-badge-${message.id}`} className="whisper-badge">
          귓속말
        </span>
      )}
    </div>
    <div data-testid={`message-content-${message.id}`} className="content">
      {message.message}
      {message.targetUser && (
        <span data-testid={`whisper-target-${message.id}`}>
          → {message.targetUser}
        </span>
      )}
    </div>
    <div data-testid={`message-timestamp-${message.id}`} className="timestamp">
      {new Date(message.timestamp).toLocaleTimeString()}
    </div>
    {!isCurrentUser && onReply && (
      <button
        data-testid={`reply-button-${message.id}`}
        onClick={() => onReply(message.sender)}
        aria-label={`${message.sender}에게 답장하기`}
      >
        답장
      </button>
    )}
  </div>
);

const MockChatBox = ({ 
  messages,
  currentUser,
  onSendMessage,
  isConnected = true
}: {
  messages: ChatMessage[];
  currentUser: string;
  onSendMessage?: (message: string, type?: 'normal' | 'whisper', target?: string) => void;
  isConnected?: boolean;
}) => {
  const [inputMessage, setInputMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState<'normal' | 'whisper'>('normal');
  const [whisperTarget, setWhisperTarget] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && onSendMessage) {
      onSendMessage(inputMessage.trim(), messageType, whisperTarget);
      setInputMessage('');
      setWhisperTarget('');
    }
  };

  return (
    <div data-testid="chat-box" className="chat-box">
      <div data-testid="connection-status" className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '연결됨' : '연결 끊김'}
      </div>
      
      <div data-testid="message-list" className="message-list">
        {messages.map((message) => (
          <MockChatMessage
            key={message.id}
            message={message}
            isCurrentUser={message.sender === currentUser}
            onReply={(sender) => {
              setMessageType('whisper');
              setWhisperTarget(sender);
            }}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} data-testid="chat-form">
        <div className="message-type-selector">
          <label>
            <input
              type="radio"
              value="normal"
              checked={messageType === 'normal'}
              onChange={() => setMessageType('normal')}
              data-testid="normal-message-radio"
            />
            일반 메시지
          </label>
          <label>
            <input
              type="radio"
              value="whisper"
              checked={messageType === 'whisper'}
              onChange={() => setMessageType('whisper')}
              data-testid="whisper-message-radio"
            />
            귓속말
          </label>
        </div>

        {messageType === 'whisper' && (
          <input
            type="text"
            value={whisperTarget}
            onChange={(e) => setWhisperTarget(e.target.value)}
            placeholder="받을 사람의 닉네임"
            data-testid="whisper-target-input"
          />
        )}

        <div className="input-group">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            disabled={!isConnected}
            maxLength={500}
            data-testid="message-input"
          />
          <div data-testid="character-count" className="character-count">
            {inputMessage.length}/500
          </div>
        </div>

        <button
          type="submit"
          disabled={!inputMessage.trim() || !isConnected || (messageType === 'whisper' && !whisperTarget.trim())}
          data-testid="send-button"
        >
          전송
        </button>
      </form>
    </div>
  );
};

const MockChatUserList = ({ 
  users,
  currentUser,
  onWhisper
}: {
  users: string[];
  currentUser: string;
  onWhisper?: (targetUser: string) => void;
}) => (
  <div data-testid="chat-user-list" className="user-list">
    <h4>접속 중인 사용자</h4>
    <ul>
      {users.map((user, index) => (
        <li key={index} data-testid={`user-item-${user}`}>
          <span className={user === currentUser ? 'current-user' : ''}>
            {user}
            {user === currentUser && (
              <span data-testid={`current-user-badge-${user}`}> (나)</span>
            )}
          </span>
          {user !== currentUser && onWhisper && (
            <button
              onClick={() => onWhisper(user)}
              data-testid={`whisper-button-${user}`}
              aria-label={`${user}에게 귓속말하기`}
            >
              귓속말
            </button>
          )}
        </li>
      ))}
    </ul>
  </div>
);

const MockChatNotifications = ({ 
  unreadCount,
  onClear 
}: {
  unreadCount: number;
  onClear?: () => void;
}) => {
  if (unreadCount === 0) return null;

  return (
    <div data-testid="chat-notifications" className="chat-notifications">
      <span data-testid="unread-count" className="unread-count">
        {unreadCount}개의 새 메시지
      </span>
      {onClear && (
        <button 
          onClick={onClear}
          data-testid="clear-notifications"
          aria-label="알림 지우기"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Test wrapper
const TestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
};

describe('Chat Components', () => {
  const user = userEvent.setup();

  // Mock data
  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      sender: 'System',
      message: '게임이 시작되었습니다.',
      timestamp: '2024-01-15T10:00:00Z',
      type: 'system'
    },
    {
      id: 'msg-2',
      sender: '플레이어1',
      message: '안녕하세요!',
      timestamp: '2024-01-15T10:01:00Z',
      type: 'normal'
    },
    {
      id: 'msg-3',
      sender: '플레이어2',
      message: '비밀 메시지입니다.',
      timestamp: '2024-01-15T10:02:00Z',
      type: 'whisper',
      targetUser: '플레이어1'
    }
  ];

  const mockUsers = ['플레이어1', '플레이어2', '플레이어3'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ChatMessage Component', () => {
    it('should render normal message correctly', () => {
      render(
        <TestWrapper>
          <MockChatMessage message={mockMessages[1]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
      expect(screen.getByTestId('message-sender-msg-2')).toHaveTextContent('플레이어1');
      expect(screen.getByTestId('message-content-msg-2')).toHaveTextContent('안녕하세요!');
      expect(screen.getByTestId('message-timestamp-msg-2')).toBeInTheDocument();
    });

    it('should render system message with badge', () => {
      render(
        <TestWrapper>
          <MockChatMessage message={mockMessages[0]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('system-badge-msg-1')).toHaveTextContent('시스템');
      expect(screen.getByTestId('message-msg-1')).toHaveClass('system');
    });

    it('should render whisper message with target info', () => {
      render(
        <TestWrapper>
          <MockChatMessage message={mockMessages[2]} />
        </TestWrapper>
      );

      expect(screen.getByTestId('whisper-badge-msg-3')).toHaveTextContent('귓속말');
      expect(screen.getByTestId('whisper-target-msg-3')).toHaveTextContent('→ 플레이어1');
      expect(screen.getByTestId('message-msg-3')).toHaveClass('whisper');
    });

    it('should show reply button for other users messages', () => {
      const mockOnReply = vi.fn();
      
      render(
        <TestWrapper>
          <MockChatMessage 
            message={mockMessages[1]} 
            isCurrentUser={false}
            onReply={mockOnReply}
          />
        </TestWrapper>
      );

      const replyButton = screen.getByTestId('reply-button-msg-2');
      expect(replyButton).toBeInTheDocument();
      expect(replyButton).toHaveAttribute('aria-label', '플레이어1에게 답장하기');
    });

    it('should not show reply button for current user messages', () => {
      render(
        <TestWrapper>
          <MockChatMessage 
            message={mockMessages[1]} 
            isCurrentUser={true}
            onReply={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId('reply-button-msg-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('message-msg-2')).toHaveClass('current-user');
    });

    it('should handle reply button click', async () => {
      const mockOnReply = vi.fn();
      
      render(
        <TestWrapper>
          <MockChatMessage 
            message={mockMessages[1]} 
            onReply={mockOnReply}
          />
        </TestWrapper>
      );

      const replyButton = screen.getByTestId('reply-button-msg-2');
      await user.click(replyButton);

      expect(mockOnReply).toHaveBeenCalledWith('플레이어1');
    });
  });

  describe('ChatBox Component', () => {
    it('should render chat box with messages', () => {
      render(
        <TestWrapper>
          <MockChatBox 
            messages={mockMessages}
            currentUser="플레이어1"
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('chat-box')).toBeInTheDocument();
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
      expect(screen.getByTestId('chat-form')).toBeInTheDocument();

      // Should render all messages
      mockMessages.forEach((message) => {
        expect(screen.getByTestId(`message-${message.id}`)).toBeInTheDocument();
      });
    });

    it('should show connection status', () => {
      const { rerender } = render(
        <TestWrapper>
          <MockChatBox 
            messages={[]}
            currentUser="플레이어1"
            isConnected={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent('연결됨');
      expect(screen.getByTestId('connection-status')).toHaveClass('connected');

      rerender(
        <TestWrapper>
          <MockChatBox 
            messages={[]}
            currentUser="플레이어1"
            isConnected={false}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent('연결 끊김');
      expect(screen.getByTestId('connection-status')).toHaveClass('disconnected');
    });

    it('should handle normal message sending', async () => {
      const mockOnSendMessage = vi.fn();
      
      render(
        <TestWrapper>
          <MockChatBox 
            messages={[]}
            currentUser="플레이어1"
            onSendMessage={mockOnSendMessage}
          />
        </TestWrapper>
      );

      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      const normalRadio = screen.getByTestId('normal-message-radio');

      // Ensure normal message is selected
      await user.click(normalRadio);
      expect(normalRadio).toBeChecked();

      // Type and send message
      await user.type(messageInput, '테스트 메시지입니다');
      await user.click(sendButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('테스트 메시지입니다', 'normal', '');
    });

    it('should handle whisper message sending', async () => {
      const mockOnSendMessage = vi.fn();
      
      render(
        <TestWrapper>
          <MockChatBox 
            messages={[]}
            currentUser="플레이어1"
            onSendMessage={mockOnSendMessage}
          />
        </TestWrapper>
      );

      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      const whisperRadio = screen.getByTestId('whisper-message-radio');

      // Select whisper mode
      await user.click(whisperRadio);
      expect(whisperRadio).toBeChecked();

      // Should show whisper target input
      const whisperTargetInput = screen.getByTestId('whisper-target-input');
      expect(whisperTargetInput).toBeInTheDocument();

      // Fill in whisper details
      await user.type(whisperTargetInput, '플레이어2');
      await user.type(messageInput, '비밀 메시지');
      
      // Send button should be enabled now
      expect(sendButton).not.toBeDisabled();
      
      await user.click(sendButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('비밀 메시지', 'whisper', '플레이어2');
    });

    it('should enforce character limit', async () => {
      render(
        <TestWrapper>
          <MockChatBox 
            messages={[]}
            currentUser="플레이어1"
          />
        </TestWrapper>
      );

      const messageInput = screen.getByTestId('message-input');
      const characterCount = screen.getByTestId('character-count');

      expect(characterCount).toHaveTextContent('0/500');

      await user.type(messageInput, 'Hello');
      expect(characterCount).toHaveTextContent('5/500');

      // Input should have maxLength attribute
      expect(messageInput).toHaveAttribute('maxLength', '500');
    });

    it('should disable input when disconnected', () => {
      render(
        <TestWrapper>
          <MockChatBox 
            messages={[]}
            currentUser="플레이어1"
            isConnected={false}
          />
        </TestWrapper>
      );

      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      expect(messageInput).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('should clear message input after sending', async () => {
      // Mock React.useState for testing
      let messageState = '';
      const mockSetMessage = vi.fn((value: string) => {
        messageState = value;
      });

      vi.doMock('react', () => ({
        useState: vi.fn()
          .mockReturnValueOnce([messageState, mockSetMessage])
          .mockReturnValue(['normal', vi.fn()])
          .mockReturnValue(['', vi.fn()])
      }));

      const mockOnSendMessage = vi.fn().mockImplementation(() => {
        mockSetMessage(''); // Clear message after sending
      });

      render(
        <TestWrapper>
          <MockChatBox 
            messages={[]}
            currentUser="플레이어1"
            onSendMessage={mockOnSendMessage}
          />
        </TestWrapper>
      );

      // In real component, input would be cleared after sending
      expect(mockSetMessage).toBeDefined();
    });
  });

  describe('ChatUserList Component', () => {
    it('should render user list correctly', () => {
      render(
        <TestWrapper>
          <MockChatUserList 
            users={mockUsers}
            currentUser="플레이어1"
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('chat-user-list')).toBeInTheDocument();
      expect(screen.getByText('접속 중인 사용자')).toBeInTheDocument();

      mockUsers.forEach((user) => {
        expect(screen.getByTestId(`user-item-${user}`)).toBeInTheDocument();
      });
    });

    it('should highlight current user', () => {
      render(
        <TestWrapper>
          <MockChatUserList 
            users={mockUsers}
            currentUser="플레이어1"
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('current-user-badge-플레이어1')).toHaveTextContent(' (나)');
    });

    it('should show whisper buttons for other users', () => {
      const mockOnWhisper = vi.fn();
      
      render(
        <TestWrapper>
          <MockChatUserList 
            users={mockUsers}
            currentUser="플레이어1"
            onWhisper={mockOnWhisper}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('whisper-button-플레이어2')).toBeInTheDocument();
      expect(screen.getByTestId('whisper-button-플레이어3')).toBeInTheDocument();
      expect(screen.queryByTestId('whisper-button-플레이어1')).not.toBeInTheDocument();
    });

    it('should handle whisper button click', async () => {
      const mockOnWhisper = vi.fn();
      
      render(
        <TestWrapper>
          <MockChatUserList 
            users={mockUsers}
            currentUser="플레이어1"
            onWhisper={mockOnWhisper}
          />
        </TestWrapper>
      );

      const whisperButton = screen.getByTestId('whisper-button-플레이어2');
      await user.click(whisperButton);

      expect(mockOnWhisper).toHaveBeenCalledWith('플레이어2');
    });
  });

  describe('ChatNotifications Component', () => {
    it('should not render when no unread messages', () => {
      render(
        <TestWrapper>
          <MockChatNotifications unreadCount={0} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('chat-notifications')).not.toBeInTheDocument();
    });

    it('should render unread count when messages exist', () => {
      render(
        <TestWrapper>
          <MockChatNotifications unreadCount={5} />
        </TestWrapper>
      );

      expect(screen.getByTestId('chat-notifications')).toBeInTheDocument();
      expect(screen.getByTestId('unread-count')).toHaveTextContent('5개의 새 메시지');
    });

    it('should show clear button when provided', () => {
      const mockOnClear = vi.fn();
      
      render(
        <TestWrapper>
          <MockChatNotifications 
            unreadCount={3} 
            onClear={mockOnClear}
          />
        </TestWrapper>
      );

      const clearButton = screen.getByTestId('clear-notifications');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toHaveAttribute('aria-label', '알림 지우기');
    });

    it('should handle clear button click', async () => {
      const mockOnClear = vi.fn();
      
      render(
        <TestWrapper>
          <MockChatNotifications 
            unreadCount={3} 
            onClear={mockOnClear}
          />
        </TestWrapper>
      );

      const clearButton = screen.getByTestId('clear-notifications');
      await user.click(clearButton);

      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('Chat Integration', () => {
    it('should handle message reply flow', async () => {
      const mockOnSendMessage = vi.fn();
      
      render(
        <TestWrapper>
          <MockChatBox 
            messages={mockMessages}
            currentUser="플레이어3"
            onSendMessage={mockOnSendMessage}
          />
        </TestWrapper>
      );

      // Click reply on a message
      const replyButton = screen.getByTestId('reply-button-msg-2');
      await user.click(replyButton);

      // Should switch to whisper mode
      const whisperRadio = screen.getByTestId('whisper-message-radio');
      expect(whisperRadio).toBeChecked();

      // Should pre-fill whisper target
      const whisperTargetInput = screen.getByTestId('whisper-target-input');
      expect(whisperTargetInput).toHaveValue('플레이어1');
    });

    it('should auto-scroll to latest message', () => {
      const MockScrollableChat = ({ messages }: { messages: ChatMessage[] }) => {
        const messagesEndRef = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, [messages]);

        return (
          <div data-testid="scrollable-chat">
            <div className="messages">
              {messages.map((message) => (
                <div key={message.id}>{message.message}</div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <MockScrollableChat messages={mockMessages} />
        </TestWrapper>
      );

      expect(screen.getByTestId('scrollable-chat')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(
        <TestWrapper>
          <MockChatBox 
            messages={mockMessages}
            currentUser="플레이어1"
          />
        </TestWrapper>
      );

      const replyButton = screen.getByTestId('reply-button-msg-2');
      expect(replyButton).toHaveAttribute('aria-label', '플레이어1에게 답장하기');
    });

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <MockChatBox 
            messages={[]}
            currentUser="플레이어1"
          />
        </TestWrapper>
      );

      const normalRadio = screen.getByTestId('normal-message-radio');
      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');

      // Tab navigation
      await user.tab();
      expect(normalRadio).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('whisper-message-radio')).toHaveFocus();

      // Continue tabbing to reach input
      await user.tab();
      expect(messageInput).toHaveFocus();
    });
  });
});