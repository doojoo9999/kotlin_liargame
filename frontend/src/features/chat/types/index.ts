export interface ChatMessage {
  sender: string;
  content: string;
  timestamp: string; // ISO 8601 format
  type: 'PLAYER' | 'SYSTEM' | 'LIAR_ONLY';
}
