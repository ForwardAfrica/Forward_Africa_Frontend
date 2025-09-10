import React from 'react';
import { useNavigate } from '../lib/router';
import { Shield, ArrowLeft, Home, User } from 'lucide-react';
import Button from '../components/ui/Button';
import Layout from '../components/layout/Layout';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-500/10 p-4 rounded-full inline-block mb-6">
            <Shield className="h-12 w-12 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>

          <div className="space-y-4">
            <Button
              variant="primary"
              onClick={() => navigate('/home')}
              className="w-full flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-center"
            >
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UnauthorizedPage;