import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {useGameFlow} from '@/hooks/useGameFlow';
import {Clock, Gavel, MessageCircle} from 'lucide-react';
import {Player} from '@/store/gameStore';

interface DefensePhaseProps {
  suspectedPlayer: Player | null;
  currentPlayer: Player | null;
  timeRemaining: number;
  isDefending: boolean;
  canEndDefense: boolean;
}

export const DefensePhase: React.FC<DefensePhaseProps> = ({
  suspectedPlayer,
  currentPlayer,
  timeRemaining,
  isDefending,
  canEndDefense,
}) => {
  const [defenseText, setDefenseText] = useState('');
  const [hasSubmittedDefense, setHasSubmittedDefense] = useState(false);
  const { submitDefense, endDefensePhase, isLoading, error } = useGameFlow();

  const handleSubmitDefense = async () => {
    if (!defenseText.trim()) return;

    try {
      await submitDefense(defenseText);
      setHasSubmittedDefense(true);
      setDefenseText('');
    } catch (error) {
      console.error('Failed to submit defense:', error);
    }
  };

  const handleEndDefense = async () => {
    try {
      await endDefensePhase();
    } catch (error) {
      console.error('Failed to end defense phase:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmitDefense();
    }
  };

  return (
    <div className="space-y-4">
      {/* 변론 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Gavel className="mr-2 h-5 w-5" />
              변론 단계
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
                {suspectedPlayer?.nickname.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {suspectedPlayer?.nickname || '알 수 없는 플레이어'}님이 변론 중입니다
              </div>
              <div className="text-sm text-muted-foreground">
                라이어 의혹을 받고 있는 플레이어입니다
              </div>
            </div>
          </div>

          {isDefending ? (
            <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
              <div className="text-orange-600 font-medium">
                🎭 당신이 변론할 차례입니다
              </div>
              <div className="text-sm text-orange-600/80 mt-1">
                자신이 라이어가 아님을 설득력 있게 설명하세요
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <div className="text-blue-600 font-medium">
                👂 변론을 듣고 있습니다
              </div>
              <div className="text-sm text-blue-600/80 mt-1">
                의심받는 플레이어의 변론을 잘 들어보세요
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 변론 입력 (변론자만) */}
      {isDefending && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              변론 제출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!hasSubmittedDefense ? (
                <>
                  <Textarea
                    placeholder="자신이 라이어가 아님을 설득력 있게 설명하세요. 힌트를 제공한 이유, 다른 플레이어들의 의심스러운 점 등을 언급할 수 있습니다..."
                    value={defenseText}
                    onChange={(e) => setDefenseText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    maxLength={500}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {defenseText.length}/500자 (Ctrl+Enter로 제출)
                    </span>
                    <Button
                      onClick={handleSubmitDefense}
                      disabled={!defenseText.trim() || isLoading}
                    >
                      {isLoading ? '제출 중...' : '변론 제출'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 font-medium mb-2">
                    ✓ 변론이 제출되었습니다
                  </div>
                  <div className="text-sm text-muted-foreground">
                    다른 플레이어들이 변론을 듣고 있습니다
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 변론 종료 버튼 (방장 또는 변론자) */}
      {canEndDefense && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-sm text-muted-foreground">
                변론을 충분히 들었다면 다음 단계로 진행할 수 있습니다
              </div>
              <Button
                onClick={handleEndDefense}
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                {isLoading ? '종료 중...' : '변론 종료하고 다음 단계로'}
              </Button>
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

      {/* 변론 단계 안내 */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <div>🎯 <strong>변론 단계 안내:</strong></div>
            <div>• 의심받는 플레이어가 자신의 무죄를 주장합니다</div>
            <div>• 변론자는 힌트를 제공한 이유를 설명할 수 있습니다</div>
            <div>• 다른 플레이어들의 의심스러운 점을 지적할 수 있습니다</div>
            <div>• 변론이 끝나면 최종 투표로 처형 여부를 결정합니다</div>

            {isDefending && (
              <div className="text-orange-600 mt-3">
                <div>💡 <strong>변론 팁:</strong></div>
                <div>• 구체적이고 논리적인 설명을 제공하세요</div>
                <div>• 자신의 힌트가 왜 합리적이었는지 설명하세요</div>
                <div>• 다른 플레이어들의 행동에서 의심스러운 점을 찾아보세요</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
