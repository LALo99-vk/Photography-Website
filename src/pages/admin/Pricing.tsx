import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/config';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';

interface PricingItem {
  id: number;
  slug: string;
  name: string;
  category: 'package' | 'addon';
  price: number;
  duration?: string | null;
  features?: string[] | null;
  display_order?: number;
}

const Pricing = () => {
  const { currentUser } = useAuth();
  const [packages, setPackages] = useState<PricingItem[]>([]);
  const [addons, setAddons] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'package' as 'package' | 'addon',
    price: 0,
    duration: '',
    features: '',
    display_order: 0,
  });

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/pricing`);
      if (!res.ok) throw new Error('Failed to fetch pricing');
      const data = await res.json();
      setPackages(data.packages || []);
      setAddons(data.addons || []);
    } catch (error) {
      console.error('Pricing fetch error:', error);
      toast.error('Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleFieldChange = (
    slug: string,
    category: 'package' | 'addon',
    field: 'price' | 'duration' | 'name',
    value: string
  ) => {
    const updater = category === 'package' ? setPackages : setAddons;
    const source = category === 'package' ? packages : addons;
    updater(
      source.map((item) =>
        item.slug === slug
          ? {
              ...item,
              [field]: field === 'price' ? Number(value) || 0 : value
            }
          : item
      )
    );
  };

  const savePricing = async (item: PricingItem) => {
    try {
      if (!currentUser) throw new Error('Not authenticated');
      setSavingSlug(item.slug);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/pricing/${item.slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          price: item.price,
          duration: item.duration,
          name: item.name
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update pricing');
      }
      toast.success('Pricing updated');
      fetchPricing();
    } catch (error: any) {
      console.error('Save pricing error:', error);
      toast.error(error.message || 'Failed to update pricing');
    } finally {
      setSavingSlug(null);
    }
  };

  const createItem = async () => {
    try {
      if (!currentUser) throw new Error('Not authenticated');
      if (!newItem.name.trim()) {
        toast.error('Name is required');
        return;
      }
      setCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const featuresArr = newItem.features
        ? newItem.features.split('\n').map((f) => f.trim()).filter(Boolean)
        : [];
      const res = await fetch(`${API_URL}/api/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: newItem.name.trim(),
          category: newItem.category,
          price: Number(newItem.price) || 0,
          duration: newItem.category === 'package' ? newItem.duration : undefined,
          features: featuresArr,
          display_order: Number(newItem.display_order) || 0
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create item');
      }
      toast.success('Pricing item created');
      setNewItem({
        name: '',
        category: 'package',
        price: 0,
        duration: '',
        features: '',
        display_order: 0
      });
      fetchPricing();
    } catch (error: any) {
      console.error('Create pricing error:', error);
      toast.error(error.message || 'Failed to create item');
    } finally {
      setCreating(false);
    }
  };

  const renderTable = (items: PricingItem[], categoryLabel: string) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-playfair text-xl font-bold text-gray-900">{categoryLabel}</h3>
      </div>
      {loading ? (
        <p className="font-inter text-gray-600">Loading...</p>
      ) : items.length === 0 ? (
        <p className="font-inter text-gray-600">No items</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">Price (₹)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">Duration</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => {
                const isSaving = savingSlug === item.slug;
                return (
                  <tr key={item.slug}>
                  {/* Name */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleFieldChange(item.slug, item.category, 'name', e.target.value)}
                      disabled={isSaving}
                      className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </td>
                  {/* Price */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <input
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(e) => handleFieldChange(item.slug, item.category, 'price', e.target.value)}
                      disabled={isSaving}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </td>
                  {/* Duration */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.category === 'package' ? (
                      <input
                        type="text"
                        value={item.duration || ''}
                        onChange={(e) => handleFieldChange(item.slug, item.category, 'duration', e.target.value)}
                        disabled={isSaving}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-500 font-inter">—</span>
                    )}
                  </td>
                  {/* Action */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => savePricing(item)}
                      disabled={isSaving}
                      className="inline-flex items-center px-3 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    {isSaving && (
                      <p className="mt-1 text-xs text-gray-500 font-inter">Saving…</p>
                    )}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-2">Pricing</h1>
        <p className="font-inter text-gray-600">
          Update package and add-on pricing. Changes are reflected on the website and booking flow.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {renderTable(packages, 'Packages')}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {renderTable(addons, 'Add-ons')}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-playfair text-xl font-bold text-gray-900 mb-4">Add New Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-1">Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                placeholder="e.g., Deluxe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-1">Category</label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as 'package' | 'addon' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
              >
                <option value="package">Package</option>
                <option value="addon">Add-on</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-1">Price (₹)</label>
              <input
                type="number"
                min={0}
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
              />
            </div>
            {newItem.category === 'package' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 font-inter mb-1">Duration</label>
                <input
                  type="text"
                  value={newItem.duration}
                  onChange={(e) => setNewItem({ ...newItem, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                  placeholder="e.g., 8 hours"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 font-inter mb-1">Features (one per line, optional)</label>
              <textarea
                value={newItem.features}
                onChange={(e) => setNewItem({ ...newItem, features: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
                placeholder="e.g.\n8 hours coverage\n500+ photos\nOnline gallery"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 font-inter mb-1">Display Order</label>
              <input
                type="number"
                value={newItem.display_order}
                onChange={(e) => setNewItem({ ...newItem, display_order: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-copper-500 focus:border-copper-500 font-inter"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={createItem}
              disabled={creating}
              className="px-4 py-2 bg-copper-500 text-white rounded-lg hover:bg-copper-600 transition-colors font-inter disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{creating ? 'Saving...' : 'Add Item'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Pricing;

