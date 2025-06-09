import cron from 'cron';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from '../index.js';

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
    const [settings] = await db.execute(
      'SELECT setting_value FROM settings WHERE setting_key = "auto_excel_export"'
    );

    if (!settings[0] || settings[0].setting_value !== 'true') {
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
    const [bookings] = await db.execute(`
      SELECT 
        b.*, 
        u.display_name, 
        u.email, 
        u.phone,
        COUNT(ps.id) as selected_photos_count
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN photo_selections ps ON b.id = ps.booking_id
      GROUP BY b.id
      ORDER BY b.event_date DESC
    `);

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
    const [selections] = await db.execute(`
      SELECT ps.*, p.filename, b.event_type, b.event_date, u.display_name, u.email
      FROM photo_selections ps
      JOIN photos p ON ps.photo_id = p.id
      JOIN bookings b ON ps.booking_id = b.id
      JOIN users u ON ps.user_id = u.id
      ORDER BY ps.selected_at DESC
    `);

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
    const [settings] = await db.execute(
      'SELECT setting_value FROM settings WHERE setting_key = "excel_export_schedule"'
    );

    const schedule = settings[0]?.setting_value || '0 2 * * *'; // Default: daily at 2 AM

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