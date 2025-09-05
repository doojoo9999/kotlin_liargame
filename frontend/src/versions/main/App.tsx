import React from 'react';
import {MainProviders} from './providers';
import {GameLayout} from './components/layout/GameLayout';
import MainRouter from './router/MainRouter';
import './styles/globals.css';

const MainApp: React.FC = () => {
  return (
    <MainProviders>
      <GameLayout>
        <MainRouter />
      </GameLayout>
    </MainProviders>
  );
};

export default MainApp;
