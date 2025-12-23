import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/config';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  could_not_do: number;
  cancelled: number;
}

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    could_not_do: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/bookings?page=1&limit=5`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch bookings');

      const data = await response.json();
      setRecentBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  const statCards = [
    {
      label: 'Total Bookings',
      value: stats.total,
      icon: Calendar,
      color: 'bg-blue-500',
      link: '/admin/bookings'
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      link: '/admin/bookings?status=pending'
    },
    {
      label: 'Confirmed',
      value: stats.confirmed,
      icon: CheckCircle,
      color: 'bg-green-500',
      link: '/admin/bookings?status=confirmed'
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: TrendingUp,
      color: 'bg-purple-500',
      link: '/admin/bookings?status=completed'
    },
    {
      label: 'Could Not Do',
      value: stats.could_not_do,
      icon: XCircle,
      color: 'bg-red-500',
      link: '/admin/bookings?status=could_not_do'
    },
    {
      label: 'Cancelled',
      value: stats.cancelled,
      icon: AlertCircle,
      color: 'bg-gray-500',
      link: '/admin/bookings?status=cancelled'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'could_not_do':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-inter text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="font-inter text-gray-600">
          Overview of all bookings and system statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-inter text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="font-playfair text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-2xl font-bold text-gray-900">Recent Bookings</h2>
          <Link
            to="/admin/bookings"
            className="font-inter text-copper-600 hover:text-copper-700 font-medium"
          >
            View All →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="font-inter text-gray-600 text-center py-8">No bookings yet</p>
        ) : (
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <Link
                key={booking.id}
                to={`/admin/bookings/${booking.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-playfair text-lg font-semibold text-gray-900">
                        {booking.event_type.charAt(0).toUpperCase() + booking.event_type.slice(1)} Session
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-inter font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <p className="font-inter">
                        <span className="font-medium">User:</span> {booking.profiles?.display_name || 'N/A'}
                      </p>
                      <p className="font-inter">
                        <span className="font-medium">Date:</span> {new Date(booking.event_date).toLocaleDateString('en-IN')}
                      </p>
                      <p className="font-inter">
                        <span className="font-medium">Package:</span> {booking.package_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-inter text-sm text-gray-600">Booking ID</p>
                    <p className="font-inter font-semibold text-gray-900">#{booking.id}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

