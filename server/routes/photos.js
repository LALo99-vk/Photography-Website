import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from '../index.js';
import { verifyToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/photos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload photos for a booking
router.post('/upload/:bookingId', verifyToken, upload.array('photos', 50), async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Check if user has permission to upload photos
    const [currentUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.user.uid]
    );
    
    if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify booking exists
    const [bookings] = await db.execute(
      'SELECT id FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedPhotos = [];

    for (const file of req.files) {
      const query = `
        INSERT INTO photos (
          booking_id, filename, original_name, file_path,
          file_size, mime_type, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        bookingId,
        file.filename,
        file.originalname,
        file.path,
        file.size,
        file.mimetype,
        req.user.uid
      ]);

      uploadedPhotos.push({
        id: result.insertId,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
      });
    }

    res.status(201).json({
      message: 'Photos uploaded successfully',
      photos: uploadedPhotos
    });
  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// Get photos for a booking
router.get('/booking/:bookingId', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Check if user can access these photos
    const [booking] = await db.execute(
      'SELECT user_id FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.uid !== booking[0].user_id) {
      const [currentUser] = await db.execute(
        'SELECT role FROM users WHERE id = ?',
        [req.user.uid]
      );
      
      if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [photos] = await db.execute(`
      SELECT p.*, ps.id as selection_id, ps.selected_at, ps.notes
      FROM photos p
      LEFT JOIN photo_selections ps ON p.id = ps.photo_id AND ps.user_id = ?
      WHERE p.booking_id = ?
      ORDER BY p.upload_date DESC
    `, [req.user.uid, bookingId]);

    res.json(photos);
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ error: 'Failed to get photos' });
  }
});

// Select/deselect a photo
router.post('/:photoId/select', verifyToken, async (req, res) => {
  try {
    const { photoId } = req.params;
    const { notes = '' } = req.body;

    // Get photo and booking info
    const [photos] = await db.execute(`
      SELECT p.*, b.user_id, b.id as booking_id
      FROM photos p
      JOIN bookings b ON p.booking_id = b.id
      WHERE p.id = ?
    `, [photoId]);

    if (photos.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = photos[0];

    // Check if user owns this booking
    if (req.user.uid !== photo.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if photo is already selected
    const [existing] = await db.execute(
      'SELECT id FROM photo_selections WHERE photo_id = ? AND user_id = ?',
      [photoId, req.user.uid]
    );

    if (existing.length > 0) {
      // Deselect photo
      await db.execute(
        'DELETE FROM photo_selections WHERE photo_id = ? AND user_id = ?',
        [photoId, req.user.uid]
      );
      res.json({ message: 'Photo deselected', selected: false });
    } else {
      // Check selection limit
      const [settings] = await db.execute(
        'SELECT setting_value FROM settings WHERE setting_key = "max_photo_selections"'
      );
      const maxSelections = parseInt(settings[0]?.setting_value || 20);

      const [currentSelections] = await db.execute(
        'SELECT COUNT(*) as count FROM photo_selections WHERE user_id = ? AND booking_id = ?',
        [req.user.uid, photo.booking_id]
      );

      if (currentSelections[0].count >= maxSelections) {
        return res.status(400).json({ 
          error: `Maximum ${maxSelections} photos can be selected` 
        });
      }

      // Select photo
      await db.execute(
        'INSERT INTO photo_selections (photo_id, user_id, booking_id, notes) VALUES (?, ?, ?, ?)',
        [photoId, req.user.uid, photo.booking_id, notes]
      );
      res.json({ message: 'Photo selected', selected: true });
    }
  } catch (error) {
    console.error('Select photo error:', error);
    res.status(500).json({ error: 'Failed to select photo' });
  }
});

// Get user's selected photos for a booking
router.get('/selections/:bookingId', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Check if user can access these selections
    const [booking] = await db.execute(
      'SELECT user_id FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user.uid !== booking[0].user_id) {
      const [currentUser] = await db.execute(
        'SELECT role FROM users WHERE id = ?',
        [req.user.uid]
      );
      
      if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [selections] = await db.execute(`
      SELECT p.*, ps.selected_at, ps.notes
      FROM photo_selections ps
      JOIN photos p ON ps.photo_id = p.id
      WHERE ps.booking_id = ? AND ps.user_id = ?
      ORDER BY ps.selected_at DESC
    `, [bookingId, req.user.uid]);

    res.json(selections);
  } catch (error) {
    console.error('Get selections error:', error);
    res.status(500).json({ error: 'Failed to get selections' });
  }
});

// Delete a photo (admin/photographer only)
router.delete('/:photoId', verifyToken, async (req, res) => {
  try {
    const { photoId } = req.params;

    // Check if user has permission
    const [currentUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.user.uid]
    );
    
    if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get photo info
    const [photos] = await db.execute(
      'SELECT file_path FROM photos WHERE id = ?',
      [photoId]
    );

    if (photos.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete from database (this will cascade to photo_selections)
    await db.execute('DELETE FROM photos WHERE id = ?', [photoId]);

    // TODO: Delete physical file from storage
    // fs.unlinkSync(photos[0].file_path);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;