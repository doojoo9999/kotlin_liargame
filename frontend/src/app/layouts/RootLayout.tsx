import {Outlet} from 'react-router-dom';
import {AppProvider} from '../providers/AppProvider';

export function RootLayout() {
  return (
    <AppProvider>
      <main>
        <Outlet />
      </main>
    </AppProvider>
  );
}
