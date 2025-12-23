import express from 'express';
import { supabase } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Create a new booking
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      eventType,
      packageType,
      eventDate,
      eventTime,
      location,
      duration,
      guestCount,
      additionalServices,
      specialRequests,
      budgetRange,
      totalAmount
    } = req.body;

    // Ensure user profile exists before creating booking (foreign key constraint)
    // Backend uses service role key, so it can check and create profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', req.user.uid)
      .single();

    // If profile doesn't exist, create it
    if (profileError || !existingProfile) {
      console.log('Profile does not exist, creating it for user:', req.user.uid);
      
      // Create profile with user info from token
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: req.user.uid,
          email: req.user.email || '',
          display_name: req.user.email?.split('@')[0] || 'User',
          role: 'client',
        });

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        // Don't fail the booking if profile creation fails - the trigger might have created it
        // Just log the error and continue
      }
    }

    // Now create the booking
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: req.user.uid,
        event_type: eventType,
        package_type: packageType,
        event_date: eventDate,
        event_time: eventTime,
        location: location,
        duration: duration,
        guest_count: guestCount,
        additional_services: additionalServices,
        special_requests: specialRequests,
        budget_range: budgetRange,
        total_amount: totalAmount
      })
      .select()
      .single();

    if (error) {
      console.error('Booking insert error:', error);
      throw error;
    }

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: data.id
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ 
      error: error?.message || 'Failed to create booking',
      details: error?.details || null
    });
  }
});

// Get user's bookings
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user can access these bookings
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

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey (
          display_name,
          email,
          phone
        )
      `)
      .eq('user_id', userId)
      .order('event_date', { ascending: false });

    if (error) throw error;

    // Transform data to match expected format
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      display_name: booking.profiles?.display_name,
      email: booking.profiles?.email,
      phone: booking.profiles?.phone
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Get all bookings (admin/photographer only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();
    
    if (!currentUser || !['admin', 'photographer'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, eventType, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey (
          display_name,
          email,
          phone
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    query = query
      .order('event_date', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data: bookings, error, count } = await query;

    if (error) throw error;

    // Transform data to match expected format
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      display_name: booking.profiles?.display_name,
      email: booking.profiles?.email,
      phone: booking.profiles?.phone
    }));

    res.json({
      bookings: formattedBookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Delete a booking (only within 1 hour of creation)
// Soft delete: marks booking as deleted with reason instead of actually deleting
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { deletionReason } = req.body;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    if (!deletionReason || deletionReason.trim() === '') {
      return res.status(400).json({ error: 'Deletion reason is required' });
    }

    // Get the booking first to check ownership and creation time
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('user_id, created_at, deleted_at')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if already deleted
    if (booking.deleted_at) {
      return res.status(400).json({ error: 'Booking is already deleted' });
    }

    // Check if user owns this booking or is admin
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();

    const isOwner = booking.user_id === req.user.uid;
    const isAdmin = currentUser?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if booking was created less than 1 hour ago (only for non-admin users)
    if (!isAdmin) {
      const createdAt = new Date(booking.created_at);
      const now = new Date();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

      if (hoursSinceCreation >= 1) {
        return res.status(400).json({ 
          error: 'Booking can only be deleted within 1 hour of creation' 
        });
      }
    }

    // Soft delete: mark as deleted with reason instead of actually deleting
    const { error: deleteError } = await supabase
      .from('bookings')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        deletion_reason: deletionReason.trim(),
        deleted_by: req.user.uid,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (deleteError) {
      console.error('Delete booking error:', deleteError);
      throw deleteError;
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete booking' });
  }
});

// Update a booking (only within 1 hour of creation for users, admins can always edit)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const {
      eventType,
      packageType,
      eventDate,
      eventTime,
      location,
      duration,
      guestCount,
      additionalServices,
      specialRequests,
      budgetRange,
      totalAmount
    } = req.body;

    // Get the booking first to check ownership and creation time
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('user_id, created_at, status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking or is admin
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();

    const isOwner = booking.user_id === req.user.uid;
    const isAdmin = currentUser?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if booking was created less than 1 hour ago (only for non-admin users)
    // Also check if booking is not confirmed/completed (users can't edit those)
    if (!isAdmin) {
      const createdAt = new Date(booking.created_at);
      const now = new Date();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

      if (hoursSinceCreation >= 1) {
        return res.status(400).json({ 
          error: 'Booking can only be edited within 1 hour of creation' 
        });
      }

      // Users can't edit confirmed or completed bookings
      if (['confirmed', 'completed'].includes(booking.status)) {
        return res.status(400).json({ 
          error: 'Cannot edit confirmed or completed bookings' 
        });
      }
    }

    // Update the booking
    const updateData = {};
    if (eventType) updateData.event_type = eventType;
    if (packageType) updateData.package_type = packageType;
    if (eventDate) updateData.event_date = eventDate;
    if (eventTime) updateData.event_time = eventTime;
    if (location) updateData.location = location;
    if (duration !== undefined) updateData.duration = duration;
    if (guestCount !== undefined) updateData.guest_count = guestCount;
    if (additionalServices !== undefined) updateData.additional_services = additionalServices;
    if (specialRequests !== undefined) updateData.special_requests = specialRequests;
    if (budgetRange !== undefined) updateData.budget_range = budgetRange;
    if (totalAmount !== undefined) updateData.total_amount = totalAmount;

    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Update booking error:', updateError);
      throw updateError;
    }

    res.json({ 
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: error?.message || 'Failed to update booking' });
  }
});

// Update booking status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if user has permission to update
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();
    
    if (!currentUser || !['admin', 'photographer'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Booking status updated successfully' });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Get booking by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey (
          display_name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user can access this booking
    if (req.user.uid !== booking.user_id) {
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.uid)
        .single();
      
      if (!currentUser || !['admin', 'photographer'].includes(currentUser.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Transform data to match expected format
    const formattedBooking = {
      ...booking,
      display_name: booking.profiles?.display_name,
      email: booking.profiles?.email,
      phone: booking.profiles?.phone
    };

    res.json(formattedBooking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

export default router;