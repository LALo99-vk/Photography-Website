import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Package, User, Mail, Phone, DollarSign, FileText, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/config';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import StatusUpdateForm from '../../components/StatusUpdateForm';

interface Booking {
  id: number;
  event_type: string;
  package_type: string;
  event_date: string;
  event_time: string;
  location: string;
  duration: number;
  guest_count: number | null;
  status: string;
  status_reason: string | null;
  status_notes: string | null;
  status_updated_at: string | null;
  deleted_at: string | null;
  deletion_reason: string | null;
  deleted_by: string | null;
  total_amount: number | null;
  additional_services: any;
  special_requests: string | null;
  created_at: string;
  profiles: {
    id: string;
    display_name: string;
    email: string;
    phone: string;
    created_at: string;
  };
  status_updated_by_profile?: {
    display_name: string;
    email: string;
  };
}

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusForm, setShowStatusForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/bookings/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch booking');

      const data = await response.json();
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
      navigate('/admin/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string, reason?: string, notes?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${API_URL}/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status, reason, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update status');
    }

    // Refresh booking data
    await fetchBooking();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-inter text-gray-600">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="font-inter text-gray-600 mb-4">Booking not found</p>
        <Link
          to="/admin/bookings"
          className="inline-block px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/bookings')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 font-inter"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Bookings
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
              Booking Details
            </h1>
            <p className="font-inter text-gray-600">
              Booking ID: #{booking.id}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-full text-sm font-inter font-medium ${getStatusColor(booking.status)}`}>
              {booking.status.replace('_', ' ')}
            </span>
            {!showStatusForm && (
              <button
                onClick={() => setShowStatusForm(true)}
                className="flex items-center px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter"
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Form - Always Visible */}
      <div className="mb-6">
        {showStatusForm ? (
          <StatusUpdateForm
            currentStatus={booking.status}
            bookingId={booking.id}
            onStatusUpdate={handleStatusUpdate}
            onCancel={() => setShowStatusForm(false)}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-playfair text-xl font-bold text-gray-900 mb-2">
                  Booking Status Management
                </h3>
                <p className="font-inter text-sm text-gray-600">
                  Current Status: <span className={`inline-block px-3 py-1 rounded-full text-sm font-inter font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('_', ' ')}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowStatusForm(true)}
                className="flex items-center px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter"
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info & Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-4">
              User Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-copper-500" />
                <div>
                  <p className="font-inter text-sm text-gray-600">Full Name</p>
                  <p className="font-inter font-medium text-gray-900">
                    {booking.profiles?.display_name || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-copper-500" />
                <div>
                  <p className="font-inter text-sm text-gray-600">Email</p>
                  <p className="font-inter font-medium text-gray-900">
                    {booking.profiles?.email || 'N/A'}
                  </p>
                </div>
              </div>
              {booking.profiles?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-copper-500" />
                  <div>
                    <p className="font-inter text-sm text-gray-600">Phone</p>
                    <p className="font-inter font-medium text-gray-900">
                      {booking.profiles.phone}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-copper-500" />
                <div>
                  <p className="font-inter text-sm text-gray-600">Member Since</p>
                  <p className="font-inter font-medium text-gray-900">
                    {booking.profiles?.created_at
                      ? new Date(booking.profiles.created_at).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to={`/admin/users/${booking.profiles?.id}`}
                className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-inter text-sm"
              >
                View All Bookings for This User
              </Link>
            </div>
          </motion.div>

          {/* Booking Details - Same format as user sees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-6">
              Complete Booking Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="font-playfair text-xl font-semibold text-gray-900">Event Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="font-inter">
                    <span className="font-semibold">Event Type:</span> {booking.event_type.charAt(0).toUpperCase() + booking.event_type.slice(1)}
                  </p>
                  <p className="font-inter">
                    <span className="font-semibold">Date:</span> {new Date(booking.event_date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="font-inter">
                    <span className="font-semibold">Time:</span> {booking.event_time}
                  </p>
                  <p className="font-inter">
                    <span className="font-semibold">Location:</span> {booking.location}
                  </p>
                  <p className="font-inter">
                    <span className="font-semibold">Duration:</span> {booking.duration} hours
                  </p>
                  {booking.guest_count && (
                    <p className="font-inter">
                      <span className="font-semibold">Guest Count:</span> {booking.guest_count}
                    </p>
                  )}
                </div>
              </div>

              {/* Package Details */}
              <div className="space-y-4">
                <h3 className="font-playfair text-xl font-semibold text-gray-900">Package Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {(() => {
                    const packageTypes = [
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
                        features: ['8 hours coverage', '500+ photos', 'Online gallery', '2 photographers', 'Engagement session', 'Premium album']
                      },
                      {
                        id: 'luxury',
                        name: 'Luxury',
                        price: '₹3,00,000',
                        duration: '10 hours',
                        features: ['10 hours coverage', '700+ photos', 'Online gallery', '2 photographers', 'Engagement session', 'Premium album', 'Drone photography']
                      }
                    ];
                    const selectedPackage = packageTypes.find(p => p.id === booking.package_type);
                    return (
                      <>
                        <p className="font-inter">
                          <span className="font-semibold">Package:</span> {selectedPackage?.name || booking.package_type.charAt(0).toUpperCase() + booking.package_type.slice(1)}
                        </p>
                        <p className="font-inter">
                          <span className="font-semibold">Price:</span> {selectedPackage?.price || 'N/A'}
                        </p>
                        <p className="font-inter">
                          <span className="font-semibold">Duration:</span> {selectedPackage?.duration || `${booking.duration} hours`}
                        </p>
                        {selectedPackage && (
                          <div className="mt-2">
                            <p className="font-semibold font-inter mb-1">Features:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {selectedPackage.features.map((feature, index) => (
                                <li key={index} className="font-inter text-sm text-gray-600">{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Additional Services */}
              {booking.additional_services && Array.isArray(booking.additional_services) && booking.additional_services.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-playfair text-xl font-semibold text-gray-900">Additional Services</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {(() => {
                    const additionalServices = [
                      { id: 'drone', label: 'Drone Photography', price: '₹25,000' },
                      { id: 'videography', label: 'Wedding Videography', price: '₹65,000' },
                      { id: 'album', label: 'Premium Album', price: '₹40,000' },
                      { id: 'prints', label: 'Print Package', price: '₹15,000' },
                      { id: 'rush', label: 'Rush Delivery', price: '₹20,000' }
                    ];
                      return booking.additional_services.map((serviceId: string, index: number) => {
                        const service = additionalServices.find(s => s.id === serviceId);
                        return service ? (
                          <p key={index} className="font-inter">
                            <span className="font-semibold">{service.label}:</span> {service.price}
                          </p>
                        ) : (
                          <p key={index} className="font-inter">
                            <span className="font-semibold">Service:</span> {serviceId}
                          </p>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-playfair text-xl font-semibold text-gray-900">Personal Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="font-inter">
                    <span className="font-semibold">Name:</span> {booking.profiles?.display_name || 'N/A'}
                  </p>
                  <p className="font-inter">
                    <span className="font-semibold">Email:</span> {booking.profiles?.email || 'N/A'}
                  </p>
                  <p className="font-inter">
                    <span className="font-semibold">Phone:</span> {booking.profiles?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Special Requests */}
              {booking.special_requests && (
                <div className="space-y-4">
                  <h3 className="font-playfair text-xl font-semibold text-gray-900">Special Requests</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-inter text-gray-600">{booking.special_requests}</p>
                  </div>
                </div>
              )}

              {/* Total Price Breakdown */}
              <div className="space-y-4">
                <h3 className="font-playfair text-xl font-semibold text-gray-900">Total Price</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {(() => {
                    const packageTypes = [
                      { id: 'essential', price: '₹1,50,000' },
                      { id: 'premium', price: '₹2,25,000' },
                      { id: 'luxury', price: '₹3,00,000' }
                    ];
                    const additionalServices = [
                      { id: 'drone', price: '₹25,000' },
                      { id: 'videography', price: '₹65,000' },
                      { id: 'album', price: '₹40,000' },
                      { id: 'prints', price: '₹15,000' },
                      { id: 'rush', price: '₹20,000' }
                    ];
                    const selectedPackage = packageTypes.find(p => p.id === booking.package_type);
                    const basePrice = parseInt(selectedPackage?.price.replace(/[^0-9]/g, '') || '0');
                    const additionalServicesTotal = booking.additional_services && Array.isArray(booking.additional_services)
                      ? booking.additional_services.reduce((total: number, serviceId: string) => {
                          const service = additionalServices.find(s => s.id === serviceId);
                          return total + (parseInt(service?.price.replace(/[^0-9]/g, '') || '0'));
                        }, 0)
                      : 0;
                    const totalPrice = basePrice + additionalServicesTotal;
                    
                    return (
                      <div className="space-y-2">
                        <p className="font-inter">
                          <span className="font-semibold">Base Package:</span> ₹{basePrice.toLocaleString('en-IN')}
                        </p>
                        {additionalServicesTotal > 0 && (
                          <p className="font-inter">
                            <span className="font-semibold">Additional Services:</span> ₹{additionalServicesTotal.toLocaleString('en-IN')}
                          </p>
                        )}
                        <p className="text-lg font-bold text-copper-500 font-inter">
                          Total: ₹{totalPrice.toLocaleString('en-IN')}
                        </p>
                        {booking.total_amount && booking.total_amount !== totalPrice && (
                          <p className="text-sm text-gray-500 font-inter">
                            (Stored amount: ₹{booking.total_amount.toLocaleString('en-IN')})
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Status & Payment Info */}
        <div className="space-y-6">
          {/* Status Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="font-playfair text-xl font-bold text-gray-900 mb-4">
              Status Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="font-inter text-sm text-gray-600 mb-1">Current Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-inter font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.replace('_', ' ')}
                </span>
              </div>
              
              {/* Deletion Information */}
              {booking.status === 'deleted' && booking.deletion_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-inter text-sm font-semibold text-red-800 mb-2">
                    🗑️ Booking Deleted by User
                  </p>
                  <p className="font-inter text-sm text-red-900 mb-1">
                    <span className="font-semibold">Reason:</span> {booking.deletion_reason}
                  </p>
                  {booking.deleted_at && (
                    <p className="font-inter text-xs text-red-700">
                      Deleted on: {new Date(booking.deleted_at).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              )}
              
              {booking.status_reason && booking.status !== 'deleted' && (
                <div>
                  <p className="font-inter text-sm text-gray-600 mb-1">Reason</p>
                  <p className="font-inter text-sm text-gray-900 capitalize">
                    {booking.status_reason}
                  </p>
                </div>
              )}
              {booking.status_notes && (
                <div>
                  <p className="font-inter text-sm text-gray-600 mb-1">Notes</p>
                  <p className="font-inter text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {booking.status_notes}
                  </p>
                </div>
              )}
              {booking.status_updated_at && (
                <div>
                  <p className="font-inter text-sm text-gray-600 mb-1">Last Updated</p>
                  <p className="font-inter text-sm text-gray-900">
                    {new Date(booking.status_updated_at).toLocaleString('en-IN')}
                  </p>
                  {booking.status_updated_by_profile && (
                    <p className="font-inter text-xs text-gray-500 mt-1">
                      by {booking.status_updated_by_profile.display_name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Payment Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="font-playfair text-xl font-bold text-gray-900 mb-4">
              Payment Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-inter text-sm text-gray-600">Total Amount</span>
                <span className="font-inter font-semibold text-gray-900 text-lg">
                  {booking.total_amount ? `₹${booking.total_amount.toLocaleString('en-IN')}` : 'N/A'}
                </span>
              </div>
              <div>
                <p className="font-inter text-sm text-gray-600 mb-1">Booking Created</p>
                <p className="font-inter text-sm text-gray-900">
                  {new Date(booking.created_at).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;

