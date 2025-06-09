import express from 'express';
import ExcelJS from 'exceljs';
import { db } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Generate Excel report
router.get('/export', verifyToken, async (req, res) => {
  try {
    // Check if user has permission
    const [currentUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.user.uid]
    );
    
    if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { type = 'all', startDate, endDate } = req.query;

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add bookings worksheet
    const bookingsSheet = workbook.addWorksheet('Bookings');
    
    // Define columns for bookings
    bookingsSheet.columns = [
      { header: 'Booking ID', key: 'id', width: 12 },
      { header: 'Client Name', key: 'display_name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Event Type', key: 'event_type', width: 15 },
      { header: 'Package', key: 'package_type', width: 12 },
      { header: 'Event Date', key: 'event_date', width: 12 },
      { header: 'Event Time', key: 'event_time', width: 10 },
      { header: 'Location', key: 'location', width: 30 },
      { header: 'Duration (hrs)', key: 'duration', width: 12 },
      { header: 'Guest Count', key: 'guest_count', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Total Amount', key: 'total_amount', width: 15 },
      { header: 'Created At', key: 'created_at', width: 18 }
    ];

    // Build query for bookings
    let bookingsQuery = `
      SELECT b.*, u.display_name, u.email, u.phone
      FROM bookings b
      JOIN users u ON b.user_id = u.id
    `;
    
    const params = [];
    const conditions = [];

    if (startDate) {
      conditions.push('b.event_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('b.event_date <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      bookingsQuery += ' WHERE ' + conditions.join(' AND ');
    }

    bookingsQuery += ' ORDER BY b.event_date DESC';

    const [bookings] = await db.execute(bookingsQuery, params);

    // Add data to bookings sheet
    bookings.forEach(booking => {
      bookingsSheet.addRow({
        ...booking,
        event_date: booking.event_date ? new Date(booking.event_date).toLocaleDateString() : '',
        created_at: booking.created_at ? new Date(booking.created_at).toLocaleString() : ''
      });
    });

    // Style the header row
    bookingsSheet.getRow(1).font = { bold: true };
    bookingsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD4AF37' } // Copper color
    };

    // Add photo selections worksheet if requested
    if (type === 'all' || type === 'selections') {
      const selectionsSheet = workbook.addWorksheet('Photo Selections');
      
      selectionsSheet.columns = [
        { header: 'Booking ID', key: 'booking_id', width: 12 },
        { header: 'Client Name', key: 'display_name', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Event Type', key: 'event_type', width: 15 },
        { header: 'Event Date', key: 'event_date', width: 12 },
        { header: 'Photo Filename', key: 'filename', width: 30 },
        { header: 'Selected At', key: 'selected_at', width: 18 },
        { header: 'Notes', key: 'notes', width: 30 }
      ];

      // Get photo selections data
      let selectionsQuery = `
        SELECT ps.*, p.filename, b.event_type, b.event_date, u.display_name, u.email
        FROM photo_selections ps
        JOIN photos p ON ps.photo_id = p.id
        JOIN bookings b ON ps.booking_id = b.id
        JOIN users u ON ps.user_id = u.id
      `;

      if (conditions.length > 0) {
        selectionsQuery += ' WHERE ' + conditions.map(c => c.replace('b.event_date', 'b.event_date')).join(' AND ');
      }

      selectionsQuery += ' ORDER BY ps.selected_at DESC';

      const [selections] = await db.execute(selectionsQuery, params);

      // Add data to selections sheet
      selections.forEach(selection => {
        selectionsSheet.addRow({
          ...selection,
          event_date: selection.event_date ? new Date(selection.event_date).toLocaleDateString() : '',
          selected_at: selection.selected_at ? new Date(selection.selected_at).toLocaleString() : ''
        });
      });

      // Style the header row
      selectionsSheet.getRow(1).font = { bold: true };
      selectionsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4AF37' }
      };
    }

    // Add payments worksheet if requested
    if (type === 'all' || type === 'payments') {
      const paymentsSheet = workbook.addWorksheet('Payments');
      
      paymentsSheet.columns = [
        { header: 'Payment ID', key: 'id', width: 12 },
        { header: 'Booking ID', key: 'booking_id', width: 12 },
        { header: 'Client Name', key: 'display_name', width: 20 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Currency', key: 'currency', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Payment Method', key: 'payment_method', width: 15 },
        { header: 'Created At', key: 'created_at', width: 18 }
      ];

      // Get payments data
      const [payments] = await db.execute(`
        SELECT p.*, u.display_name
        FROM payments p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `);

      // Add data to payments sheet
      payments.forEach(payment => {
        paymentsSheet.addRow({
          ...payment,
          created_at: payment.created_at ? new Date(payment.created_at).toLocaleString() : ''
        });
      });

      // Style the header row
      paymentsSheet.getRow(1).font = { bold: true };
      paymentsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4AF37' }
      };
    }

    // Set response headers
    const filename = `photography_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Get export statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    // Check if user has permission
    const [currentUser] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.user.uid]
    );
    
    if (!currentUser[0] || !['admin', 'photographer'].includes(currentUser[0].role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get various statistics
    const [bookingStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
    `);

    const [photoStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_photos,
        COUNT(CASE WHEN is_edited = 1 THEN 1 END) as edited_photos
      FROM photos
    `);

    const [selectionStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_selections,
        COUNT(DISTINCT user_id) as clients_with_selections
      FROM photo_selections
    `);

    const [revenueStats] = await db.execute(`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_payments
      FROM payments
    `);

    res.json({
      bookings: bookingStats[0],
      photos: photoStats[0],
      selections: selectionStats[0],
      revenue: revenueStats[0]
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;