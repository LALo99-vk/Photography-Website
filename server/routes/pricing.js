import express from 'express';
import { supabase } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Admin check middleware
const requireAdmin = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Public: get pricing (packages + add-ons)
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('pricing')
      .select('*')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;

    const packages = data.filter((item) => item.category === 'package');
    const addons = data.filter((item) => item.category === 'addon');

    res.json({ packages, addons });
  } catch (error) {
    console.error('Pricing fetch error:', error);
    res.status(500).json({ error: 'Failed to load pricing' });
  }
});

// Admin: update pricing
router.put('/:slug', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const { price, duration, features, name, display_order } = req.body;

    const updates = { updated_at: new Date().toISOString(), updated_by: req.user.uid };
    if (price !== undefined) updates.price = price;
    if (duration !== undefined) updates.duration = duration;
    if (features !== undefined) updates.features = features;
    if (name !== undefined) updates.name = name;
    if (display_order !== undefined) updates.display_order = display_order;

    const { data, error } = await supabase
      .from('pricing')
      .update(updates)
      .eq('slug', slug)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Pricing updated', pricing: data });
  } catch (error) {
    console.error('Pricing update error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update pricing' });
  }
});

// Admin: create pricing item
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, category, price, duration, features, display_order, slug } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'name, category, and price are required' });
    }

    if (!['package', 'addon'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const finalSlug =
      slug && slug.trim().length > 0
        ? slug.trim().toLowerCase()
        : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const insertPayload = {
      slug: finalSlug,
      name,
      category,
      price,
      duration: category === 'package' ? duration || null : null,
      features: features ?? null,
      display_order: display_order ?? 0,
      updated_at: new Date().toISOString(),
      updated_by: req.user.uid,
    };

    const { data, error } = await supabase
      .from('pricing')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Pricing item created', pricing: data });
  } catch (error) {
    console.error('Pricing create error:', error);
    res.status(500).json({ error: error?.message || 'Failed to create pricing item' });
  }
});

export default router;

