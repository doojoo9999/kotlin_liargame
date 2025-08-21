import {useEffect, useState} from 'react';

const calculateRemainingTime = (endTime: string | number | Date) => {
  const difference = +new Date(endTime) - +new Date();
  return difference > 0 ? Math.floor(difference / 1000) : 0;
};

export const useTimer = (endTime: string | number | Date | undefined | null) => {
  const [remainingTime, setRemainingTime] = useState(endTime ? calculateRemainingTime(endTime) : 0);

  useEffect(() => {
    if (!endTime) {
      setRemainingTime(0);
      return;
    }

    // Set initial time
    setRemainingTime(calculateRemainingTime(endTime));

    const interval = setInterval(() => {
      const newRemainingTime = calculateRemainingTime(endTime);
      setRemainingTime(newRemainingTime);
      if (newRemainingTime <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return remainingTime;
};
