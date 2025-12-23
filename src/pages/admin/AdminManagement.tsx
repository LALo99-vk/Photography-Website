import React, { useState, useEffect } from 'react';
import { UserPlus, User, Mail, Shield, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/config';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Admin {
  id: string;
  display_name: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminManagement = () => {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'admin'
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/admins`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch admins');

      const data = await response.json();
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.displayName) {
      toast.error('Please fill in all fields');
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create admin');
      }

      toast.success('Admin account created successfully');
      setFormData({ email: '', password: '', displayName: '', role: 'admin' });
      setShowCreateForm(false);
      fetchAdmins();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create admin account');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
            Admin Management
          </h1>
          <p className="font-inter text-gray-600">
            Create and manage admin accounts
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Create Admin
        </button>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <h2 className="font-playfair text-xl font-bold text-gray-900 mb-4">
            Create New Admin Account
          </h2>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
                  required
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
                  required
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block font-inter text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copper-500 focus:border-transparent font-inter"
                >
                  <option value="admin">Admin</option>
                  <option value="photographer">Photographer</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Admin'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ email: '', password: '', displayName: '', role: 'admin' });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-inter font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Admins List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="font-inter text-gray-600">Loading admins...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-inter text-gray-600">No admins found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <motion.tr
                    key={admin.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-copper-500 mr-3" />
                        <div>
                          <p className="font-inter font-medium text-gray-900">
                            {admin.display_name}
                          </p>
                          {admin.id === currentUser?.id && (
                            <p className="font-inter text-xs text-copper-600">(You)</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {admin.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-inter font-medium ${
                        admin.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(admin.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;

