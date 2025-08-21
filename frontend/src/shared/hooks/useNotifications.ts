import {notifications} from '@mantine/notifications';
import {AlertTriangle, CheckCircle, Info} from 'lucide-react';

export const useNotifications = () => {
  const showSuccess = (title: string, message: string) => {
    notifications.show({
      title,
      message,
      color: 'green',
      icon: <CheckCircle size={18} />,
    });
  };

  const showError = (title: string, message: string) => {
    notifications.show({
      title,
      message,
      color: 'red',
      icon: <AlertTriangle size={18} />,
    });
  };

  const showInfo = (title: string, message: string) => {
    notifications.show({
      title,
      message,
      color: 'blue',
      icon: <Info size={18} />,
    });
  };

  return { showSuccess, showError, showInfo };
};
