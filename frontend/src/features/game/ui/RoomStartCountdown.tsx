import {useEffect, useState} from 'react';
import {Alert, Button, Group, Progress, Text} from '@mantine/core';
import {AlertTriangle, Clock} from 'lucide-react';

interface RoomStartCountdownProps {
  gameNumber: number;
  isRoomFull: boolean;
  isOwner: boolean;
  onStartGame: () => void;
  onExtendTime: () => void;
}

export function RoomStartCountdown({
  gameNumber,
  isRoomFull,
  isOwner,
  onStartGame,
  onExtendTime
}: RoomStartCountdownProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isWarningPhase, setIsWarningPhase] = useState(false);

  useEffect(() => {
    if (!isRoomFull) {
      setCountdown(null);
      setIsWarningPhase(false);
      return;
    }

    // 방이 가득 찬 후 18분 후 경고 시작 (20분 - 2분 경고)
    const warningTimer = setTimeout(() => {
      setIsWarningPhase(true);
    }, 18 * 60 * 1000); // 18분

    // 20분 후 카운트다운 시작
    const countdownTimer = setTimeout(() => {
      setCountdown(20);
    }, 20 * 60 * 1000); // 20분

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(countdownTimer);
    };
  }, [isRoomFull]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          // 카운트다운 종료 - 방장 강퇴 처리
          handleOwnerKick();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleOwnerKick = async () => {
    try {
      console.log(`[RoomStartCountdown] 방장 강퇴 처리 - 게임 번호: ${gameNumber}`);

      // 백엔드에 방장 강퇴 및 권한 이양 요청
      const response = await fetch(`/api/v1/game/${gameNumber}/kick-owner`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        console.log(`[RoomStartCountdown] 방장 강퇴 성공:`, result);
        console.log(`[RoomStartCountdown] 새로운 방장: ${result.newOwner}, 강퇴된 방장: ${result.kickedPlayer}`);
      } else {
        console.error(`[RoomStartCountdown] 방장 강퇴 실패:`, result.message);
      }

    } catch (error) {
      console.error(`[RoomStartCountdown] 게임 ${gameNumber} 방장 강퇴 실패:`, error);
    }
  };

  // 시간 연장 처리 함수도 추가
  const handleExtendTime = () => {
    onExtendTime(); // 기존 prop 함수 호출

    // 추가로 백엔드 API 호출
    extendTimeOnServer();
  };

  const extendTimeOnServer = async () => {
    try {
      console.log(`[RoomStartCountdown] 시간 연장 요청 - 게임 번호: ${gameNumber}`);

      const response = await fetch(`/api/v1/game/${gameNumber}/extend-time`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        console.log(`[RoomStartCountdown] 시간 연장 성공:`, result);
        console.log(`[RoomStartCountdown] 연장된 시간: ${result.extendedUntil}`);
      } else {
        console.error(`[RoomStartCountdown] 시간 연장 실패:`, result.message);
      }

    } catch (error) {
      console.error(`[RoomStartCountdown] 게임 ${gameNumber} 시간 연장 실패:`, error);
    }
  };

  const handleStartNow = () => {
    setCountdown(null);
    setIsWarningPhase(false);
    onStartGame();
  };

  const handleExtendTimer = () => {
    setCountdown(null);
    setIsWarningPhase(false);
    handleExtendTime(); // 정의된 handleExtendTime 함수 사용
  };

  if (!isRoomFull && !isWarningPhase && countdown === null) {
    return null;
  }

  const getProgressColor = () => {
    if (countdown === null) return 'blue';
    if (countdown <= 5) return 'red';
    if (countdown <= 10) return 'orange';
    return 'yellow';
  };

  return (
    <>
      {isWarningPhase && countdown === null && (
        <Alert
          icon={<AlertTriangle size={16} />}
          color="orange"
          variant="light"
          mb="md"
        >
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>게임 시작 준비</Text>
              <Text size="sm">
                방이 가득 찼습니다. 2분 후 자동으로 게임 시작 카운트다운이 시작됩니다.
              </Text>
            </div>
            {isOwner && (
              <Group gap="xs">
                <Button size="xs" onClick={handleStartNow}>
                  지금 시작
                </Button>
                <Button size="xs" variant="outline" onClick={handleExtendTimer}>
                  시간 연장
                </Button>
              </Group>
            )}
          </Group>
        </Alert>
      )}

      {countdown !== null && (
        <Alert
          icon={<Clock size={16} />}
          color={getProgressColor()}
          variant="filled"
          mb="md"
        >
          <Group justify="space-between" align="center">
            <div>
              <Text fw={700} size="lg" c="white">
                게임 시작 강제 카운트다운: {countdown}초
              </Text>
              <Text size="sm" c="white" opacity={0.9}>
                {isOwner
                  ? "게임을 시작하지 않으면 방장 권한이 박탈됩니다!"
                  : "방장이 게임을 시작하지 않으면 자동으로 강퇴됩니다."}
              </Text>
            </div>
            {isOwner && countdown > 5 && (
              <Group gap="xs">
                <Button
                  size="sm"
                  variant="white"
                  color={getProgressColor()}
                  onClick={handleStartNow}
                >
                  지금 시작
                </Button>
                {countdown > 10 && (
                  <Button
                    size="sm"
                    variant="outline"
                    c="white"
                    onClick={handleExtendTimer}
                  >
                    시간 연장 (+5분)
                  </Button>
                )}
              </Group>
            )}
          </Group>

          <Progress
            value={(20 - countdown) / 20 * 100}
            color={getProgressColor()}
            size="sm"
            mt="xs"
            styles={{
              root: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          />
        </Alert>
      )}
    </>
  );
}
