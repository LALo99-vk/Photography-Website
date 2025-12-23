import cron from 'cron';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { supabase } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create exports directory if it doesn't exist
const exportsDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Function to generate automatic Excel export
async function generateAutomaticExport() {
  try {
    console.log('Starting automatic Excel export...');

    // Check if auto export is enabled
    const { data: settings } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'auto_excel_export')
      .single();

    if (!settings || settings.setting_value !== 'true') {
      console.log('Auto Excel export is disabled');
      return;
    }

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
      { header: 'Selected Photos Count', key: 'selected_photos_count', width: 20 },
      { header: 'Created At', key: 'created_at', width: 18 }
    ];

    // Get bookings with photo selection counts
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!bookings_user_id_fkey (
          display_name,
          email,
          phone
        ),
        photo_selections!photo_selections_booking_id_fkey (
          id
        )
      `)
      .order('event_date', { ascending: false });

    if (bookingsError) throw bookingsError;

    // Process bookings to add selection counts
    const bookingsWithCounts = bookings.map(booking => ({
      ...booking,
      display_name: booking.profiles?.display_name,
      email: booking.profiles?.email,
      phone: booking.profiles?.phone,
      selected_photos_count: booking.photo_selections?.length || 0
    }));

    // Add data to bookings sheet
    bookingsWithCounts.forEach(booking => {
      bookingsSheet.addRow({
        id: booking.id,
        display_name: booking.display_name,
        email: booking.email,
        phone: booking.phone,
        event_type: booking.event_type,
        package_type: booking.package_type,
        event_date: booking.event_date ? new Date(booking.event_date).toLocaleDateString() : '',
        event_time: booking.event_time,
        location: booking.location,
        duration: booking.duration,
        guest_count: booking.guest_count,
        status: booking.status,
        total_amount: booking.total_amount,
        selected_photos_count: booking.selected_photos_count,
        created_at: booking.created_at ? new Date(booking.created_at).toLocaleString() : ''
      });
    });

    // Style the header row
    bookingsSheet.getRow(1).font = { bold: true };
    bookingsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD4AF37' }
    };

    // Add photo selections worksheet
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
    const { data: selections, error: selectionsError } = await supabase
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
      `)
      .order('selected_at', { ascending: false });

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

    // Add payments worksheet
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
        id: payment.id,
        booking_id: payment.booking_id,
        display_name: payment.profiles?.display_name,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        payment_method: payment.payment_method,
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

    // Save the file
    const filename = `photography_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filepath = path.join(exportsDir, filename);
    
    await workbook.xlsx.writeFile(filepath);
    
    console.log(`Excel export completed: ${filename}`);

    // Clean up old exports (keep only last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const files = fs.readdirSync(exportsDir);
    files.forEach(file => {
      const filePath = path.join(exportsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old export: ${file}`);
      }
    });

  } catch (error) {
    console.error('Automatic Excel export error:', error);
  }
}

// Set up cron job for automatic Excel export
async function setupScheduler() {
  try {
    // Get the schedule from settings
    const { data: settings } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'excel_export_schedule')
      .single();

    const schedule = settings?.setting_value || '0 2 * * *'; // Default: daily at 2 AM

    // Create cron job
    const job = new cron.CronJob(schedule, generateAutomaticExport, null, true, 'America/New_York');
    
    console.log(`Excel export scheduler started with schedule: ${schedule}`);
    
    // Run initial export
    generateAutomaticExport();

  } catch (error) {
    console.error('Scheduler setup error:', error);
  }
}

// Initialize scheduler
setupScheduler();

export { generateAutomaticExport };