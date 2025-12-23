import express from 'express';
import multer from 'multer';
import { supabase } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Configure multer for memory storage (we'll upload directly to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '');
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
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();
    
    if (!currentUser || !['admin', 'photographer'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedPhotos = [];

    for (const file of req.files) {
      // Generate unique filename
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
      const storagePath = `${bookingId}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        continue; // Skip this file and continue with others
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(storagePath);

      // Insert photo record into database
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert({
          booking_id: parseInt(bookingId),
          filename: fileName,
          original_name: file.originalname,
          storage_path: storagePath,
          file_size: file.size,
          mime_type: file.mimetype,
          uploaded_by: req.user.uid
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // Try to delete from storage if DB insert fails
        await supabase.storage.from('photos').remove([storagePath]);
        continue;
      }

      uploadedPhotos.push({
        id: photoData.id,
        filename: photoData.filename,
        originalName: photoData.original_name,
        size: photoData.file_size,
        url: urlData.publicUrl
      });
    }

    if (uploadedPhotos.length === 0) {
      return res.status(500).json({ error: 'Failed to upload any photos' });
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
    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

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

    // Get photos with selection status
    const { data: photos, error } = await supabase
      .from('photos')
      .select(`
        *,
        photo_selections!left (
          id,
          selected_at,
          notes
        )
      `)
      .eq('booking_id', bookingId)
      .order('upload_date', { ascending: false });

    if (error) throw error;

    // Get public URLs for photos
    const photosWithUrls = photos.map(photo => {
      // Use file_path or storage_path depending on what exists
      const filePath = photo.file_path || photo.storage_path || photo.filename;
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      return {
        ...photo,
        url: urlData.publicUrl,
        selection_id: photo.photo_selections?.[0]?.id || null,
        selected_at: photo.photo_selections?.[0]?.selected_at || null,
        notes: photo.photo_selections?.[0]?.notes || null
      };
    });

    res.json(photosWithUrls);
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
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select(`
        *,
        bookings!photos_booking_id_fkey (
          user_id,
          id
        )
      `)
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Check if user owns this booking
    if (req.user.uid !== photo.bookings.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if photo is already selected
    const { data: existing } = await supabase
      .from('photo_selections')
      .select('id')
      .eq('photo_id', photoId)
      .eq('user_id', req.user.uid)
      .single();

    if (existing) {
      // Deselect photo
      const { error } = await supabase
        .from('photo_selections')
        .delete()
        .eq('photo_id', photoId)
        .eq('user_id', req.user.uid);

      if (error) throw error;
      res.json({ message: 'Photo deselected', selected: false });
    } else {
      // Check selection limit
      const { data: settings } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('setting_key', 'max_photo_selections')
        .single();

      const maxSelections = parseInt(settings?.setting_value || '20');

      const { count } = await supabase
        .from('photo_selections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.uid)
        .eq('booking_id', photo.bookings.id);

      if ((count || 0) >= maxSelections) {
        return res.status(400).json({ 
          error: `Maximum ${maxSelections} photos can be selected` 
        });
      }

      // Select photo
      const { error } = await supabase
        .from('photo_selections')
        .insert({
          photo_id: parseInt(photoId),
          user_id: req.user.uid,
          booking_id: photo.bookings.id,
          notes: notes
        });

      if (error) throw error;
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
    const { data: booking } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

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

    const { data: selections, error } = await supabase
      .from('photo_selections')
      .select(`
        *,
        photos!photo_selections_photo_id_fkey (*)
      `)
      .eq('booking_id', bookingId)
      .eq('user_id', req.user.uid)
      .order('selected_at', { ascending: false });

    if (error) throw error;

    // Add URLs to photos
    const selectionsWithUrls = selections.map(selection => {
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(selection.photos.storage_path);

      return {
        ...selection.photos,
        ...selection,
        url: urlData.publicUrl
      };
    });

    res.json(selectionsWithUrls);
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
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();
    
    if (!currentUser || !['admin', 'photographer'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get photo info
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();

    if (photoError || !photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // Delete from database (this will cascade to photo_selections)
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (dbError) throw dbError;

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
