import express from 'express';
import { db } from '../index.js';
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

    const query = `
      INSERT INTO bookings (
        user_id, event_type, package_type, event_date, event_time,
        location, duration, guest_count, additional_services,
        special_requests, budget_range, total_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      req.user.uid,
      eventType,
      packageType,
      eventDate,
      eventTime,
      location,
      duration,
      guestCount,
      JSON.stringify(additionalServices),
      specialRequests,
      budgetRange,
      totalAmount
    ]);

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user's bookings
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user can access these bookings
    if (req.user.uid !== userId) {
      const [currentUser] = await db.execute(
        'SELECT role FROM users WHERE id = ?',
        [req.user.uid]
      );
      
      if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [bookings] = await db.execute(`
      SELECT b.*, u.display_name, u.email, u.phone
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.event_date DESC
    `, [userId]);

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Get all bookings (admin/photographer only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [currentUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.user.uid]
    );
    
    if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, eventType, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*, u.display_name, u.email, u.phone
      FROM bookings b
      JOIN users u ON b.user_id = u.id
    `;
    
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (eventType) {
      conditions.push('b.event_type = ?');
      params.push(eventType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY b.event_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [bookings] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM bookings b';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const [countResult] = await db.execute(countQuery, params.slice(0, -2));
    const total = countResult[0].total;

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
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
    const [currentUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.user.uid]
    );
    
    if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.execute(
      'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

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

    const [bookings] = await db.execute(`
      SELECT b.*, u.display_name, u.email, u.phone
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `, [id]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Check if user can access this booking
    if (req.user.uid !== booking.user_id) {
      const [currentUser] = await db.execute(
        'SELECT role FROM users WHERE id = ?',
        [req.user.uid]
      );
      
      if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

export default router;