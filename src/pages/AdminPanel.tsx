import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminPanel = () => {
  const { userProfile } = useAuth();

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">
            Admin Panel
          </h1>
          <p className="font-inter text-gray-600 mt-2">
            Manage bookings, photos, and client interactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-playfair text-xl font-semibold mb-4">All Bookings</h3>
            <p className="font-inter text-gray-600">View and manage all client bookings</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-playfair text-xl font-semibold mb-4">Photo Management</h3>
            <p className="font-inter text-gray-600">Upload and organize client photos</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-playfair text-xl font-semibold mb-4">Client Selections</h3>
            <p className="font-inter text-gray-600">View photo selections for printing</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="font-playfair text-xl font-semibold mb-4">Export Data</h3>
            <p className="font-inter text-gray-600">Generate Excel reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;