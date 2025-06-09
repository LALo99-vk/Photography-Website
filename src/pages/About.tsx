import React from 'react';
import { motion } from 'framer-motion';
import { Award, Camera, Heart, Star } from 'lucide-react';

const About = () => {
  const milestones = [
    { year: '2014', event: 'Founded Elite Photography Studio' },
    { year: '2016', event: 'Won "Best Wedding Photographer" Award' },
    { year: '2018', event: 'Expanded to destination weddings' },
    { year: '2020', event: 'Launched virtual photography consultations' },
    { year: '2022', event: 'Celebrated 500+ weddings captured' },
    { year: '2024', event: 'Opening second studio location' }
  ];

  const values = [
    {
      icon: Camera,
      title: 'Artistic Vision',
      description: 'We see beauty in every moment and capture it with creative excellence'
    },
    {
      icon: Heart,
      title: 'Personal Connection',
      description: 'Building genuine relationships with our clients for authentic storytelling'
    },
    {
      icon: Award,
      title: 'Professional Excellence',
      description: 'Committed to delivering the highest quality in every aspect of our work'
    },
    {
      icon: Star,
      title: 'Memorable Experience',
      description: 'Creating a comfortable, enjoyable photography experience for everyone'
    }
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="font-playfair text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Our Story
              </h1>
              <p className="font-inter text-lg text-gray-600 mb-6">
                Founded in 2014, Elite Photography began as a passion project to capture 
                life's most precious moments. What started as a small studio has grown into 
                a premier photography service, trusted by hundreds of families and couples.
              </p>
              <p className="font-inter text-lg text-gray-600">
                Our team combines technical expertise with artistic vision to create 
                timeless photographs that tell your unique story. Every session is 
                approached with care, creativity, and professional excellence.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <img 
                src="https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Photographer at work"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-copper-500 text-white p-6 rounded-2xl">
                <div className="text-3xl font-bold">10+</div>
                <div className="font-inter">Years of Excellence</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="font-inter text-xl text-gray-600 max-w-3xl mx-auto">
              Passionate photographers dedicated to capturing your most important moments
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="aspect-square mb-6 overflow-hidden rounded-2xl">
                <img 
                  src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Sarah Mitchell"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-playfair text-2xl font-semibold mb-2">Sarah Mitchell</h3>
              <p className="font-inter text-copper-500 mb-3">Lead Photographer & Founder</p>
              <p className="font-inter text-gray-600">
                With over 10 years of experience, Sarah specializes in wedding and portrait photography, 
                bringing artistic vision to every session.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="aspect-square mb-6 overflow-hidden rounded-2xl">
                <img 
                  src="https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Michael Rodriguez"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-playfair text-2xl font-semibold mb-2">Michael Rodriguez</h3>
              <p className="font-inter text-copper-500 mb-3">Event Photographer</p>
              <p className="font-inter text-gray-600">
                Michael excels at capturing candid moments and emotions during events, 
                ensuring no precious moment goes undocumented.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="aspect-square mb-6 overflow-hidden rounded-2xl">
                <img 
                  src="https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Emma Chen"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-playfair text-2xl font-semibold mb-2">Emma Chen</h3>
              <p className="font-inter text-copper-500 mb-3">Portrait Specialist</p>
              <p className="font-inter text-gray-600">
                Emma has a gift for making clients feel comfortable, resulting in 
                natural, authentic portraits that showcase personality.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="font-inter text-xl text-gray-600">
              A decade of growth, learning, and capturing beautiful moments
            </p>
          </div>
          
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div 
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex items-center space-x-4 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                  <div className="bg-copper-500 text-white px-4 py-2 rounded-full font-inter font-semibold">
                    {milestone.year}
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md max-w-md">
                    <p className="font-inter text-gray-700">{milestone.event}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="font-inter text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide our work and relationships with clients
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div 
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-copper-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-8 w-8 text-copper-500" />
                </div>
                <h3 className="font-playfair text-xl font-semibold mb-3">{value.title}</h3>
                <p className="font-inter text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;