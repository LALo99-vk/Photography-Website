import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Mail, Phone, MessageSquare, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Booking = () => {
  const { } = useAuth();
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

  const eventTypes = [
    { id: 'wedding', label: 'Wedding', description: 'Complete wedding day coverage' },
    { id: 'engagement', label: 'Engagement', description: 'Romantic couple session' },
    { id: 'portrait', label: 'Portrait', description: 'Individual or family portraits' },
    { id: 'event', label: 'Event', description: 'Corporate or private events' },
    { id: 'maternity', label: 'Maternity', description: 'Beautiful maternity session' },
    { id: 'newborn', label: 'Newborn', description: 'Precious newborn photography' }
  ];

  const packageTypes = [
    {
      id: 'essential',
      name: 'Essential',
      price: '$1,899',
      duration: '6 hours',
      features: ['6 hours coverage', '300+ photos', 'Online gallery', '2 photographers']
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$2,899',
      duration: '8 hours',
      features: ['8 hours coverage', '500+ photos', 'Online gallery', '2 photographers', 'Engagement session', 'Premium album'],
      popular: true
    },
    {
      id: 'luxury',
      name: 'Luxury',
      price: '$3,899',
      duration: '10 hours',
      features: ['10 hours coverage', '700+ photos', 'Online gallery', '2 photographers', 'Engagement session', 'Premium album', 'Drone photography']
    }
  ];

  const additionalServices = [
    { id: 'drone', label: 'Drone Photography', price: '$300' },
    { id: 'videography', label: 'Wedding Videography', price: '$800' },
    { id: 'album', label: 'Premium Album', price: '$500' },
    { id: 'prints', label: 'Print Package', price: '$200' },
    { id: 'rush', label: 'Rush Delivery', price: '$250' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(serviceId)
        ? prev.additionalServices.filter(id => id !== serviceId)
        : [...prev.additionalServices, serviceId]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    toast.success('Booking request submitted! We\'ll contact you within 24 hours.');
    console.log('Booking data:', formData);
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
    doc.text(`$${totalPrice.toLocaleString()}`, 30, yPos + 100);
    
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

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                  value={formData.phone}
                  onChange={handleChange}
                />
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
                  <option value="under-2000">Under $2,000</option>
                  <option value="2000-3000">$2,000 - $3,000</option>
                  <option value="3000-5000">$3,000 - $5,000</option>
                  <option value="5000-plus">$5,000+</option>
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
                        <p><span className="font-semibold">Base Package:</span> ${basePrice.toLocaleString()}</p>
                        {additionalServicesTotal > 0 && (
                          <p><span className="font-semibold">Additional Services:</span> ${additionalServicesTotal.toLocaleString()}</p>
                        )}
                        <p className="text-lg font-bold text-copper-500">Total: ${totalPrice.toLocaleString()}</p>
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
                className="px-6 py-3 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors"
              >
                Confirm Booking
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
            ) : (
              <button
                type="submit"
                className="px-8 py-3 bg-copper-500 text-white rounded-lg font-inter font-medium hover:bg-copper-600 transition-colors"
              >
                Submit Booking Request
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default Booking;