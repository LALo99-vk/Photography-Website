-- Fix: Add missing INSERT policy for profiles table
-- This allows users to create their own profile when they first log in

-- Drop policy if it exists (in case you're re-running this migration)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create the INSERT policy
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

