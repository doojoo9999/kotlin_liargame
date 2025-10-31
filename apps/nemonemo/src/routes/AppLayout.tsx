import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import NotificationToaster from '../components/NotificationToaster';
import { useSubjectKey } from '@/hooks/useSubjectKey';

const AppLayout = () => {
  useSubjectKey();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8">
        <Outlet />
      </main>
      <Footer />
      <NotificationToaster />
    </div>
  );
};

export default AppLayout;
