import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {useGameFlow} from '@/hooks/useGameFlow';
import {Clock, MessageSquare} from 'lucide-react';

interface HintPhaseProps {
  currentTopic: string | null;
  currentWord: string | null;
  isMyTurn: boolean;
  isLiar: boolean;
  timeRemaining: number;
}

export const HintPhase: React.FC<HintPhaseProps> = ({
  currentTopic,
  currentWord,
  isMyTurn,
  isLiar,
  timeRemaining,
}) => {
  const [hint, setHint] = useState('');
  const { submitHint, isLoading, error } = useGameFlow();

  const handleSubmitHint = async () => {
    if (!hint.trim()) return;

    try {
      await submitHint(hint);
      setHint('');
    } catch (error) {
      console.error('Failed to submit hint:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitHint();
    }
  };

  return (
    <div className="space-y-4">
      {/* 게임 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>힌트 제공 단계</span>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">주제: </span>
              <span className="text-lg">{currentTopic || '알 수 없음'}</span>
            </div>
            {!isLiar && currentWord && (
              <div>
                <span className="font-medium">단어: </span>
                <span className="text-lg font-bold text-primary">{currentWord}</span>
              </div>
            )}
            {isLiar && (
              <div className="text-orange-600 font-medium">
                당신은 라이어입니다. 단어를 모른 채로 힌트를 제공해야 합니다.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 힌트 입력 */}
      {isMyTurn ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              힌트 제공
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder={isLiar ? "다른 플레이어의 힌트를 참고하여 힌트를 제공하세요..." : "주어진 단어에 대한 힌트를 제공하세요..."}
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    {hint.length}/100자
                  </span>
                  <Button
                    onClick={handleSubmitHint}
                    disabled={!hint.trim() || isLoading}
                    size="sm"
                  >
                    {isLoading ? '제출 중...' : '힌트 제출'}
                  </Button>
                </div>
              </div>
              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              다른 플레이어가 힌트를 제공하고 있습니다...
            </div>
          </CardContent>
        </Card>
      )}

      {/* 게임 규칙 안내 */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-1">
            <div>💡 <strong>힌트 제공 규칙:</strong></div>
            <div>• 주어진 단어와 관련된 힌트를 제공하세요</div>
            <div>• 단어 자체나 단어의 일부를 직접 말하면 안 됩니다</div>
            <div>• 명확하면서도 너무 직접적이지 않은 힌트가 좋습니다</div>
            {isLiar && (
              <div className="text-orange-600 mt-2">
                <div>🎭 <strong>라이어 전략:</strong></div>
                <div>• 다른 플레이어의 힌트를 잘 듣고 단어를 추측해보세요</div>
                <div>• 자연스럽게 섞여들 수 있는 힌트를 제공하세요</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
