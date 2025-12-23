-- Add deletion tracking fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add index for deleted bookings
CREATE INDEX IF NOT EXISTS idx_bookings_deleted_at ON public.bookings (deleted_at);

-- Update status check to include 'deleted' status
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'could_not_do', 'deleted'));

