import express from 'express';
import ExcelJS from 'exceljs';
import { supabase } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Generate Excel report
router.get('/export', verifyToken, async (req, res) => {
  try {
    // Check if user has permission
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();
    
    if (!currentUser || !['admin', 'photographer'].includes(currentUser.role)) {
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
    let bookingsQuery = supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey (
          display_name,
          email,
          phone
        )
      `);

    if (startDate) {
      bookingsQuery = bookingsQuery.gte('event_date', startDate);
    }

    if (endDate) {
      bookingsQuery = bookingsQuery.lte('event_date', endDate);
    }

    bookingsQuery = bookingsQuery.order('event_date', { ascending: false });

    const { data: bookings, error: bookingsError } = await bookingsQuery;
    
    if (bookingsError) throw bookingsError;

    // Add data to bookings sheet
    bookings.forEach(booking => {
      bookingsSheet.addRow({
        ...booking,
        display_name: booking.profiles?.display_name,
        email: booking.profiles?.email,
        phone: booking.profiles?.phone,
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
      let selectionsQuery = supabase
        .from('photo_selections')
        .select(`
          *,
          photos!photo_selections_photo_id_fkey (
            filename
          ),
          bookings!photo_selections_booking_id_fkey (
            event_type,
            event_date
          ),
          profiles!photo_selections_user_id_fkey (
            display_name,
            email
          )
        `);

      if (startDate) {
        selectionsQuery = selectionsQuery.gte('bookings.event_date', startDate);
      }

      if (endDate) {
        selectionsQuery = selectionsQuery.lte('bookings.event_date', endDate);
      }

      selectionsQuery = selectionsQuery.order('selected_at', { ascending: false });

      const { data: selections, error: selectionsError } = await selectionsQuery;
      
      if (selectionsError) throw selectionsError;

      // Add data to selections sheet
      selections.forEach(selection => {
        selectionsSheet.addRow({
          booking_id: selection.booking_id,
          display_name: selection.profiles?.display_name,
          email: selection.profiles?.email,
          event_type: selection.bookings?.event_type,
          event_date: selection.bookings?.event_date ? new Date(selection.bookings.event_date).toLocaleDateString() : '',
          filename: selection.photos?.filename,
          selected_at: selection.selected_at ? new Date(selection.selected_at).toLocaleString() : '',
          notes: selection.notes
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
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          profiles!payments_user_id_fkey (
            display_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (paymentsError) throw paymentsError;

      // Add data to payments sheet
      payments.forEach(payment => {
        paymentsSheet.addRow({
          ...payment,
          display_name: payment.profiles?.display_name,
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
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.uid)
      .single();
    
    if (!currentUser || !['admin', 'photographer'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get booking statistics
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    const { count: pendingBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: confirmedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed');

    const { count: completedBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    const { count: cancelledBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled');

    // Get photo statistics
    const { count: totalPhotos } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true });

    const { count: editedPhotos } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('is_edited', true);

    // Get selection statistics
    const { count: totalSelections } = await supabase
      .from('photo_selections')
      .select('*', { count: 'exact', head: true });

    const { data: uniqueUsers } = await supabase
      .from('photo_selections')
      .select('user_id', { count: 'exact' });

    const clientsWithSelections = new Set(uniqueUsers?.map(u => u.user_id) || []).size;

    // Get revenue statistics
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status');

    const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    const totalPayments = payments?.length || 0;
    const successfulPayments = payments?.filter(p => p.status === 'succeeded').length || 0;

    res.json({
      bookings: {
        total_bookings: totalBookings || 0,
        pending_bookings: pendingBookings || 0,
        confirmed_bookings: confirmedBookings || 0,
        completed_bookings: completedBookings || 0,
        cancelled_bookings: cancelledBookings || 0
      },
      photos: {
        total_photos: totalPhotos || 0,
        edited_photos: editedPhotos || 0
      },
      selections: {
        total_selections: totalSelections || 0,
        clients_with_selections: clientsWithSelections
      },
      revenue: {
        total_revenue: totalRevenue,
        total_payments: totalPayments,
        successful_payments: successfulPayments
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;