import express from 'express';
import { supabase } from '../index.js';

const router = express.Router();

// Middleware to verify Supabase JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = { uid: user.id, email: user.email };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create or update user profile
router.post('/profile', verifyToken, async (req, res) => {
  try {
    const { uid, email, displayName, role = 'client', phone } = req.body;
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: uid,
        email: email,
        display_name: displayName,
        role: role,
        phone: phone,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (error) throw error;
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user profile
router.get('/profile/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user role (admin only)
router.patch('/role/:uid', verifyToken, async (req, res) => {
  try {
    // Check if current user is admin
    const { data: currentUser, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();
    
    if (userError || !currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { uid } = req.params;
    const { role } = req.body;
    
    if (!['client', 'photographer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: role, updated_at: new Date().toISOString() })
      .eq('id', uid);
    
    if (error) throw error;
    
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;