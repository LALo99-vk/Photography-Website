-- Create Admin Account Script
-- Run this in Supabase SQL Editor to create your first admin account
-- Replace the email and password with your desired admin credentials

-- Step 1: Create the user in Supabase Auth
-- Note: You'll need to do this through Supabase Dashboard → Authentication → Add User
-- OR use the Supabase Admin API
-- For now, we'll assume you create the auth user first, then run this to set the role

-- Step 2: After creating the auth user, update their profile to admin role
-- Replace 'your-admin-email@example.com' with the actual email you used to create the auth user

-- Option A: If you already have a user account, just update their role:
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';

-- Option B: If you want to create a new admin account from scratch:
-- First create the user in Supabase Dashboard → Authentication → Add User
-- Then run the UPDATE statement above with that user's email

-- To verify the admin was created:
-- SELECT id, email, display_name, role FROM public.profiles WHERE role = 'admin';

