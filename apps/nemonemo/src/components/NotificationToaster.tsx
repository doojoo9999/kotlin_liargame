import * as Toast from '@radix-ui/react-toast';
import { useNotificationStore } from '@/store/notificationStore';

const NotificationToaster = () => {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <Toast.Provider>
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          duration={toast.duration ?? 5000}
          className="pointer-events-auto ml-auto mt-4 w-80 rounded-md border border-slate-800 bg-slate-900 p-4 shadow-lg"
          onOpenChange={(open) => {
            if (!open) removeToast(toast.id);
          }}
        >
          <Toast.Title className="font-semibold text-slate-50">{toast.title}</Toast.Title>
          {toast.description ? (
            <Toast.Description className="mt-1 text-sm text-slate-300">
              {toast.description}
            </Toast.Description>
          ) : null}
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-6 right-6 flex flex-col gap-2" />
    </Toast.Provider>
  );
};

export default NotificationToaster;
