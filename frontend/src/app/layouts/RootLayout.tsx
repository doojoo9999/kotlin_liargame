import React from 'react';
import {Outlet} from 'react-router-dom';

// 1단계: 누락 레이아웃 스텁
export const RootLayout: React.FC = () => {
  return (
    <div style={{padding:16}}>
      <Outlet />
    </div>
  );
};
export default RootLayout;

