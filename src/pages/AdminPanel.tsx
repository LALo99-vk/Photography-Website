import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AllBookings from './admin/AllBookings';
import BookingDetail from './admin/BookingDetail';
import UserManagement from './admin/UserManagement';
import AdminManagement from './admin/AdminManagement';
import Pricing from './admin/Pricing';

const AdminPanel = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="bookings" element={<AllBookings />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="users/:id" element={<UserManagement />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminPanel;
