import React from 'react';
import {useAdminStore} from '@/stores/adminStore';
import {AdminLogin} from './AdminLogin';
import {AdminDashboard} from './AdminDashboard';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated } = useAdminStore();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
};