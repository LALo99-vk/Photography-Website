-- Fix: Remove recursive policy that causes infinite recursion during profile INSERT
-- The admin view all profiles policy was checking profiles table during INSERT, causing recursion

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins and photographers can view all profiles" ON public.profiles;

-- Note: Admin access to all profiles will be handled through the backend API
-- which uses the service role key (bypasses RLS). This avoids recursion issues.
-- For frontend, users can only view their own profile, which is the correct behavior.
