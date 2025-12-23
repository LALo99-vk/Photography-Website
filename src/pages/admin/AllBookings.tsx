import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, Package, User, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/config';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Booking {
  id: number;
  event_type: string;
  package_type: string;
  event_date: string;
  event_time: string;
  location: string;
  status: string;
  total_amount: number | null;
  created_at: string;
  deleted_at?: string | null;
  deletion_reason?: string | null;
  deleted_by?: string | null;
  profiles: {
    display_name: string;
    email: string;
    phone: string;
  };
}

const AllBookings = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [eventTypeFilter, setEventTypeFilter] = useState(searchParams.get('eventType') || '');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, eventTypeFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (statusFilter) params.append('status', statusFilter);
      if (eventTypeFilter) params.append('eventType', eventTypeFilter);

      const response = await fetch(`${API_URL}/api/admin/bookings?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch bookings');

      const data = await response.json();
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
      setSearchParams({ ...Object.fromEntries(searchParams), status: value, page: '1' });
      setPage(1);
    } else if (filterType === 'eventType') {
      setEventTypeFilter(value);
      setSearchParams({ ...Object.fromEntries(searchParams), eventType: value, page: '1' });
      setPage(1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search will be implemented on backend if needed
    fetchBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deleted':
        return 'bg-gray-100 text-gray-800';
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

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.profiles?.display_name?.toLowerCase().includes(query) ||
      booking.profiles?.email?.toLowerCase().includes(query) ||
      booking.id.toString().includes(query) ||
      booking.location.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
          All Bookings
        </h1>
        <p className="font-inter text-gray-600">
          Manage and view all booking requests
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="could_not_do">Could Not Do</option>
                <option value="cancelled">Cancelled</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div>
              <select
                value={eventTypeFilter}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
              >
                <option value="">All Event Types</option>
                <option value="wedding">Wedding</option>
                <option value="engagement">Engagement</option>
                <option value="portrait">Portrait</option>
                <option value="event">Event</option>
                <option value="maternity">Maternity</option>
                <option value="newborn">Newborn</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="font-inter text-gray-600">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-inter text-gray-600">No bookings found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Event Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-inter font-semibold text-gray-900">#{booking.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="font-inter font-medium text-gray-900">
                              {booking.profiles?.display_name || 'N/A'}
                            </p>
                            <p className="font-inter text-sm text-gray-500">
                              {booking.profiles?.email || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-inter text-sm font-medium text-gray-900">
                            {booking.event_type.charAt(0).toUpperCase() + booking.event_type.slice(1)}
                          </p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className="font-inter">
                              {new Date(booking.event_date).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="font-inter truncate max-w-xs">{booking.location}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-inter text-sm text-gray-900">
                            {booking.package_type.charAt(0).toUpperCase() + booking.package_type.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                          {booking.status === 'deleted' && booking.deletion_reason && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-600 font-inter">
                                <span className="font-semibold">Reason:</span> {booking.deletion_reason}
                              </p>
                              {booking.deleted_at && (
                                <p className="text-xs text-gray-500 font-inter">
                                  Deleted: {new Date(booking.deleted_at).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-inter text-sm text-gray-900">
                          {booking.total_amount ? `₹${booking.total_amount.toLocaleString('en-IN')}` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/admin/bookings/${booking.id}`}
                          className="inline-flex items-center px-3 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter text-sm"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="font-inter text-sm text-gray-700">
                  Showing page {page} of {totalPages} (Total: {total} bookings)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-inter text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-inter text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllBookings;

