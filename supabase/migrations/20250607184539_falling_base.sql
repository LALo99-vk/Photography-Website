-- Photography Platform Database Schema

-- Users table (extends Firebase Auth)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role ENUM('client', 'photographer', 'admin') DEFAULT 'client',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    event_type ENUM('wedding', 'engagement', 'portrait', 'event', 'maternity', 'newborn') NOT NULL,
    package_type ENUM('essential', 'premium', 'luxury') NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT NOT NULL,
    duration INT NOT NULL, -- in hours
    guest_count INT,
    additional_services JSON,
    special_requests TEXT,
    budget_range VARCHAR(50),
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'succeeded', 'failed', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by VARCHAR(255) NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Photo selections table (for client photo selection)
CREATE TABLE IF NOT EXISTS photo_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photo_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    booking_id INT NOT NULL,
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE KEY unique_selection (photo_id, user_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    album_type ENUM('digital', 'print', 'premium') NOT NULL,
    status ENUM('draft', 'review', 'approved', 'printed', 'delivered') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Album photos (many-to-many relationship)
CREATE TABLE IF NOT EXISTS album_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    album_id INT NOT NULL,
    photo_id INT NOT NULL,
    sort_order INT DEFAULT 0,
    UNIQUE KEY unique_album_photo (album_id, photo_id),
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking', 'payment', 'photos', 'general') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
('max_photo_selections', '20', 'Maximum number of photos a client can select'),
('booking_advance_days', '30', 'Minimum days in advance for booking'),
('auto_excel_export', 'true', 'Enable automatic Excel export'),
('excel_export_schedule', '0 2 * * *', 'Cron schedule for Excel export (daily at 2 AM)');

-- Create indexes for better performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_event_date ON bookings(event_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_photos_booking_id ON photos(booking_id);
CREATE INDEX idx_photo_selections_user_id ON photo_selections(user_id);
CREATE INDEX idx_photo_selections_booking_id ON photo_selections(booking_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);