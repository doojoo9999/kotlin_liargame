import React from 'react';
import {createRoot} from 'react-dom/client';
import {GameComponentsDemo} from './features/demo/GameComponentsDemo';
import './app/styles/globals.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <GameComponentsDemo />
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);

export default App;
