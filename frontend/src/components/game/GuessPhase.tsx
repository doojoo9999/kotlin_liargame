import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {useGameFlow} from '@/hooks/useGameFlow';
import {Clock, Lightbulb, Target} from 'lucide-react';
import {Player} from '@/store/gameStore';

interface GuessPhaseProps {
  currentTopic: string | null;
  liarPlayer: Player | null;
  currentPlayer: Player | null;
  timeRemaining: number;
  isLiar: boolean;
  hints: string[];
}

export const GuessPhase: React.FC<GuessPhaseProps> = ({
  currentTopic,
  liarPlayer,
  currentPlayer,
  timeRemaining,
  isLiar,
  hints = [],
}) => {
  const [guess, setGuess] = useState('');
  const [hasSubmittedGuess, setHasSubmittedGuess] = useState(false);
  const { guessWord, isLoading, error } = useGameFlow();

  const handleSubmitGuess = async () => {
    if (!guess.trim()) return;

    try {
      await guessWord(guess);
      setHasSubmittedGuess(true);
      setGuess('');
    } catch (error) {
      console.error('Failed to submit guess:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitGuess();
    }
  };

  return (
    <div className="space-y-4">
      {/* 단계 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              단어 추측 단계
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {liarPlayer?.nickname.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {liarPlayer?.nickname || '라이어'}가 단어를 추측합니다
              </div>
              <div className="text-sm text-muted-foreground">
                주제: <span className="font-medium">{currentTopic || '알 수 없음'}</span>
              </div>
            </div>
          </div>

          {isLiar ? (
            <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
              <div className="text-orange-600 font-medium">
                🎯 단어를 추측할 마지막 기회입니다
              </div>
              <div className="text-sm text-orange-600/80 mt-1">
                다른 플레이어들의 힌트를 바탕으로 정확한 단어를 맞춰보세요
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="text-blue-600 font-medium">
                🤔 라이어가 단어를 추측하고 있습니다
              </div>
              <div className="text-sm text-blue-600/80 mt-1">
                라이어가 정답을 맞출 수 있을까요?
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 힌트 목록 */}
      {hints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              제공된 힌트들
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hints.map((hint, index) => (
                <div key={index} className="p-2 bg-muted rounded-lg">
                  <div className="text-sm font-medium">힌트 {index + 1}</div>
                  <div className="text-muted-foreground">{hint}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 단어 추측 입력 (라이어만) */}
      {isLiar && (
        <Card>
          <CardHeader>
            <CardTitle>단어 추측</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!hasSubmittedGuess ? (
                <>
                  <div>
                    <Input
                      placeholder="추측하는 단어를 입력하세요..."
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      maxLength={50}
                      className="text-lg text-center"
                    />
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      {guess.length}/50자
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={handleSubmitGuess}
                      disabled={!guess.trim() || isLoading}
                      size="lg"
                      className="w-full max-w-xs"
                    >
                      {isLoading ? '제출 중...' : '단어 제출'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 font-medium mb-2">
                    ✓ 추측이 제출되었습니다
                  </div>
                  <div className="text-sm text-muted-foreground">
                    결과를 기다리고 있습니다...
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive text-center">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* 추측 단계 안내 */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <div>🎯 <strong>단어 추측 단계:</strong></div>
            <div>• 라이어가 마지막으로 정답을 맞출 기회입니다</div>
            <div>• 라이어가 정답을 맞추면 라이어팀이 승리합니다</div>
            <div>• 라이어가 틀리면 시민팀이 승리합니다</div>

            {isLiar && (
              <div className="text-orange-600 mt-3">
                <div>💡 <strong>추측 팁:</strong></div>
                <div>• 모든 힌트를 종합하여 생각해보세요</div>
                <div>• 주제와 관련된 단어들을 떠올려보세요</div>
                <div>• 힌트들 사이의 공통점을 찾아보세요</div>
                <div>• 너무 복잡하게 생각하지 말고 직관을 믿어보세요</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
