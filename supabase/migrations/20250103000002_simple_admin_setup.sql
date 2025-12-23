-- Simple Admin Account Setup
-- This script helps you create an admin account directly in the database
-- 
-- INSTRUCTIONS:
-- 1. First, create a user account through your website registration (/register)
--    OR create a user in Supabase Dashboard → Authentication → Add User
-- 
-- 2. Then run this SQL, replacing 'your-email@example.com' with your actual email:

-- Set existing user to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify the admin was created
SELECT 
  id,
  email,
  display_name,
  role,
  created_at
FROM public.profiles 
WHERE role = 'admin';

-- That's it! Now you can log in with that email and password at /login
-- You'll be automatically redirected to /admin

