# Quick Admin Setup - 3 Simple Steps

## ✅ Fastest Way to Create Admin Account

### Step 1: Register a Regular Account
1. Go to your website: `/register`
2. Fill in:
   - **Name**: Your name
   - **Email**: `admin@yourdomain.com` (or any email you want)
   - **Password**: Choose a secure password
3. Click **"Sign Up"**

### Step 2: Set Admin Role in Database
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this SQL (replace the email):

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@yourdomain.com';
```

3. Click **"Run"**

### Step 3: Login as Admin
1. Go to `/login` on your website
2. Enter the email and password from Step 1
3. You'll be **automatically redirected to `/admin`**! 🎉

---

## That's It!

No more confusing role changes. Just:
1. Register → 2. Run SQL → 3. Login

The admin account is now stored directly in the database with `role = 'admin'`.

---

## Create More Admins Later

Once you have one admin, you can create more through:
- **Admin Panel** → `/admin/admins` → "Create Admin" button
- Or use the same 3-step process above

---

## Verify Admin Account

To check if an account is admin:

```sql
SELECT email, display_name, role 
FROM public.profiles 
WHERE role = 'admin';
```

