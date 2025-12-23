import express from 'express';
import { supabase } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Create a payment
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      bookingId,
      amount,
      currency = 'USD',
      stripePaymentIntentId,
      paymentMethod,
      status = 'pending'
    } = req.body;

    const { data, error } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        user_id: req.user.uid,
        amount: amount,
        currency: currency,
        stripe_payment_intent_id: stripePaymentIntentId,
        payment_method: paymentMethod,
        status: status
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Payment created successfully',
      paymentId: data.id
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Get user's payments
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user can access these payments
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

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

// Update payment status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'succeeded', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if user has permission
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();
    
    if (!currentUser || !['admin', 'photographer'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('payments')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

export default router;

