import React from 'react';
import { Camera, Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Camera className="h-8 w-8 text-copper-500" />
              <span className="font-playfair text-xl font-bold">
                Elite Photography
              </span>
            </div>
            <p className="text-gray-300 mb-4 font-inter">
              Capturing life's most precious moments with artistic excellence and 
              professional expertise. Creating timeless memories that last forever.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-copper-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-copper-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-playfair text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 font-inter">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-copper-500 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-copper-500 transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="text-gray-300 hover:text-copper-500 transition-colors">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link to="/booking" className="text-gray-300 hover:text-copper-500 transition-colors">
                  Book Session
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-playfair text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 font-inter">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-copper-500" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-copper-500" />
                <span className="text-gray-300">info@elitephotography.com</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-copper-500 mt-1" />
                <span className="text-gray-300">
                  123 Studio Street<br />
                  New York, NY 10001
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 font-inter">
              © 2024 Elite Photography. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0 font-inter">
              <a href="#" className="text-gray-400 hover:text-copper-500 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-copper-500 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;