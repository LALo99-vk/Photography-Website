-- Photography Platform Database Schema (PostgreSQL for Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
-- Note: Supabase Auth already has a users table in auth schema
-- We'll create a public profiles table that references auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'photographer', 'admin')),
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('wedding', 'engagement', 'portrait', 'event', 'maternity', 'newborn')),
    package_type TEXT NOT NULL CHECK (package_type IN ('essential', 'premium', 'luxury')),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in hours
    guest_count INTEGER,
    additional_services JSONB,
    special_requests TEXT,
    budget_range TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    total_amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Supabase Storage path
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photo selections table (for client photo selection)
CREATE TABLE IF NOT EXISTS public.photo_selections (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(photo_id, user_id)
);

-- Albums table
CREATE TABLE IF NOT EXISTS public.albums (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    album_type TEXT NOT NULL CHECK (album_type IN ('digital', 'print', 'premium')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'printed', 'delivered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Album photos (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.album_photos (
    id SERIAL PRIMARY KEY,
    album_id INTEGER NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(album_id, photo_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'photos', 'general')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.settings (setting_key, setting_value, description) VALUES
('max_photo_selections', '20', 'Maximum number of photos a client can select'),
('booking_advance_days', '30', 'Minimum days in advance for booking'),
('auto_excel_export', 'true', 'Enable automatic Excel export'),
('excel_export_schedule', '0 2 * * *', 'Cron schedule for Excel export (daily at 2 AM)')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON public.bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_photos_booking_id ON public.photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_photo_selections_user_id ON public.photo_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_selections_booking_id ON public.photo_selections(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON public.albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins and photographers can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'photographer')
        )
    );

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
    ON public.bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and photographers can view all bookings"
    ON public.bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'photographer')
        )
    );

CREATE POLICY "Admins and photographers can update bookings"
    ON public.bookings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'photographer')
        )
    );

-- Photos policies
CREATE POLICY "Users can view photos from their bookings"
    ON public.photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bookings
            WHERE id = photos.booking_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and photographers can upload photos"
    ON public.photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'photographer')
        )
    );

CREATE POLICY "Admins and photographers can view all photos"
    ON public.photos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'photographer')
        )
    );

CREATE POLICY "Admins and photographers can delete photos"
    ON public.photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'photographer')
        )
    );

-- Photo selections policies
CREATE POLICY "Users can view their own selections"
    ON public.photo_selections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own selections"
    ON public.photo_selections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own selections"
    ON public.photo_selections FOR DELETE
    USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

