import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { userProfile } = useAuth();

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">
            Welcome back, {userProfile?.displayName}!
          </h1>
          <p className="font-inter text-gray-600 mt-2">
            Role: {userProfile?.role}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-playfair text-xl font-semibold mb-4">My Bookings</h3>
            <p className="font-inter text-gray-600">View and manage your photo sessions</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-playfair text-xl font-semibold mb-4">My Photos</h3>
            <p className="font-inter text-gray-600">Browse and select your favorite photos</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-playfair text-xl font-semibold mb-4">Profile Settings</h3>
            <p className="font-inter text-gray-600">Update your account information</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;