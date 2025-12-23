import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Image, Video, Gift } from 'lucide-react';

const Services = () => {
  const [activeTab, setActiveTab] = useState('weddings');

  const [weddingPackages, setWeddingPackages] = useState([
    {
      name: 'Essential',
      price: '₹1,50,000',
      duration: '6 hours',
      features: [
        '6 hours of coverage',
        '300+ edited photos',
        'Online gallery',
        'Print release',
        '2 photographers'
      ]
    },
    {
      name: 'Premium',
      price: '₹2,25,000',
      duration: '8 hours',
      features: [
        '8 hours of coverage',
        '500+ edited photos',
        'Online gallery',
        'Print release',
        '2 photographers',
        'Engagement session included',
        'Premium album (50 pages)'
      ],
      popular: true
    },
    {
      name: 'Luxury',
      price: '₹3,00,000',
      duration: '10 hours',
      features: [
        '10 hours of coverage',
        '700+ edited photos',
        'Online gallery',
        'Print release',
        '2 photographers',
        'Engagement session included',
        'Premium album (100 pages)',
        'Drone photography',
        'Second shooter'
      ]
    }
  ]);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/pricing`);
        if (!res.ok) throw new Error('Failed to load pricing');
        const data = await res.json();
        if (data?.packages?.length) {
          setWeddingPackages(
            data.packages.map((p: any) => ({
              name: p.name,
              price: `₹${Number(p.price).toLocaleString('en-IN')}`,
              duration: p.duration || '',
              features: Array.isArray(p.features) && p.features.length
                ? p.features
                : ['High quality coverage', 'Edited photos', 'Online gallery'],
              popular: p.slug === 'premium'
            }))
          );
        }
      } catch (err) {
        console.warn('Pricing fetch failed, using defaults', err);
      }
    };
    fetchPricing();
  }, []);

  const services = {
    weddings: {
      title: 'Wedding Photography',
      hero: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1200',
      description: 'Capture every precious moment of your special day with our elegant wedding photography services.',
      packages: weddingPackages
    },
    portraits: {
      title: 'Portrait Photography',
      hero: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1200',
      description: 'Professional portrait sessions that capture your personality and create lasting memories.',
      packages: [
        {
          name: 'Individual',
          price: '₹25,000',
          duration: '1 hour',
          features: [
            '1 hour session',
            '15+ edited photos',
            'Online gallery',
            'Print release',
            '2 outfit changes'
          ]
        },
        {
          name: 'Family',
          price: '₹35,000',
          duration: '1.5 hours',
          features: [
            '1.5 hour session',
            '25+ edited photos',
            'Online gallery',
            'Print release',
            'Multiple locations',
            'Styling consultation'
          ],
          popular: true
        },
        {
          name: 'Extended',
          price: '₹50,000',
          duration: '2 hours',
          features: [
            '2 hour session',
            '40+ edited photos',
            'Online gallery',
            'Print release',
            'Multiple locations',
            'Styling consultation',
            '8x10 prints included'
          ]
        }
      ]
    },
    events: {
      title: 'Event Photography',
      hero: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200',
      description: 'Document your corporate events, parties, and celebrations with professional photography.',
      packages: [
        {
          name: 'Basic Coverage',
          price: '₹50,000',
          duration: '3 hours',
          features: [
            '3 hours of coverage',
            '100+ edited photos',
            'Online gallery',
            'Print release',
            'Basic editing'
          ]
        },
        {
          name: 'Standard Coverage',
          price: '₹80,000',
          duration: '5 hours',
          features: [
            '5 hours of coverage',
            '200+ edited photos',
            'Online gallery',
            'Print release',
            'Professional editing',
            'Same-day previews'
          ],
          popular: true
        },
        {
          name: 'Full Coverage',
          price: '₹1,20,000',
          duration: '8 hours',
          features: [
            '8 hours of coverage',
            '300+ edited photos',
            'Online gallery',
            'Print release',
            'Professional editing',
            'Same-day previews',
            '2 photographers'
          ]
        }
      ]
    }
  };

  const addOns = [
    { name: 'Additional Hour of Coverage', price: '₹12,000' },
    { name: 'Drone Photography', price: '₹25,000' },
    { name: 'Second Photographer', price: '₹30,000' },
    { name: 'Premium Album (50 pages)', price: '₹40,000' },
    { name: 'Canvas Print Set', price: '₹15,000' },
    { name: 'Rush Delivery (48 hours)', price: '₹20,000' }
  ];

  const tabs = [
    { id: 'weddings', label: 'Weddings' },
    { id: 'portraits', label: 'Portraits' },
    { id: 'events', label: 'Events' }
  ];

  const currentService = services[activeTab as keyof typeof services];

  return (
    <div className="pt-16">
      {/* Service Tabs */}
      <section className="py-8 bg-gray-50 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-md font-inter font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-copper-500 text-white'
                      : 'text-gray-600 hover:text-copper-500'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Service Hero */}
      <section className="py-20 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${currentService.hero})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 text-white">
          <motion.h1 
            key={activeTab}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-playfair text-4xl md:text-6xl font-bold mb-6"
          >
            {currentService.title}
          </motion.h1>
          <motion.p 
            key={`${activeTab}-desc`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-inter text-xl text-gray-200"
          >
            {currentService.description}
          </motion.p>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Package
            </h2>
            <p className="font-inter text-xl text-gray-600">
              Select the perfect package for your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {currentService.packages.map((pkg, index) => (
              <motion.div 
                key={`${activeTab}-${pkg.name}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  pkg.popular ? 'ring-2 ring-copper-500 scale-105' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-copper-500 text-white px-4 py-1 rounded-full text-sm font-inter font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-2">
                    {pkg.name}
                  </h3>
                  <div className="text-4xl font-bold text-copper-500 mb-2">
                    {pkg.price}
                  </div>
                  <div className="flex items-center justify-center text-gray-600 font-inter">
                    <Clock className="h-4 w-4 mr-1" />
                    {pkg.duration}
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center font-inter text-gray-700">
                      <Check className="h-5 w-5 text-copper-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-3 rounded-lg font-inter font-semibold transition-colors ${
                  pkg.popular
                    ? 'bg-copper-500 text-white hover:bg-copper-600'
                    : 'border-2 border-copper-500 text-copper-500 hover:bg-copper-500 hover:text-white'
                }`}>
                  Choose Package
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold text-gray-900 mb-4">
              Enhance Your Experience
            </h2>
            <p className="font-inter text-xl text-gray-600">
              Optional add-ons to make your session even more special
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addOns.map((addon, index) => (
              <motion.div 
                key={addon.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center"
              >
                <div>
                  <h3 className="font-inter font-semibold text-gray-900">
                    {addon.name}
                  </h3>
                </div>
                <div className="text-2xl font-bold text-copper-500">
                  {addon.price}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
            Ready to Book Your Session?
          </h2>
          <p className="font-inter text-xl text-gray-300 mb-8">
            Let's create beautiful memories together. Contact us to discuss your vision.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-copper-500 text-white px-8 py-4 rounded-lg font-inter font-semibold hover:bg-copper-600 transition-colors">
              Book Now
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-inter font-semibold hover:bg-white hover:text-gray-900 transition-colors">
              Get Quote
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;