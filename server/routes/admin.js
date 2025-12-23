import express from 'express';
import { supabase } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Middleware to check if user is admin
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

// Get all bookings with user details (admin only)
router.get('/bookings', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, eventType, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey (
          id,
          display_name,
          email,
          phone,
          created_at
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (startDate) {
      query = query.gte('event_date', startDate);
    }

    if (endDate) {
      query = query.lte('event_date', endDate);
    }

    const { data: bookings, error, count } = await query;

    if (error) throw error;

    res.json({
      bookings: bookings || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit))
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Get booking statistics (admin only)
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('status');

    if (error) throw error;

    const stats = {
      total: bookings?.length || 0,
      pending: bookings?.filter(b => b.status === 'pending').length || 0,
      confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
      completed: bookings?.filter(b => b.status === 'completed').length || 0,
      could_not_do: bookings?.filter(b => b.status === 'could_not_do').length || 0,
      cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get single booking with full details (admin only)
router.get('/bookings/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError);
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get user profile
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name, email, phone, created_at')
      .eq('id', booking.user_id)
      .single();

    // Get status updated by profile (if exists)
    let statusUpdatedBy = null;
    if (booking.status_updated_by) {
      const { data: updatedByProfile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', booking.status_updated_by)
        .single();
      statusUpdatedBy = updatedByProfile;
    }

    // Combine data
    const bookingWithDetails = {
      ...booking,
      profiles: userProfile || null,
      status_updated_by_profile: statusUpdatedBy
    };

    res.json(bookingWithDetails);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

// Update booking status (admin only)
router.patch('/bookings/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id);
    const { status, reason, notes } = req.body;

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    if (!status || !['pending', 'confirmed', 'completed', 'cancelled', 'could_not_do'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status: status,
      status_updated_at: new Date().toISOString(),
      status_updated_by: req.user.uid,
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updateData.status_reason = reason;
    }

    if (notes) {
      updateData.status_notes = notes;
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Update booking error:', error);
      throw error;
    }

    res.json({
      message: 'Booking status updated successfully',
      booking: data
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Get all users (admin only)
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) throw error;

    res.json({
      users: users || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil((count || 0) / parseInt(limit))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get user details with bookings (admin only)
router.get('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;

    res.json({
      user,
      bookings: bookings || []
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Get all admins (admin only)
router.get('/admins', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'photographer'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(admins || []);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Failed to get admins' });
  }
});

// Create new admin account (admin only)
router.post('/admins', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, displayName, role = 'admin' } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    if (!['admin', 'photographer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or photographer' });
    }

    // Create user in Supabase Auth using service role
    // Note: This requires service role key which is already configured in server/supabase.js
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({ error: authError.message || 'Failed to create admin account' });
    }

    // Create profile with admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        display_name: displayName,
        role: role
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, try to delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    res.status(201).json({
      message: 'Admin account created successfully',
      admin: profile
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: error.message || 'Failed to create admin account' });
  }
});

export default router;

