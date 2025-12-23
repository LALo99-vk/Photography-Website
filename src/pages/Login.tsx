import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Camera, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { signInWithGoogle } from '../supabase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, userProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect admin users to admin panel after profile loads
  useEffect(() => {
    if (userProfile?.role === 'admin') {
      navigate('/admin');
    }
  }, [userProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      // Wait a bit for profile to load, then check role
      setTimeout(() => {
        // Navigation will happen via useEffect when userProfile loads
        if (userProfile?.role !== 'admin') {
          navigate('/');
        }
      }, 500);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome back!');
      // Wait a bit for profile to load, then check role
      setTimeout(() => {
        // Navigation will happen via useEffect when userProfile loads
        if (userProfile?.role !== 'admin') {
          navigate('/');
        }
      }, 500);
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center">
            <Camera className="h-12 w-12 text-copper-500" />
          </div>
          <h2 className="mt-4 font-playfair text-3xl font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 font-inter text-gray-600">
            Sign in to your account
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-lg"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 font-inter">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-copper-500 focus:border-copper-500 font-inter"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 font-inter">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-copper-500 focus:border-copper-500 font-inter"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-copper-500 focus:ring-copper-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-inter">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-copper-500 hover:text-copper-600 font-inter">
                Forgot your password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-copper-500 hover:bg-copper-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-copper-500 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <div className="text-center">
            <span className="text-gray-600 font-inter">Don't have an account? </span>
            <Link to="/register" className="font-medium text-copper-500 hover:text-copper-600 font-inter">
              Sign up
            </Link>
          </div>
        </motion.form>

        {/* Demo Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <h3 className="font-playfair text-lg font-semibold text-gray-900 mb-4">
            Demo Accounts
          </h3>
          <div className="space-y-2 text-sm font-inter text-gray-600">
            <div>Client: client@demo.com / demo123</div>
            <div>Admin: admin@demo.com / demo123</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;