import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Award, Users, Star, ArrowRight } from 'lucide-react';

const Home = () => {
  const services = [
    {
      title: 'Wedding Photography',
      description: 'Capture your special day with elegant, timeless photos',
      image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      title: 'Portrait Sessions',
      description: 'Professional portraits that showcase your personality',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
      title: 'Event Photography',
      description: 'Document your celebrations with artistic flair',
      image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      text: 'Elite Photography captured our wedding perfectly. Every moment was beautifully documented.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      text: 'Professional, creative, and delivered beyond expectations. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emily Davis',
      text: 'The family portraits are stunning. They made everyone feel comfortable and natural.',
      rating: 5
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=1600)'
          }}
        >
          <div className="absolute inset-0 bg-hero-gradient"></div>
        </div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-playfair text-5xl md:text-7xl font-bold mb-6"
          >
            Capturing Life's
            <span className="block text-copper-500">Beautiful Moments</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-inter text-xl md:text-2xl mb-8 text-gray-200"
          >
            Professional photography services for weddings, portraits, and special events
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              to="/booking" 
              className="bg-copper-500 text-white px-8 py-4 rounded-lg font-inter font-semibold hover:bg-copper-600 transition-colors flex items-center justify-center"
            >
              Book Your Session
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/portfolio" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-inter font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              View Portfolio
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="text-3xl font-bold text-copper-500">500+</div>
              <div className="text-gray-600 font-inter">Happy Clients</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <div className="text-3xl font-bold text-copper-500">1000+</div>
              <div className="text-gray-600 font-inter">Events Captured</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="text-3xl font-bold text-copper-500">10+</div>
              <div className="text-gray-600 font-inter">Years Experience</div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <div className="text-3xl font-bold text-copper-500">15+</div>
              <div className="text-gray-600 font-inter">Awards Won</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="font-inter text-xl text-gray-600 max-w-3xl mx-auto">
              We specialize in capturing life's most important moments with artistic vision and professional excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div 
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-playfair text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="font-inter text-gray-600">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-lg"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-copper-500 fill-current" />
                  ))}
                </div>
                <p className="font-inter text-gray-600 mb-4">"{testimonial.text}"</p>
                <div className="font-playfair font-semibold text-gray-900">
                  {testimonial.name}
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
            Ready to Create Something Beautiful?
          </h2>
          <p className="font-inter text-xl text-gray-300 mb-8">
            Let's discuss your vision and create stunning photographs that tell your unique story
          </p>
          <Link 
            to="/booking" 
            className="bg-copper-500 text-white px-8 py-4 rounded-lg font-inter font-semibold hover:bg-copper-600 transition-colors inline-flex items-center"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;