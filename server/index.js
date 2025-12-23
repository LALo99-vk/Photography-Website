import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabase.js';

// Import routes
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import photoRoutes from './routes/photos.js';
import userRoutes from './routes/users.js';
import excelRoutes from './routes/excel.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import pricingRoutes from './routes/pricing.js';

// Import scheduled tasks
import './services/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Supabase connection
try {
  const { data, error } = await supabase.from('settings').select('count').limit(1);
  if (error) throw error;
  console.log('Supabase connected successfully');
} catch (error) {
  console.error('Supabase connection failed:', error);
}

// Export supabase client for use in routes
export { supabase };

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pricing', pricingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;