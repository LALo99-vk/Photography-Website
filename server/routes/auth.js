import express from 'express';
import admin from 'firebase-admin';
import { db } from '../index.js';

const router = express.Router();

// Middleware to verify Firebase token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
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
    
    const query = `
      INSERT INTO users (id, email, display_name, role, phone)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      display_name = VALUES(display_name),
      role = VALUES(role),
      phone = VALUES(phone),
      updated_at = CURRENT_TIMESTAMP
    `;
    
    await db.execute(query, [uid, email, displayName, role, phone]);
    
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
    
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [uid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user role (admin only)
router.patch('/role/:uid', verifyToken, async (req, res) => {
  try {
    // Check if current user is admin
    const [currentUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.user.uid]
    );
    
    if (!currentUser[0] || currentUser[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { uid } = req.params;
    const { role } = req.body;
    
    if (!['client', 'photographer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    await db.execute(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, uid]
    );
    
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;