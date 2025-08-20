import {notifications} from '@mantine/notifications';
import {IconCheck, IconX} from '@tabler/icons-react';

export const useAppNotifications = () => {
  const showSuccess = (title, message) => {
    notifications.show({
      title,
      message,
      color: 'teal',
      icon: <IconCheck size={18} />,
    });
  };

  const showError = (title, message) => {
    notifications.show({
      title,
      message,
      color: 'red',
      icon: <IconX size={18} />,
    });
  };
  
  const handleError = (error, defaultTitle = 'An error occurred') => {
    const message = error.response?.data?.message || error.message || 'Something went wrong.';
    showError(defaultTitle, message);
  }

  return { showSuccess, showError, handleError };
};
