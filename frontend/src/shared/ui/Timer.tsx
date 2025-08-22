import {Text} from '@mantine/core';
import {useTimer} from '../hooks/useTimer';

interface TimerProps {
  endTime: string | number | Date | undefined | null;
  prefix?: string;
}

export function Timer({ endTime, prefix = '남은 시간: ' }: TimerProps) {
  const remainingTime = useTimer(endTime);

  return (
    <Text fw={700} size="lg">
      {prefix}
      {remainingTime}초
    </Text>
  );
}
