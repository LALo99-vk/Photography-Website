import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Mail, Phone, MessageSquare, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/config';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Booking = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: 'wedding',
    packageType: 'premium',
    date: '',
    time: '',
    location: '',
    duration: '8',
    guestCount: '',
    additionalServices: [] as string[],
    specialRequests: '',
    budget: ''
  });

  const [step, setStep] = useState(1);

  // Redirect to login if not authenticated (after auth loading is complete)
  useEffect(() => {
    if (!authLoading && !currentUser) {
      toast.error('Please log in to make a booking');
      navigate('/login');
    }
  }, [currentUser, navigate, authLoading]);

  // Pre-fill form with user's details when they're available
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.display_name || prev.name,
        email: userProfile.email || prev.email,
        phone: userProfile.phone || prev.phone,
      }));
    } else if (currentUser?.email) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || prev.email,
      }));
    }
  }, [userProfile, currentUser]);

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

  const [pricingLoading, setPricingLoading] = useState(false);

  const eventTypes = [
    { id: 'wedding', label: 'Wedding', description: 'Complete wedding day coverage' },
    { id: 'engagement', label: 'Engagement', description: 'Romantic couple session' },
    { id: 'portrait', label: 'Portrait', description: 'Individual or family portraits' },
    { id: 'event', label: 'Event', description: 'Corporate or private events' },
    { id: 'maternity', label: 'Maternity', description: 'Beautiful maternity session' },
    { id: 'newborn', label: 'Newborn', description: 'Precious newborn photography' }
  ];

  // Fetch pricing from backend
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setPricingLoading(true);
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
      } finally {
        setPricingLoading(false);
      }
    };
    fetchPricing();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for phone number to ensure only digits
    if (name === 'phone') {
      const phoneValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({
        ...formData,
        [name]: phoneValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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
    console.log('Form submitted!', { step, formData });
    
    // Check if user is logged in
    if (!currentUser) {
      console.error('No current user');
      toast.error('Please log in to make a booking');
      navigate('/login');
      return;
    }

    // Only validate phone if it's provided and not empty
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        console.error('Invalid phone number:', formData.phone);
        toast.error('Please enter a valid 10-digit Indian mobile number (starting with 6-9)');
        return;
      }
    }

    console.log('Starting booking submission...');
    setLoading(true);

    try {
      console.log('Step 1: Calculating total amount...');
      // Calculate total amount
      const selectedPackage = packageTypes.find(p => p.id === formData.packageType);
      console.log('Selected package:', selectedPackage);
      const basePrice = parseInt(selectedPackage?.price.replace(/[^0-9]/g, '') || '0');
      console.log('Base price:', basePrice);
      const additionalServicesTotal = formData.additionalServices.reduce((total: number, serviceId: string) => {
        const service = additionalServices.find(s => s.id === serviceId);
        return total + (parseInt(service?.price.replace(/[^0-9]/g, '') || '0'));
      }, 0);
      console.log('Additional services total:', additionalServicesTotal);
      const totalAmount = basePrice + additionalServicesTotal;
      console.log('Total amount:', totalAmount);

      console.log('Step 2: Getting auth session...');
      
      if (!currentUser) {
        console.error('No currentUser available');
        throw new Error('Not authenticated. Please log in again.');
      }
      
      // Get auth token - try localStorage first (faster, no network call)
      let session, sessionError;
      console.log('Getting session token...');
      
      // Approach 1: Try to get from localStorage directly (fastest)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        if (supabaseUrl) {
          // Supabase stores session in localStorage with key pattern: sb-{project-ref}-auth-token
          const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
          const storageKey = `sb-${projectRef}-auth-token`;
          const storedData = localStorage.getItem(storageKey);
          
          if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed?.access_token && parsed?.expires_at) {
              // Check if token is still valid (not expired)
              const expiresAt = parsed.expires_at * 1000; // Convert to milliseconds
              const now = Date.now();
              
              if (now < expiresAt) {
                console.log('Found valid session in localStorage');
                session = {
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token,
                  expires_at: parsed.expires_at,
                  expires_in: parsed.expires_in,
                  token_type: parsed.token_type,
                  user: currentUser
                };
                sessionError = null;
              } else {
                console.log('Session in localStorage is expired, refreshing...');
              }
            }
          }
        }
      } catch (storageErr) {
        console.log('Could not get session from localStorage:', storageErr);
      }
      
      // Approach 2: If localStorage didn't work, try getSession() with timeout
      if (!session) {
        console.log('Trying getSession() API...');
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 2000);
          });
          
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          const sessionData = result as { data: { session: any } | null; error: any };
          session = sessionData?.data?.session;
          sessionError = sessionData?.error;
          console.log('Session retrieved via getSession():', { hasSession: !!session, error: sessionError });
        } catch (err: any) {
          console.error('getSession() failed or timed out:', err);
          // If getSession fails, we already tried localStorage, so throw error
          throw new Error('Failed to get authentication session. Please refresh the page and log in again.');
        }
      }
      
      if (sessionError || !session) {
        console.error('Session error or missing:', { sessionError, hasSession: !!session });
        throw new Error('Not authenticated. Please log in again.');
      }
      
      if (!session.access_token) {
        console.error('Session exists but no access token');
        throw new Error('Invalid session. Please log in again.');
      }
      
      console.log('Step 3: Session obtained, making API call...');
      console.log('Session token exists:', !!session.access_token);

      // Submit booking to backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      console.log('API URL:', API_URL);
      
      // Quick health check to verify server is reachable
      try {
        console.log('Checking server health...');
        const healthCheck = await fetch(`${API_URL}/api/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout for health check
        });
        console.log('Health check response:', healthCheck.status);
        if (!healthCheck.ok) {
          throw new Error('Server health check failed');
        }
      } catch (healthError: any) {
        console.error('Health check failed:', healthError);
        throw new Error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      }

      console.log('Submitting booking...', {
        eventType: formData.eventType,
        packageType: formData.packageType,
        eventDate: formData.date,
        totalAmount
      });
      
      const requestBody = {
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
      };
      
      console.log('Request body:', requestBody);
      console.log('Step 4: Making fetch request to:', `${API_URL}/api/bookings`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('Request timeout after 30 seconds');
      }, 30000);
      
      console.log('Step 5: Fetch call starting...');
      console.log('About to call fetch with URL:', `${API_URL}/api/bookings`);
      let response;
      try {
        console.log('Fetch call initiated at:', new Date().toISOString());
        response = await fetch(`${API_URL}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        console.log('Step 6: Fetch completed, response received at:', new Date().toISOString());
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.error('Fetch error caught:', fetchErr);
        console.error('Fetch error name:', fetchErr.name);
        console.error('Fetch error message:', fetchErr.message);
        if (fetchErr.name === 'AbortError') {
          throw new Error('Request timed out. The server may not be responding. Please check if the backend server is running.');
        }
        throw fetchErr;
      }

      clearTimeout(timeoutId);
      console.log('Response received:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : { error: `Server error: ${response.status}` };
        } catch (e) {
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        console.error('Booking error response:', errorData);
        throw new Error(errorData.error || `Failed to create booking (${response.status})`);
      }

      const bookingData = await response.json();
      console.log('Booking created successfully:', bookingData);
      console.log('Step 7: Processing success response...');
      
      // Update user profile with phone if provided (completely non-blocking - skip for now to avoid blocking)
      // We'll handle this separately to not block the UI update
      if (formData.phone && formData.phone !== userProfile?.phone) {
        console.log('Phone number will be updated separately (non-blocking)');
        // Schedule update for later - don't block UI
        setTimeout(async () => {
          try {
            const { error: phoneError } = await supabase
              .from('profiles')
              .update({ phone: formData.phone })
              .eq('id', currentUser.id);
            if (phoneError) {
              console.warn('Failed to update phone number:', phoneError);
            } else {
              console.log('Phone number updated successfully');
            }
          } catch (phoneUpdateError: any) {
            console.warn('Error updating phone number:', phoneUpdateError);
          }
        }, 100);
      }

      console.log('Step 8: Clearing loading state...');
      // Clear loading state immediately
      setLoading(false);
      console.log('Loading state cleared');
      
      console.log('Step 9: Showing success toast...');
      try {
        toast.success('Booking request submitted successfully! We\'ll contact you within 24 hours.');
        console.log('Toast shown');
      } catch (toastError) {
        console.error('Toast error:', toastError);
      }
      
      console.log('Step 10: Resetting form and step...');
      try {
        // Reset form
        setFormData({
          name: userProfile?.display_name || '',
          email: userProfile?.email || currentUser.email || '',
          phone: userProfile?.phone || '',
          eventType: 'wedding',
          packageType: 'premium',
          date: '',
          time: '',
          location: '',
          duration: '8',
          guestCount: '',
          additionalServices: [],
          specialRequests: '',
          budget: ''
        });
        setStep(1);
        console.log('Form reset complete, step set to 1');
      } catch (resetError) {
        console.error('Form reset error:', resetError);
      }
      
      // Navigate to dashboard after a short delay to show the toast
      console.log('Step 11: Setting up navigation to dashboard in 1.5 seconds...');
      try {
        setTimeout(() => {
          console.log('Step 12: Navigating to dashboard now...');
          try {
            navigate('/dashboard');
            console.log('Navigation called');
          } catch (navError) {
            console.error('Navigation error:', navError);
          }
        }, 1500);
        console.log('Navigation timeout set');
      } catch (timeoutError) {
        console.error('Timeout setup error:', timeoutError);
      }
      
      console.log('Step 13: Success handler complete');
      
    } catch (error: any) {
      console.error('Booking submission error:', error);
      let errorMessage = 'Failed to submit booking. Please try again.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running.';
      }
      
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      toast.error(errorMessage);
    } finally {
      // Only set loading to false if it wasn't already cleared in the success path
      // (to avoid race conditions)
      setLoading(prev => {
        if (prev) {
          console.log('Finally block: clearing loading state');
          return false;
        }
        return prev;
      });
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const generatePDF = (formData: any) => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.text('Booking Details', 105, 20, { align: 'center' });
    
    // Add booking information
    doc.setFontSize(12);
    doc.text('Event Details:', 20, 40);
    doc.text(`Event Type: ${formData.eventType.charAt(0).toUpperCase() + formData.eventType.slice(1)}`, 30, 50);
    doc.text(`Date: ${formData.date}`, 30, 60);
    doc.text(`Time: ${formData.time}`, 30, 70);
    doc.text(`Location: ${formData.location}`, 30, 80);
    doc.text(`Duration: ${formData.duration} hours`, 30, 90);
    doc.text(`Guest Count: ${formData.guestCount}`, 30, 100);
    
    // Add package details
    doc.text('Package Details:', 20, 120);
    const selectedPackage = packageTypes.find(p => p.id === formData.packageType);
    doc.text(`Package: ${selectedPackage?.name}`, 30, 130);
    doc.text(`Price: ${selectedPackage?.price}`, 30, 140);
    doc.text(`Duration: ${selectedPackage?.duration}`, 30, 150);
    
    // Add additional services
    doc.text('Additional Services:', 20, 170);
    let yPos = 180;
    formData.additionalServices.forEach((serviceId: string) => {
      const service = additionalServices.find(s => s.id === serviceId);
      if (service) {
        doc.text(`• ${service.label} - ${service.price}`, 30, yPos);
        yPos += 10;
      }
    });
    
    // Add personal information
    doc.text('Personal Information:', 20, yPos + 10);
    doc.text(`Name: ${formData.name}`, 30, yPos + 20);
    doc.text(`Email: ${formData.email}`, 30, yPos + 30);
    doc.text(`Phone: ${formData.phone}`, 30, yPos + 40);
    
    // Add special requests if any
    if (formData.specialRequests) {
      doc.text('Special Requests:', 20, yPos + 60);
      doc.text(formData.specialRequests, 30, yPos + 70);
    }
    
    // Add total price calculation
    const basePrice = parseInt(selectedPackage?.price.replace(/[^0-9]/g, '') || '0');
    const additionalServicesTotal = formData.additionalServices.reduce((total: number, serviceId: string) => {
      const service = additionalServices.find(s => s.id === serviceId);
      return total + (parseInt(service?.price.replace(/[^0-9]/g, '') || '0'));
    }, 0);
    const totalPrice = basePrice + additionalServicesTotal;
    
    doc.text('Total Price:', 20, yPos + 90);
    doc.text(`₹${totalPrice.toLocaleString('en-IN')}`, 30, yPos + 100);
    
    // Save the PDF
    doc.save('booking-details.pdf');
  };

  return (
    <div className="pt-16 bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Book Your Session
          </h1>
          <p className="font-inter text-xl text-gray-600">
            Let's create beautiful memories together
          </p>
        </div>
      </section>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((number) => (
              <div key={number} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-inter font-semibold ${
                  step >= number ? 'bg-copper-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {number}
                </div>
                {number < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > number ? 'bg-copper-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm font-inter text-gray-600">
            <span>Event Details</span>
            <span>Package Selection</span>
            <span>Personal Info</span>
            <span>Review & Submit</span>
          </div>
        </div>
      </div>

      <form 
        onSubmit={(e) => {
          console.log('Form onSubmit triggered!', { step });
          handleSubmit(e);
        }} 
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        noValidate
      >
        {/* Step 1: Event Details */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
          >
            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-6">
              Tell us about your event
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventTypes.map((type) => (
                <label
                  key={type.id}
                  className={`relative cursor-pointer p-4 border-2 rounded-lg transition-colors ${
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
                  <div className="font-inter">
                    <div className="font-semibold text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Event Date
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  name="time"
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                  value={formData.time}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Event Location
              </label>
              <input
                type="text"
                name="location"
                required
                placeholder="Enter venue name and address"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                  Duration (hours)
                </label>
                <select
                  name="duration"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                  value={formData.guestCount}
                  onChange={handleChange}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Package Selection */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-6">
                Choose your package
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packageTypes.map((pkg) => (
                  <label
                    key={pkg.id}
                    className={`relative cursor-pointer p-6 border-2 rounded-lg transition-colors ${
                      formData.packageType === pkg.id
                        ? 'border-copper-500 bg-copper-50'
                        : 'border-gray-200 hover:border-copper-300'
                    } ${pkg.popular ? 'ring-2 ring-copper-200' : ''}`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-copper-500 text-white px-3 py-1 rounded-full text-xs font-inter font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <input
                      type="radio"
                      name="packageType"
                      value={pkg.id}
                      checked={formData.packageType === pkg.id}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <h3 className="font-playfair text-xl font-bold text-gray-900 mb-2">
                        {pkg.name}
                      </h3>
                      <div className="text-3xl font-bold text-copper-500 mb-2">
                        {pkg.price}
                      </div>
                      <div className="text-gray-600 font-inter mb-4">
                        {pkg.duration}
                      </div>
                      <ul className="space-y-2 text-sm font-inter text-gray-600">
                        {pkg.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="font-playfair text-xl font-bold text-gray-900 mb-6">
                Additional Services
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
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
                      <div className="text-copper-500 font-semibold">
                        {service.price}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Personal Information */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
          >
            <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-6">
              Your contact information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your full name"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="9876543210"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                  value={formData.phone}
                  onChange={(e) => {
                    // Only allow numbers and limit to 10 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: value });
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 font-inter">Enter 10-digit Indian mobile number (starting with 6-9)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                  Budget Range
                </label>
                <select
                  name="budget"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                  value={formData.budget}
                  onChange={handleChange}
                >
                  <option value="">Select budget range</option>
                  <option value="under-2000">Under ₹2,00,000</option>
                  <option value="2000-3000">₹2,00,000 - ₹3,00,000</option>
                  <option value="3000-5000">₹3,00,000 - ₹5,00,000</option>
                  <option value="5000-plus">₹5,00,000+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-2">
                <MessageSquare className="inline h-4 w-4 mr-1" />
                Special Requests or Notes
              </label>
              <textarea
                name="specialRequests"
                rows={4}
                placeholder="Tell us about your vision, special moments to capture, or any specific requirements..."
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                value={formData.specialRequests}
                onChange={handleChange}
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 space-y-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-playfair text-2xl font-bold text-gray-900">
                Review Your Booking
              </h2>
              <button
                type="button"
                onClick={() => generatePDF(formData)}
                className="flex items-center px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Details
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="font-playfair text-xl font-semibold text-gray-900">Event Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-semibold">Event Type:</span> {formData.eventType.charAt(0).toUpperCase() + formData.eventType.slice(1)}</p>
                  <p><span className="font-semibold">Date:</span> {formData.date}</p>
                  <p><span className="font-semibold">Time:</span> {formData.time}</p>
                  <p><span className="font-semibold">Location:</span> {formData.location}</p>
                  <p><span className="font-semibold">Duration:</span> {formData.duration} hours</p>
                  <p><span className="font-semibold">Guest Count:</span> {formData.guestCount}</p>
                </div>
              </div>

              {/* Package Details */}
              <div className="space-y-4">
                <h3 className="font-playfair text-xl font-semibold text-gray-900">Package Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {(() => {
                    const selectedPackage = packageTypes.find(p => p.id === formData.packageType);
                    return (
                      <>
                        <p><span className="font-semibold">Package:</span> {selectedPackage?.name}</p>
                        <p><span className="font-semibold">Price:</span> {selectedPackage?.price}</p>
                        <p><span className="font-semibold">Duration:</span> {selectedPackage?.duration}</p>
                        <div className="mt-2">
                          <p className="font-semibold">Features:</p>
                          <ul className="list-disc list-inside">
                            {selectedPackage?.features.map((feature, index) => (
                              <li key={index} className="text-gray-600">{feature}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Additional Services */}
              {formData.additionalServices.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-playfair text-xl font-semibold text-gray-900">Additional Services</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {formData.additionalServices.map((serviceId: string) => {
                      const service = additionalServices.find(s => s.id === serviceId);
                      return service ? (
                        <p key={serviceId}>
                          <span className="font-semibold">{service.label}:</span> {service.price}
                        </p>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-playfair text-xl font-semibold text-gray-900">Personal Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-semibold">Name:</span> {formData.name}</p>
                  <p><span className="font-semibold">Email:</span> {formData.email}</p>
                  <p><span className="font-semibold">Phone:</span> {formData.phone}</p>
                </div>
              </div>

              {/* Special Requests */}
              {formData.specialRequests && (
                <div className="space-y-4">
                  <h3 className="font-playfair text-xl font-semibold text-gray-900">Special Requests</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">{formData.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Total Price */}
              <div className="space-y-4">
                <h3 className="font-playfair text-xl font-semibold text-gray-900">Total Price</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {(() => {
                    const selectedPackage = packageTypes.find(p => p.id === formData.packageType);
                    const basePrice = parseInt(selectedPackage?.price.replace(/[^0-9]/g, '') || '0');
                    const additionalServicesTotal = formData.additionalServices.reduce((total: number, serviceId: string) => {
                      const service = additionalServices.find(s => s.id === serviceId);
                      return total + (parseInt(service?.price.replace(/[^0-9]/g, '') || '0'));
                    }, 0);
                    const totalPrice = basePrice + additionalServicesTotal;
                    
                    return (
                      <div className="space-y-2">
                        <p><span className="font-semibold">Base Package:</span> ₹{basePrice.toLocaleString('en-IN')}</p>
                        {additionalServicesTotal > 0 && (
                          <p><span className="font-semibold">Additional Services:</span> ₹{additionalServicesTotal.toLocaleString('en-IN')}</p>
                        )}
                        <p className="text-lg font-bold text-copper-500">Total: ₹{totalPrice.toLocaleString('en-IN')}</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={(e) => {
                  console.log('Submit button clicked!', { step, loading, formData });
                  // Don't prevent default here - let form handle it
                  // But ensure we're on step 4
                  if (step !== 4) {
                    e.preventDefault();
                    console.warn('Not on step 4, preventing submit');
                    return false;
                  }
                }}
                className="px-6 py-3 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter"
              >
                {loading ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-inter font-medium hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}
          
          <div className="ml-auto">
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-copper-500 text-white rounded-lg font-inter font-medium hover:bg-copper-600 transition-colors"
              >
                Next Step
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
};

export default Booking;