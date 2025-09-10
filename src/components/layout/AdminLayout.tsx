import React from 'react';
import Header from './Header';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout: React.FC = () => {
  const { signOut } = useAuth();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-900 text-white pt-16">
        <main className="p-10 overflow-auto">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default AdminLayout;