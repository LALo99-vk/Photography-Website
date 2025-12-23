import express from 'express';
import { supabase } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();
    
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user by ID
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user can access this profile
    if (req.user.uid !== userId) {
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.uid)
        .single();
      
      if (!currentUser || !['admin', 'photographer'].includes(currentUser.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;

