import React from 'react';
import {createRoot} from 'react-dom/client';
import {IntegratedVersionDemo} from './features/demo/IntegratedVersionDemo';
import {VersionRouter} from './app/VersionRouter';
import './app/styles/globals.css';

const App: React.FC = () => {
  // URL 파라미터로 데모 모드 결정
  const searchParams = new URLSearchParams(window.location.search);
  const isDemo = searchParams.get('demo') === 'true';

  return (
    <div className="App">
      {isDemo ? <IntegratedVersionDemo /> : <VersionRouter />}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);

export default App;
