import React from 'react';

// Minimal ChatSystem stub (Step2 dependency resolution)
export interface ChatSystemProps {
  messages?: Array<{ id: number|string; playerNickname: string|null; content: string; type?: string; timestamp?: string }>;
  onSend?: (content: string) => void;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({ messages = [], onSend }) => {
  return (
    <div data-component="chat-system" className="space-y-2 p-2 border rounded">
      <div className="text-sm font-semibold">Chat (stub)</div>
      <div className="h-32 overflow-auto text-xs bg-muted/40 p-2 rounded">
        {messages.map(m => (
          <div key={m.id}>
            <strong>{m.playerNickname ?? 'SYSTEM'}:</strong> {m.content}
          </div>
        ))}
        {messages.length === 0 && <div className="text-muted-foreground">No messages</div>}
      </div>
      <button type="button" className="text-xs underline" onClick={() => onSend?.('[stub] message')}>Send Test</button>
    </div>
  );
};

export default ChatSystem;

