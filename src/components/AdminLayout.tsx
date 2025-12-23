import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Calendar, Users, UserCog, LogOut, Menu, X, Tag } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      // Force a full page reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/bookings', label: 'All Bookings', icon: Calendar },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/pricing', label: 'Pricing', icon: Tag },
    { path: '/admin/admins', label: 'Admins', icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          <h1 className="font-playfair text-xl font-bold text-gray-900">Admin Panel</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } transition-transform duration-200 ease-in-out pt-16 lg:pt-0`}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-playfair text-2xl font-bold text-gray-900">Admin Panel</h2>
              <p className="font-inter text-sm text-gray-600 mt-1">
                {userProfile?.display_name || 'Admin'}
              </p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-copper-50 text-copper-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-inter">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 w-full transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-inter">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 pt-16 lg:pt-0">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

