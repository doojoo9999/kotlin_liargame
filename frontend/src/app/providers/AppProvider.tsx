import React from 'react';

/**
 * AppProvider: 전역 Context / Theme / QueryClient 등을 추후 주입할 컨테이너.
 * 1단계에서는 누락 모듈 TS2307 방지용 최소 스텁.
 */
export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return <>{children}</>;
};

