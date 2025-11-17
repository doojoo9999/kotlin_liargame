import React, {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Badge} from '@/components/ui/badge';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Lightbulb,
    Loader2,
    Lock,
    MessageSquare,
    Search,
    Send,
    Shield,
    Target
} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import type {GamePhase, Player} from '@/stores';
import {toast} from 'sonner';

interface GameActionInterfaceProps {
  gamePhase: GamePhase;
  currentPlayer: Player | null;
  isMyTurn: boolean;
  isLiar: boolean;
  canVote: boolean;
  timeRemaining: number;
  onSubmitHint: (hint: string) => Promise<void>;
  onVotePlayer: (playerId: string) => Promise<void>;
  onSubmitDefense: (defense: string) => Promise<void>;
  onGuessWord: (guess: string) => Promise<void>;
  onCastFinalVote: (execute: boolean) => Promise<void>;
  players: Player[];
  suspectedPlayer?: Player;
  currentTopic?: string;
  currentWord?: string;
}

interface ActionConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  placeholder?: string;
  maxLength?: number;
  isUrgent?: boolean;
}

export const GameActionInterface: React.FC<GameActionInterfaceProps> = ({
  gamePhase,
  currentPlayer,
  isMyTurn,
  isLiar,
  canVote,
  timeRemaining,
  onSubmitHint,
  onVotePlayer,
  onSubmitDefense,
  onGuessWord,
  onCastFinalVote,
  players,
  suspectedPlayer,
  currentTopic,
  currentWord,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [finalVote, setFinalVote] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset form when phase changes
  useEffect(() => {
    setInputValue('');
    setSelectedPlayer('');
    setFinalVote(null);
    setError('');
  }, [gamePhase]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const getActionConfig = (): ActionConfig => {
    switch (gamePhase) {
      case 'SPEECH':
        return {
          title: isMyTurn ? '힌트 제공하기' : '힌트 제공 대기',
          description: isLiar 
            ? '다른 플레이어들의 힌트를 참고하여 자연스러운 힌트를 제공하세요'
            : `주제 "${currentTopic}"에 대한 단어의 힌트를 제공하세요`,
          icon: <MessageSquare className="h-5 w-5" />,
          color: isLiar ? 'text-orange-600' : 'text-green-600',
          bgColor: isLiar ? 'bg-orange-50' : 'bg-green-50',
          placeholder: isLiar 
            ? '추측한 단어와 관련된 힌트를 입력하세요...'
            : '주어진 단어에 대한 힌트를 입력하세요...',
          maxLength: 100,
          isUrgent: timeRemaining <= 15
        };

      case 'VOTING_FOR_LIAR':
        return {
          title: '라이어 투표',
          description: '라이어라고 생각하는 플레이어를 선택하세요',
          icon: <Target className="h-5 w-5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          isUrgent: timeRemaining <= 20
        };

      case 'DEFENDING':
        return {
          title: suspectedPlayer?.id === currentPlayer?.id ? '변론하기' : '변론 듣기',
          description: suspectedPlayer?.id === currentPlayer?.id
            ? '자신이 라이어가 아님을 증명하세요'
            : `${suspectedPlayer?.nickname}님의 변론을 들어보세요`,
          icon: <Shield className="h-5 w-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          placeholder: '자신의 무고함을 증명하는 변론을 입력하세요...',
          maxLength: 200,
          isUrgent: timeRemaining <= 20
        };

      case 'VOTING_FOR_SURVIVAL':
        return {
          title: '최종 투표',
          description: '변론을 들은 후 처형 여부를 결정하세요',
          icon: <Target className="h-5 w-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          isUrgent: timeRemaining <= 15
        };

      case 'GUESSING_WORD':
        return {
          title: isLiar ? '단어 맞추기' : '라이어의 추측',
          description: isLiar
            ? '지금까지의 힌트를 바탕으로 정답을 추측하세요!'
            : '라이어가 정답을 맞출 수 있을지 지켜보세요',
          icon: <Search className="h-5 w-5" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          placeholder: '추측한 단어를 입력하세요...',
          maxLength: 50,
          isUrgent: true
        };

      default:
        return {
          title: '대기 중',
          description: '다음 단계를 기다리고 있습니다',
          icon: <Clock className="h-5 w-5" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const withValidation = <T extends unknown>(condition: boolean, message: string, action: () => Promise<T>) => {
    if (!condition) {
      setError(message);
      return Promise.reject(new Error(message));
    }
    return action();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      switch (gamePhase) {
        case 'SPEECH':
          await withValidation(Boolean(inputValue.trim()), '힌트를 입력해주세요', () => onSubmitHint(inputValue.trim()));
          break;
        case 'VOTING_FOR_LIAR':
          await withValidation(Boolean(selectedPlayer), '투표할 플레이어를 선택해주세요', () => onVotePlayer(selectedPlayer));
          break;
        case 'DEFENDING':
          await withValidation(Boolean(inputValue.trim()), '변론을 입력해주세요', () => onSubmitDefense(inputValue.trim()));
          break;
        case 'VOTING_FOR_SURVIVAL':
          await withValidation(finalVote !== null, '투표를 선택해주세요', () => onCastFinalVote(Boolean(finalVote)));
          break;
        case 'GUESSING_WORD':
          await withValidation(Boolean(inputValue.trim()), '추측하는 단어를 입력해주세요', () => onGuessWord(inputValue.trim()));
          break;
      }

      setInputValue('');
      setSelectedPlayer('');
      setFinalVote(null);
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const config = getActionConfig();
  const canInteract = (isMyTurn || canVote) && !isSubmitting;
  const showInput = gamePhase === 'DEFENDING' || gamePhase === 'GUESSING_WORD';
  const showVoting = gamePhase === 'VOTING_FOR_LIAR';
  const showFinalVote = gamePhase === 'VOTING_FOR_SURVIVAL';
  const helperId = `game-action-helper-${gamePhase}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={gamePhase}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`border-2 shadow-lg ${
          config.isUrgent ? 'border-red-300 shadow-red-100' : 'border-gray-200'
        } ${config.bgColor}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={config.color}>
                  {config.icon}
                </div>
                <span className={`text-lg ${config.color}`}>
                  {config.title}
                </span>
                {config.isUrgent && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    긴급
                  </Badge>
                )}
              </div>
              
              {timeRemaining > 0 && (
                <div className={`text-sm font-mono ${
                  timeRemaining <= 10 ? 'text-red-600 font-bold' : 'text-gray-600'
                }`}>
                  <Clock className="inline mr-1 h-4 w-4" />
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Description */}
              <p id={helperId} className="text-sm text-gray-700 leading-relaxed">
                {config.description}
              </p>

              {/* Current Topic/Word Display */}
              {gamePhase === 'SPEECH' && (
                <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-3" aria-live="polite">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-600">주제:</span>
                      <span className="ml-2 font-bold text-blue-600">{currentTopic}</span>
                    </div>
                    {!isLiar && currentWord && (
                      <div>
                        <span className="font-medium text-gray-600">단어:</span>
                        <span className="ml-2 font-bold text-green-600">{currentWord}</span>
                      </div>
                    )}
                  </div>
                  {isLiar && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-500/15 via-background/95 to-orange-500/15 backdrop-blur-sm" role="note">
                      <Lock className="h-6 w-6 text-orange-500" aria-hidden="true" />
                      <span className="text-sm font-semibold text-orange-600">라이어는 비밀 단어를 확인할 수 없습니다</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Interface */}
              {gamePhase === 'SPEECH' && isMyTurn && (
                <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800" role="note">
                  <div className="flex items-center gap-2 font-semibold text-blue-700">
                    <MessageSquare className="h-4 w-4" />
                    메인 채팅 입력창을 사용해 힌트를 보내주세요
                  </div>
                  <p>
                    채팅 패널 하단의 입력창에서 메시지 유형을 <strong>힌트</strong>로 선택한 뒤 내용을 입력하면 차례가 진행됩니다.
                  </p>
                  <p className="text-xs text-blue-600/80">
                    Shift+Enter로 줄바꿈을 사용할 수 있으며, 전송이 완료되면 자동으로 다음 플레이어에게 차례가 넘어갑니다.
                  </p>
                </div>
              )}

              {canInteract && gamePhase !== 'SPEECH' && (
                <div className="space-y-3">
                  {/* Text Input */}
                  {showInput && (
                    <div className="space-y-2">
                      {gamePhase === 'DEFENDING' ? (
                        <Textarea
                          placeholder={config.placeholder}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          maxLength={config.maxLength}
                          rows={4}
                          className="resize-none"
                          aria-describedby={helperId}
                          aria-invalid={Boolean(error)}
                        />
                      ) : (
                        <Input
                          placeholder={config.placeholder}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          maxLength={config.maxLength}
                          aria-describedby={helperId}
                          aria-invalid={Boolean(error)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit();
                            }
                          }}
                        />
                      )}
                      
                      {config.maxLength && (
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <div>
                            {gamePhase === 'SPEECH' && (
                              <span className="flex items-center">
                                <Lightbulb className="mr-1 h-3 w-3" />
                                팁: {isLiar ? '다른 플레이어의 힌트를 참고하세요' : '단어 자체는 언급하지 마세요'}
                              </span>
                            )}
                          </div>
                          <span>{inputValue.length}/{config.maxLength}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Player Voting */}
                  {showVoting && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700" id="vote-instruction">
                        라이어로 의심되는 플레이어를 선택하세요:
                      </div>
                      <div className="grid grid-cols-1 gap-2" role="listbox" aria-labelledby="vote-instruction">
                        {players
                          .filter(p => p.id !== currentPlayer?.id && p.isAlive !== false)
                          .map((player) => (
                            <button
                              key={player.id}
                              onClick={() => setSelectedPlayer(player.id)}
                              className={`p-3 rounded-lg border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 ${
                                selectedPlayer === player.id
                                  ? 'border-red-400 bg-red-50 text-red-800'
                                  : 'border-gray-200 bg-white hover:border-red-200'
                              }`}
                              aria-pressed={selectedPlayer === player.id}
                              aria-selected={selectedPlayer === player.id}
                              aria-label={`${player.nickname}에게 투표`}
                              role="option"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{player.nickname}</span>
                                {selectedPlayer === player.id && (
                                  <CheckCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                                )}
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Final Vote */}
                  {showFinalVote && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700" id="final-vote-instruction">
                        {suspectedPlayer?.nickname}님을 처형할까요?
                      </div>
                      <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="final-vote-instruction">
                        <button
                          onClick={() => setFinalVote(true)}
                          className={`p-3 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-400 ${
                            finalVote === true
                              ? 'border-red-400 bg-red-50 text-red-800'
                              : 'border-gray-200 bg-white hover:border-red-200'
                          }`}
                          aria-pressed={finalVote === true}
                          aria-label={`${suspectedPlayer?.nickname ?? '해당 플레이어'} 처형 결정`}
                        >
                          <div className="text-center">
                            <div className="font-medium">처형</div>
                            <div className="text-xs text-gray-600">라이어로 확신</div>
                          </div>
                        </button>
                        <button
                          onClick={() => setFinalVote(false)}
                          className={`p-3 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-400 ${
                            finalVote === false
                              ? 'border-green-400 bg-green-50 text-green-800'
                              : 'border-gray-200 bg-white hover:border-green-200'
                          }`}
                          aria-pressed={finalVote === false}
                          aria-label={`${suspectedPlayer?.nickname ?? '해당 플레이어'} 생존 결정`}
                        >
                          <div className="text-center">
                            <div className="font-medium">생존</div>
                            <div className="text-xs text-gray-600">확신하지 못함</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" role="alert" aria-live="assertive">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (
                      (showInput && !inputValue.trim()) ||
                      (showVoting && !selectedPlayer) ||
                      (showFinalVote && finalVote === null)
                    )}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        제출 중...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {gamePhase === 'SPEECH' && '힌트 제출'}
                        {gamePhase === 'VOTING_FOR_LIAR' && '라이어 투표'}
                        {gamePhase === 'DEFENDING' && '변론 제출'}
                        {gamePhase === 'VOTING_FOR_SURVIVAL' && '최종 투표'}
                        {gamePhase === 'GUESSING_WORD' && '단어 추측'}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Waiting State */}
              {!canInteract && gamePhase !== 'WAITING_FOR_PLAYERS' && gamePhase !== 'GAME_OVER' && (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <div className="text-sm">
                    {!isMyTurn && '다른 플레이어의 턴을 기다리고 있습니다'}
                    {isMyTurn && !canVote && '준비가 완료되면 진행됩니다'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
