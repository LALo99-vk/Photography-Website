import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Calendar, Clock, MapPin, Package, Download, Eye, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase/config';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Booking {
  id: number;
  event_type: string;
  package_type: string;
  event_date: string;
  event_time: string;
  location: string;
  duration: number;
  guest_count: number | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'could_not_do';
  total_amount: number | null;
  created_at: string;
  additional_services?: any;
  special_requests?: string;
  status_reason?: string | null;
  status_notes?: string | null;
}

interface Photo {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  upload_date: string;
  is_featured: boolean;
}

const Dashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [bookingPhotos, setBookingPhotos] = useState<{ [key: number]: Photo[] }>({});
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchBookings();
    }
  }, [currentUser]);

  // Refresh bookings when component becomes visible (e.g., after navigation)
  useEffect(() => {
    if (!currentUser) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        fetchBookings();
      }
    };
    
    const handleFocus = () => {
      if (currentUser) {
        fetchBookings();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Get session token - try localStorage first (faster)
      let session;
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        if (supabaseUrl) {
          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
          const storageKey = `sb-${projectRef}-auth-token`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed?.access_token && parsed?.expires_at) {
              const expiresAt = parsed.expires_at * 1000;
              const now = Date.now();
              
              if (now < expiresAt) {
                session = {
                  access_token: parsed.access_token,
                  user: currentUser
                };
              }
            }
          }
        }
      } catch (storageErr) {
        console.log('Could not get session from localStorage:', storageErr);
      }
      
      // Fallback to getSession if localStorage didn't work
      if (!session) {
        try {
          const sessionResult = await supabase.auth.getSession();
          session = sessionResult.data?.session;
        } catch (sessionErr) {
          console.error('Error getting session:', sessionErr);
          setLoading(false);
          return;
        }
      }
      
      if (!session || !session.access_token) {
        console.error('No valid session found');
        setLoading(false);
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('Fetching bookings for user:', currentUser?.id);
      const response = await fetch(`${API_URL}/api/bookings/user/${currentUser?.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch bookings:', response.status, errorText);
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json();
      console.log('Bookings fetched:', data?.length || 0, 'bookings');
      // Filter out deleted bookings from user view
      const activeBookings = (data || []).filter((booking: Booking) => booking.status !== 'deleted');
      setBookings(activeBookings);

      // Fetch photos for completed/confirmed bookings
      for (const booking of data || []) {
        if (booking.status === 'completed' || booking.status === 'confirmed') {
          await fetchBookingPhotos(booking.id, session.access_token);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingPhotos = async (bookingId: number, token: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/photos/booking/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const photos = await response.json();
        setBookingPhotos(prev => ({
          ...prev,
          [bookingId]: photos || []
        }));
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white border-2 border-yellow-600 shadow-md';
      case 'confirmed':
        return 'bg-blue-500 text-white border-2 border-blue-600 shadow-md';
      case 'completed':
        return 'bg-green-500 text-white border-2 border-green-600 shadow-md';
      case 'could_not_do':
        return 'bg-red-500 text-white border-2 border-red-600 shadow-md';
      case 'cancelled':
        return 'bg-gray-500 text-white border-2 border-gray-600 shadow-md';
      default:
        return 'bg-gray-400 text-white border-2 border-gray-500 shadow-md';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Awaiting Confirmation';
      case 'confirmed':
        return '✅ Confirmed';
      case 'completed':
        return '✨ Completed';
      case 'could_not_do':
        return '❌ Could Not Do';
      case 'cancelled':
        return '🚫 Cancelled';
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  // Check if booking can be deleted (less than 1 hour old)
  const canDeleteBooking = (booking: Booking) => {
    const createdAt = new Date(booking.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 1;
  };

  // Check if booking can be edited (less than 1 hour old and not confirmed/completed)
  const canEditBooking = (booking: Booking) => {
    if (['confirmed', 'completed'].includes(booking.status)) {
      return false;
    }
    const createdAt = new Date(booking.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation < 1;
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      setDeleting(true);
      
      // Get session token
      let session;
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        if (supabaseUrl) {
          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
          const storageKey = `sb-${projectRef}-auth-token`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed?.access_token && parsed?.expires_at) {
              const expiresAt = parsed.expires_at * 1000;
              const now = Date.now();
              
              if (now < expiresAt) {
                session = { access_token: parsed.access_token };
              }
            }
          }
        }
      } catch (storageErr) {
        console.log('Could not get session from localStorage:', storageErr);
      }
      
      if (!session) {
        const sessionResult = await supabase.auth.getSession();
        session = sessionResult.data?.session;
      }

      if (!session || !session.access_token) {
        throw new Error('Not authenticated');
      }

      if (!deletionReason || deletionReason.trim() === '') {
        toast.error('Please provide a reason for deletion');
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/bookings/${bookingToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          deletionReason: deletionReason.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete booking');
      }

      toast.success('Booking deleted successfully');
      setBookingToDelete(null);
      setDeletionReason('');
      fetchBookings(); // Refresh the list
    } catch (error: any) {
      console.error('Delete booking error:', error);
      toast.error(error.message || 'Failed to delete booking');
    } finally {
      setDeleting(false);
    }
  };

  const generateBookingPDF = (booking: Booking) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Booking Details', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    let yPos = 40;
    
    doc.text(`Event Type: ${booking.event_type.charAt(0).toUpperCase() + booking.event_type.slice(1)}`, 20, yPos);
    yPos += 10;
    doc.text(`Date: ${new Date(booking.event_date).toLocaleDateString()}`, 20, yPos);
    yPos += 10;
    doc.text(`Time: ${booking.event_time}`, 20, yPos);
    yPos += 10;
    doc.text(`Location: ${booking.location}`, 20, yPos);
    yPos += 10;
    doc.text(`Duration: ${booking.duration} hours`, 20, yPos);
    yPos += 10;
    doc.text(`Package: ${booking.package_type.charAt(0).toUpperCase() + booking.package_type.slice(1)}`, 20, yPos);
    yPos += 10;
    doc.text(`Status: ${getStatusLabel(booking.status)}`, 20, yPos);
    if (booking.total_amount) {
      yPos += 10;
      doc.text(`Total Amount: ₹${booking.total_amount.toLocaleString('en-IN')}`, 20, yPos);
    }
    
    doc.save(`booking-${booking.id}.pdf`);
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">
            Welcome back, {userProfile?.display_name || 'User'}!
          </h1>
          <p className="font-inter text-gray-600 mt-2">
            Manage your bookings and account
          </p>
        </div>

        {/* Account Details Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-6">
            Account Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-copper-50 p-3 rounded-lg">
                <User className="h-6 w-6 text-copper-500" />
              </div>
              <div>
                <p className="font-inter text-sm text-gray-600">Full Name</p>
                <p className="font-inter font-semibold text-gray-900">
                  {userProfile?.display_name || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-copper-50 p-3 rounded-lg">
                <Mail className="h-6 w-6 text-copper-500" />
              </div>
              <div>
                <p className="font-inter text-sm text-gray-600">Email Address</p>
                <p className="font-inter font-semibold text-gray-900">
                  {userProfile?.email || currentUser?.email || 'Not set'}
                </p>
              </div>
            </div>

            {userProfile?.phone && (
              <div className="flex items-center space-x-4">
                <div className="bg-copper-50 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-copper-500" />
                </div>
                <div>
                  <p className="font-inter text-sm text-gray-600">Phone Number</p>
                  <p className="font-inter font-semibold text-gray-900">
                    {userProfile.phone}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="bg-copper-50 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-copper-500" />
              </div>
              <div>
                <p className="font-inter text-sm text-gray-600">Member Since</p>
                <p className="font-inter font-semibold text-gray-900">
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Bookings Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-playfair text-2xl font-bold text-gray-900">
              My Bookings
            </h2>
            <button
              onClick={() => window.location.href = '/booking'}
              className="px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter"
            >
              New Booking
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex space-x-4 mb-6 border-b">
            {[
              { id: 'all', label: 'All Bookings' },
              { id: 'pending', label: 'Pending' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'completed', label: 'Completed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-inter font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-copper-500 text-copper-500'
                    : 'text-gray-600 hover:text-copper-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="font-inter text-gray-600">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-inter text-gray-600 mb-4">No bookings found</p>
              <button
                onClick={() => window.location.href = '/booking'}
                className="px-6 py-3 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter"
              >
                Create Your First Booking
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-playfair text-xl font-bold text-gray-900 mb-2">
                            {booking.event_type.charAt(0).toUpperCase() + booking.event_type.slice(1)} Session
                          </h3>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-inter font-bold ${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-copper-500" />
                          <div>
                            <p className="font-inter text-xs text-gray-600">Event Date</p>
                            <p className="font-inter font-medium text-gray-900">
                              {new Date(booking.event_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-copper-500" />
                          <div>
                            <p className="font-inter text-xs text-gray-600">Time</p>
                            <p className="font-inter font-medium text-gray-900">{booking.event_time}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <MapPin className="h-5 w-5 text-copper-500" />
                          <div>
                            <p className="font-inter text-xs text-gray-600">Location</p>
                            <p className="font-inter font-medium text-gray-900 truncate">{booking.location}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Package className="h-5 w-5 text-copper-500" />
                          <div>
                            <p className="font-inter text-xs text-gray-600">Package</p>
                            <p className="font-inter font-medium text-gray-900">
                              {booking.package_type.charAt(0).toUpperCase() + booking.package_type.slice(1)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Photos Preview for Completed/Confirmed Bookings */}
                      {booking.status === 'completed' || booking.status === 'confirmed' ? (
                        <div className="mt-4">
                          {bookingPhotos[booking.id] && bookingPhotos[booking.id].length > 0 ? (
                            <div className="flex items-center space-x-2 mb-2">
                              <ImageIcon className="h-5 w-5 text-copper-500" />
                              <p className="font-inter text-sm font-medium text-gray-900">
                                {bookingPhotos[booking.id].length} Photos Available
                              </p>
                            </div>
                          ) : (
                            <p className="font-inter text-sm text-gray-500 italic">
                              Photos will be uploaded by the photographer after the session
                            </p>
                          )}
                        </div>
                      ) : booking.status === 'pending' ? (
                        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="font-inter text-sm text-yellow-800 font-medium">
                            ⏳ Your booking is awaiting confirmation from our team. We'll contact you soon!
                          </p>
                          {booking.status_notes && (
                            <div className="mt-3 pt-3 border-t border-yellow-200">
                              <p className="font-inter text-xs text-yellow-700 font-semibold mb-1">Message from Admin:</p>
                              <p className="font-inter text-sm text-yellow-900">{booking.status_notes}</p>
                            </div>
                          )}
                        </div>
                      ) : booking.status === 'could_not_do' ? (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="font-inter text-sm text-red-800 font-medium">
                            ❌ Unfortunately, we couldn't proceed with this booking.
                          </p>
                          {booking.status_reason && (
                            <p className="font-inter text-sm text-red-900 mt-2">
                              <span className="font-semibold">Reason:</span> {booking.status_reason.charAt(0).toUpperCase() + booking.status_reason.slice(1)}
                            </p>
                          )}
                          {booking.status_notes && (
                            <div className="mt-3 pt-3 border-t border-red-200">
                              <p className="font-inter text-xs text-red-700 font-semibold mb-1">Message from Admin:</p>
                              <p className="font-inter text-sm text-red-900">{booking.status_notes}</p>
                            </div>
                          )}
                        </div>
                      ) : booking.status === 'confirmed' && booking.status_notes ? (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="font-inter text-sm text-blue-800 font-medium">
                            ✅ Your booking has been confirmed!
                          </p>
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="font-inter text-xs text-blue-700 font-semibold mb-1">Message from Admin:</p>
                            <p className="font-inter text-sm text-blue-900">{booking.status_notes}</p>
                          </div>
                        </div>
                      ) : booking.status === 'completed' && booking.status_notes ? (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="font-inter text-sm text-green-800 font-medium">
                            ✨ Your session has been completed!
                          </p>
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="font-inter text-xs text-green-700 font-semibold mb-1">Message from Admin:</p>
                            <p className="font-inter text-sm text-green-900">{booking.status_notes}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col space-y-2 md:ml-4">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter text-sm flex items-center justify-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Details</span>
                      </button>
                      {canEditBooking(booking) && (
                        <button
                          onClick={() => setBookingToEdit(booking)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-inter text-sm flex items-center justify-center space-x-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      )}
                      {canDeleteBooking(booking) && (
                        <button
                          onClick={() => setBookingToDelete(booking)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-inter text-sm flex items-center justify-center space-x-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      )}
                      <button
                        onClick={() => generateBookingPDF(booking)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-inter text-sm flex items-center justify-center space-x-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          photos={bookingPhotos[selectedBooking.id] || []}
          onClose={() => setSelectedBooking(null)}
          onRefresh={fetchBookings}
        />
      )}

      {/* Edit Booking Modal */}
      {bookingToEdit && (
        <EditBookingModal
          booking={bookingToEdit}
          onClose={() => setBookingToEdit(null)}
          onSave={fetchBookings}
        />
      )}

      {/* Delete Confirmation Modal */}
      {bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-4">
              Delete Booking
            </h3>
            <p className="font-inter text-gray-600 mb-4">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                Reason for Deletion <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Please provide a reason for deleting this booking..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter resize-none"
                required
              />
              <p className="mt-1 text-xs text-gray-500 font-inter">
                This reason will be visible to administrators.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setBookingToDelete(null);
                  setDeletionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-inter"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBooking}
                disabled={deleting || !deletionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Booking Detail Modal Component
interface BookingDetailModalProps {
  booking: Booking;
  photos: Photo[];
  onClose: () => void;
  onRefresh: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, photos, onClose, onRefresh }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    if (photos.length === 0 && (booking.status === 'completed' || booking.status === 'confirmed')) {
      loadPhotos();
    }
  }, [booking.id]);

  const loadPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/photos/booking/${booking.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const fetchedPhotos = await response.json();
        // Update parent state would be better, but for now we'll handle it here
        onRefresh();
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white border-2 border-yellow-600 shadow-md';
      case 'confirmed':
        return 'bg-blue-500 text-white border-2 border-blue-600 shadow-md';
      case 'completed':
        return 'bg-green-500 text-white border-2 border-green-600 shadow-md';
      case 'could_not_do':
        return 'bg-red-500 text-white border-2 border-red-600 shadow-md';
      case 'cancelled':
        return 'bg-gray-500 text-white border-2 border-gray-600 shadow-md';
      default:
        return 'bg-gray-400 text-white border-2 border-gray-500 shadow-md';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Awaiting Confirmation';
      case 'confirmed':
        return '✅ Confirmed';
      case 'completed':
        return '✨ Completed';
      case 'could_not_do':
        return '❌ Could Not Do';
      case 'cancelled':
        return '🚫 Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
          <h2 className="font-playfair text-2xl font-bold text-gray-900">
            Booking Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-start">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-inter font-bold ${getStatusColor(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
          </div>

          {/* Booking Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-playfair text-xl font-semibold text-gray-900">Event Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-inter text-sm text-gray-600">Event Type</p>
                  <p className="font-inter font-medium text-gray-900">
                    {booking.event_type.charAt(0).toUpperCase() + booking.event_type.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="font-inter text-sm text-gray-600">Date</p>
                  <p className="font-inter font-medium text-gray-900">
                    {new Date(booking.event_date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="font-inter text-sm text-gray-600">Time</p>
                  <p className="font-inter font-medium text-gray-900">{booking.event_time}</p>
                </div>
                <div>
                  <p className="font-inter text-sm text-gray-600">Location</p>
                  <p className="font-inter font-medium text-gray-900">{booking.location}</p>
                </div>
                <div>
                  <p className="font-inter text-sm text-gray-600">Duration</p>
                  <p className="font-inter font-medium text-gray-900">{booking.duration} hours</p>
                </div>
                {booking.guest_count && (
                  <div>
                    <p className="font-inter text-sm text-gray-600">Guest Count</p>
                    <p className="font-inter font-medium text-gray-900">{booking.guest_count}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-playfair text-xl font-semibold text-gray-900">Package Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-inter text-sm text-gray-600">Package Type</p>
                  <p className="font-inter font-medium text-gray-900">
                    {booking.package_type.charAt(0).toUpperCase() + booking.package_type.slice(1)}
                  </p>
                </div>
                {booking.total_amount && (
                  <div>
                    <p className="font-inter text-sm text-gray-600">Total Amount</p>
                    <p className="font-inter font-medium text-gray-900 text-copper-500">
                      ₹{booking.total_amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {booking.additional_services && Array.isArray(booking.additional_services) && booking.additional_services.length > 0 && (
                  <div>
                    <p className="font-inter text-sm text-gray-600 mb-2">Additional Services</p>
                    <ul className="list-disc list-inside space-y-1">
                      {booking.additional_services.map((service: string, index: number) => (
                        <li key={index} className="font-inter text-sm text-gray-900">{service}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {booking.special_requests && (
                  <div>
                    <p className="font-inter text-sm text-gray-600">Special Requests</p>
                    <p className="font-inter text-sm text-gray-900">{booking.special_requests}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photos Section */}
          {(booking.status === 'completed' || booking.status === 'confirmed') && (
            <div className="border-t pt-6">
              <h3 className="font-playfair text-xl font-semibold text-gray-900 mb-4">
                Event Photos
              </h3>
              {loadingPhotos ? (
                <p className="font-inter text-gray-600">Loading photos...</p>
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                      onClick={() => setSelectedPhotoIndex(index)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.original_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="font-inter text-gray-600">
                    Photos will be uploaded by the photographer after the session
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status Messages */}
          {booking.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-inter text-sm text-yellow-800">
                ⏳ Your booking is awaiting confirmation from our team. We'll contact you within 24 hours to confirm your session.
              </p>
            </div>
          )}

          {booking.status === 'confirmed' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-inter text-sm text-blue-800">
                ✅ Your booking has been confirmed! We're looking forward to capturing your special moments.
              </p>
            </div>
          )}

          {booking.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-inter text-sm text-green-800">
                ✨ Your session has been completed! Browse through your photos above and select your favorites.
              </p>
            </div>
          )}

          {booking.status === 'could_not_do' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-inter text-sm text-red-800 font-medium">
                ❌ Unfortunately, we couldn't proceed with this booking. Our team will contact you with more details.
              </p>
              {booking.status_reason && (
                <p className="font-inter text-sm text-red-900 mt-2">
                  <span className="font-semibold">Reason:</span> {booking.status_reason.charAt(0).toUpperCase() + booking.status_reason.slice(1)}
                </p>
              )}
              {booking.status_notes && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="font-inter text-xs text-red-700 font-semibold mb-1">Message from Admin:</p>
                  <p className="font-inter text-sm text-red-900">{booking.status_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Show admin notes for other statuses if they exist */}
          {booking.status !== 'could_not_do' && booking.status_notes && (
            <div className={`border rounded-lg p-4 ${
              booking.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
              booking.status === 'confirmed' ? 'bg-blue-50 border-blue-200' :
              booking.status === 'completed' ? 'bg-green-50 border-green-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <p className={`font-inter text-xs font-semibold mb-2 ${
                booking.status === 'pending' ? 'text-yellow-700' :
                booking.status === 'confirmed' ? 'text-blue-700' :
                booking.status === 'completed' ? 'text-green-700' :
                'text-gray-700'
              }`}>
                📝 Message from Admin:
              </p>
              <p className={`font-inter text-sm ${
                booking.status === 'pending' ? 'text-yellow-900' :
                booking.status === 'confirmed' ? 'text-blue-900' :
                booking.status === 'completed' ? 'text-green-900' :
                'text-gray-900'
              }`}>
                {booking.status_notes}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Photo Lightbox */}
      {selectedPhotoIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
          onNext={() => setSelectedPhotoIndex(prev => prev !== null && prev < photos.length - 1 ? prev + 1 : prev)}
          onPrev={() => setSelectedPhotoIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)}
        />
      )}
    </div>
  );
};

// Photo Lightbox Component
interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ photos, currentIndex, onClose, onNext, onPrev }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  if (currentIndex === null || !photos[currentIndex]) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
      >
        ×
      </button>
      
      {currentIndex > 0 && (
        <button
          onClick={onPrev}
          className="absolute left-4 text-white text-4xl hover:text-gray-300 z-10"
        >
          ‹
        </button>
      )}

      <div className="max-w-7xl w-full h-full flex items-center justify-center">
        <img
          src={photos[currentIndex].url}
          alt={photos[currentIndex].original_name}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {currentIndex < photos.length - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 text-white text-4xl hover:text-gray-300 z-10"
        >
          ›
        </button>
      )}

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
        <p className="font-inter text-sm">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>
    </div>
  );
};

// Edit Booking Modal Component
interface EditBookingModalProps {
  booking: Booking;
  onClose: () => void;
  onSave: () => void;
}

const EditBookingModal: React.FC<EditBookingModalProps> = ({ booking, onClose, onSave }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventType: booking.event_type,
    packageType: booking.package_type,
    date: booking.event_date,
    time: booking.event_time,
    location: booking.location,
    duration: booking.duration.toString(),
    guestCount: booking.guest_count?.toString() || '',
    additionalServices: Array.isArray(booking.additional_services) ? booking.additional_services : [],
    specialRequests: booking.special_requests || '',
    budget: booking.budget_range || ''
  });

  const eventTypes = [
    { id: 'wedding', label: 'Wedding', description: 'Complete wedding day coverage' },
    { id: 'engagement', label: 'Engagement', description: 'Romantic couple session' },
    { id: 'portrait', label: 'Portrait', description: 'Individual or family portraits' },
    { id: 'event', label: 'Event', description: 'Corporate or private events' },
    { id: 'maternity', label: 'Maternity', description: 'Beautiful maternity session' },
    { id: 'newborn', label: 'Newborn', description: 'Precious newborn photography' }
  ];

  const [packageTypes, setPackageTypes] = useState([
    {
      id: 'essential',
      name: 'Essential',
      price: '₹1,50,000',
      duration: '6 hours',
      features: ['6 hours coverage', '300+ photos', 'Online gallery', '2 photographers']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '₹2,25,000',
      duration: '8 hours',
      features: ['8 hours coverage', '500+ photos', 'Online gallery', '2 photographers', 'Engagement session', 'Premium album'],
      popular: true
    },
    {
      id: 'luxury',
      name: 'Luxury',
      price: '₹3,00,000',
      duration: '10 hours',
      features: ['10 hours coverage', '700+ photos', 'Online gallery', '2 photographers', 'Engagement session', 'Premium album', 'Drone photography']
    }
  ]);

  const [additionalServices, setAdditionalServices] = useState([
    { id: 'drone', label: 'Drone Photography', price: '₹25,000' },
    { id: 'videography', label: 'Wedding Videography', price: '₹65,000' },
    { id: 'album', label: 'Premium Album', price: '₹40,000' },
    { id: 'prints', label: 'Print Package', price: '₹15,000' },
    { id: 'rush', label: 'Rush Delivery', price: '₹20,000' }
  ]);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/pricing`);
        if (!res.ok) throw new Error('Failed to load pricing');
        const data = await res.json();
        if (data?.packages?.length) {
          setPackageTypes(
            data.packages.map((p: any) => ({
              id: p.slug,
              name: p.name,
              price: `₹${Number(p.price).toLocaleString('en-IN')}`,
              duration: p.duration || '',
              features: Array.isArray(p.features) ? p.features : [],
              popular: p.slug === 'premium'
            }))
          );
        }
        if (data?.addons?.length) {
          setAdditionalServices(
            data.addons.map((a: any) => ({
              id: a.slug,
              label: a.name,
              price: `₹${Number(a.price).toLocaleString('en-IN')}`
            }))
          );
        }
      } catch (err) {
        console.warn('Pricing fetch failed, using defaults', err);
      }
    };
    fetchPricing();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(serviceId)
        ? prev.additionalServices.filter(id => id !== serviceId)
        : [...prev.additionalServices, serviceId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Calculate total amount
      const selectedPackage = packageTypes.find(p => p.id === formData.packageType);
      const basePrice = parseInt(selectedPackage?.price.replace(/[^0-9]/g, '') || '0');
      const additionalServicesTotal = formData.additionalServices.reduce((total: number, serviceId: string) => {
        const service = additionalServices.find(s => s.id === serviceId);
        return total + (parseInt(service?.price.replace(/[^0-9]/g, '') || '0'));
      }, 0);
      const totalAmount = basePrice + additionalServicesTotal;

      // Get session token
      let session;
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        if (supabaseUrl) {
          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
          const storageKey = `sb-${projectRef}-auth-token`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed?.access_token && parsed?.expires_at) {
              const expiresAt = parsed.expires_at * 1000;
              const now = Date.now();
              
              if (now < expiresAt) {
                session = { access_token: parsed.access_token };
              }
            }
          }
        }
      } catch (storageErr) {
        console.log('Could not get session from localStorage:', storageErr);
      }
      
      if (!session) {
        const sessionResult = await supabase.auth.getSession();
        session = sessionResult.data?.session;
      }

      if (!session || !session.access_token) {
        throw new Error('Not authenticated');
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          eventType: formData.eventType,
          packageType: formData.packageType,
          eventDate: formData.date,
          eventTime: formData.time,
          location: formData.location,
          duration: parseInt(formData.duration),
          guestCount: formData.guestCount ? parseInt(formData.guestCount) : null,
          additionalServices: formData.additionalServices,
          specialRequests: formData.specialRequests,
          budgetRange: formData.budget,
          totalAmount: totalAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }

      toast.success('Booking updated successfully');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Update booking error:', error);
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
          <h2 className="font-playfair text-2xl font-bold text-gray-900">
            Edit Booking
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
              Event Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {eventTypes.map((type) => (
                <label
                  key={type.id}
                  className={`relative cursor-pointer p-3 border-2 rounded-lg transition-colors ${
                    formData.eventType === type.id
                      ? 'border-copper-500 bg-copper-50'
                      : 'border-gray-200 hover:border-copper-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="eventType"
                    value={type.id}
                    checked={formData.eventType === type.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="font-inter text-sm font-semibold text-gray-900">{type.label}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                Event Date
              </label>
              <input
                type="date"
                name="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                Start Time
              </label>
              <input
                type="time"
                name="time"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
              Event Location
            </label>
            <input
              type="text"
              name="location"
              required
              placeholder="Enter venue name and address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          {/* Duration and Guest Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                Duration (hours)
              </label>
              <select
                name="duration"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                value={formData.duration}
                onChange={handleChange}
              >
                <option value="4">4 hours</option>
                <option value="6">6 hours</option>
                <option value="8">8 hours</option>
                <option value="10">10 hours</option>
                <option value="12">12+ hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                Estimated Guest Count
              </label>
              <input
                type="number"
                name="guestCount"
                placeholder="Number of guests"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                value={formData.guestCount}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Package Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
              Package
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packageTypes.map((pkg) => (
                <label
                  key={pkg.id}
                  className={`relative cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                    formData.packageType === pkg.id
                      ? 'border-copper-500 bg-copper-50'
                      : 'border-gray-200 hover:border-copper-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="packageType"
                    value={pkg.id}
                    checked={formData.packageType === pkg.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <h3 className="font-playfair text-lg font-bold text-gray-900 mb-1">
                      {pkg.name}
                    </h3>
                    <div className="text-xl font-bold text-copper-500 mb-1">
                      {pkg.price}
                    </div>
                    <div className="text-gray-600 font-inter text-sm">
                      {pkg.duration}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
              Additional Services
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {additionalServices.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.additionalServices.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="h-4 w-4 text-copper-500 focus:ring-copper-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-inter font-medium text-gray-900">
                      {service.label}
                    </div>
                    <div className="text-copper-500 font-semibold text-sm">
                      {service.price}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
              Special Requests
            </label>
            <textarea
              name="specialRequests"
              rows={3}
              placeholder="Any special requirements or requests..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
              value={formData.specialRequests}
              onChange={handleChange}
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-inter disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Dashboard;
