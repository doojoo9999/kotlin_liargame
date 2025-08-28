import {notifications} from '@mantine/notifications';

export const useNotifications = () => {
  const showSuccess = (title: string, message: string) => {
    notifications.show({
      title,
      message,
      color: 'green',
      autoClose: 3000,
    });
  };

  const showError = (title: string, message: string) => {
    notifications.show({
      title,
      message,
      color: 'red',
      autoClose: 5000,
    });
  };

  const showInfo = (title: string, message: string) => {
    notifications.show({
      title,
      message,
      color: 'blue',
      autoClose: 4000,
    });
  };

  const showWarning = (title: string, message: string) => {
    notifications.show({
      title,
      message,
      color: 'yellow',
      autoClose: 4000,
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};
