-- Add new status options and fields for booking status management

-- First, drop the existing check constraint to add new status
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add new status option 'could_not_do'
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'could_not_do'));

-- Add status management fields
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_notes TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES public.profiles(id);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status_updated_at ON public.bookings(status_updated_at);

-- Update existing bookings to set status_updated_at
UPDATE public.bookings 
SET status_updated_at = created_at 
WHERE status_updated_at IS NULL;

