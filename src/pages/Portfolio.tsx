import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Heart } from 'lucide-react';

const Portfolio = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All Work' },
    { id: 'weddings', label: 'Weddings' },
    { id: 'portraits', label: 'Portraits' },
    { id: 'events', label: 'Events' },
    { id: 'family', label: 'Family' }
  ];

  const portfolioItems = [
    {
      id: 1,
      category: 'weddings',
      title: 'Sarah & Michael Wedding',
      location: 'Central Park, NYC',
      image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'A beautiful autumn wedding in Central Park'
    },
    {
      id: 2,
      category: 'portraits',
      title: 'Corporate Headshots',
      location: 'Studio Session',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Professional corporate portrait session'
    },
    {
      id: 3,
      category: 'events',
      title: 'Tech Conference 2024',
      location: 'Convention Center',
      image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Annual technology conference coverage'
    },
    {
      id: 4,
      category: 'family',
      title: 'Johnson Family Session',
      location: 'Beach Location',
      image: 'https://images.pexels.com/photos/1128318/pexels-photo-1128318.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Fun family beach photography session'
    },
    {
      id: 5,
      category: 'weddings',
      title: 'Emma & David Wedding',
      location: 'Garden Venue',
      image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Elegant garden wedding ceremony'
    },
    {
      id: 6,
      category: 'portraits',
      title: 'Maternity Session',
      location: 'Outdoor Studio',
      image: 'https://images.pexels.com/photos/1556665/pexels-photo-1556665.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Beautiful maternity photography'
    },
    {
      id: 7,
      category: 'events',
      title: 'Charity Gala',
      location: 'Grand Ballroom',
      image: 'https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Annual charity fundraising event'
    },
    {
      id: 8,
      category: 'family',
      title: 'Holiday Mini Sessions',
      location: 'Studio',
      image: 'https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Festive holiday family portraits'
    },
    {
      id: 9,
      category: 'weddings',
      title: 'Destination Wedding',
      location: 'Santorini, Greece',
      image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=800',
      description: 'Romantic destination wedding in Greece'
    }
  ];

  const filteredItems = activeFilter === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeFilter);

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-playfair text-4xl md:text-6xl font-bold mb-6"
          >
            Our Portfolio
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-inter text-xl text-gray-300"
          >
            Explore our collection of beautiful moments captured with passion and artistry
          </motion.p>
        </div>
      </section>

      {/* Filter Buttons */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-3 rounded-full font-inter font-medium transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-copper-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-copper-100 hover:text-copper-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="font-playfair text-xl font-bold mb-1">
                      {item.title}
                    </h3>
                    <p className="font-inter text-sm text-gray-300 mb-2">
                      {item.location}
                    </p>
                    <p className="font-inter text-sm text-gray-200">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <Eye className="h-5 w-5" />
                    </button>
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <Heart className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Work */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Featured Work
            </h2>
            <p className="font-inter text-xl text-gray-600">
              Highlights from our most memorable sessions
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h3 className="font-playfair text-3xl font-bold text-gray-900">
                Sarah & Michael's Dream Wedding
              </h3>
              <p className="font-inter text-lg text-gray-600">
                A magical autumn wedding in Central Park that perfectly captured the 
                couple's love story. From intimate moments to grand celebrations, 
                every detail was documented with artistic precision.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-copper-500 rounded-full"></div>
                  <span className="font-inter text-gray-700">8-hour coverage</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-copper-500 rounded-full"></div>
                  <span className="font-inter text-gray-700">500+ edited photos</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-copper-500 rounded-full"></div>
                  <span className="font-inter text-gray-700">Premium wedding album</span>
                </div>
              </div>
              <button className="bg-copper-500 text-white px-6 py-3 rounded-lg font-inter font-semibold hover:bg-copper-600 transition-colors">
                View Full Gallery
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="grid grid-cols-2 gap-4"
            >
              <img 
                src="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Wedding photo 1"
                className="rounded-lg shadow-lg"
              />
              <img 
                src="https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Wedding photo 2"
                className="rounded-lg shadow-lg mt-8"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6">
            Ready to Create Your Story?
          </h2>
          <p className="font-inter text-xl text-gray-300 mb-8">
            Let's work together to capture your most important moments with the same care and artistry
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-copper-500 text-white px-8 py-4 rounded-lg font-inter font-semibold hover:bg-copper-600 transition-colors">
              Book Your Session
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-inter font-semibold hover:bg-white hover:text-gray-900 transition-colors">
              Get in Touch
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;