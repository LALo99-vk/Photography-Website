import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, User, Mail, Phone, Calendar, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/config';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
}

interface Booking {
  id: number;
  event_type: string;
  event_date: string;
  status: string;
  total_amount: number | null;
  created_at: string;
}

const UserManagement = () => {
  const { id } = useParams<{ id?: string }>();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      fetchUserDetails(id);
    } else {
      fetchUsers();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      setSelectedUser(data.user);
      setUserBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    );
  });

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

  // User Detail View
  if (id && selectedUser) {
    return (
      <div>
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-inter"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Users
        </button>

        <div className="mb-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
            User Details
          </h1>
          <p className="font-inter text-gray-600">
            View user information and booking history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-4">
                User Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="font-inter text-sm text-gray-600 mb-1">Full Name</p>
                  <p className="font-inter font-medium text-gray-900">
                    {selectedUser.display_name}
                  </p>
                </div>
                <div>
                  <p className="font-inter text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-inter font-medium text-gray-900">
                    {selectedUser.email}
                  </p>
                </div>
                {selectedUser.phone && (
                  <div>
                    <p className="font-inter text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-inter font-medium text-gray-900">
                      {selectedUser.phone}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-inter text-sm text-gray-600 mb-1">Role</p>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-inter font-medium bg-copper-100 text-copper-800">
                    {selectedUser.role}
                  </span>
                </div>
                <div>
                  <p className="font-inter text-sm text-gray-600 mb-1">Member Since</p>
                  <p className="font-inter font-medium text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bookings */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-lg p-6"
            >
              <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-4">
                Booking History ({userBookings.length})
              </h2>
              {userBookings.length === 0 ? (
                <p className="font-inter text-gray-600 text-center py-8">
                  No bookings found for this user
                </p>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      to={`/admin/bookings/${booking.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-playfair text-lg font-semibold text-gray-900">
                              {booking.event_type.charAt(0).toUpperCase() + booking.event_type.slice(1)} Session
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-inter font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {new Date(booking.event_date).toLocaleDateString('en-IN')}
                            </div>
                            {booking.total_amount && (
                              <div className="flex items-center">
                                <span className="font-medium">₹{booking.total_amount.toLocaleString('en-IN')}</span>
                              </div>
                            )}
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
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Users List View
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="font-inter text-gray-600">
          View and manage all registered users
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="font-inter text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-inter text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                    Member Since
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-inter font-medium text-gray-900">
                            {user.display_name}
                          </p>
                          <p className="font-inter text-sm text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'photographer' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(user.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="inline-block px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;

