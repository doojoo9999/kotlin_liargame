export interface ChatMessage {
  sender: string | null;
  content: string;
  timestamp: string; // ISO 8601 format
  type: 'HINT' | 'DISCUSSION' | 'DEFENSE' | 'POST_ROUND' | 'SYSTEM'; // 백엔드 ChatMessageType과 일치하도록 수정
}
