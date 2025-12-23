/**
 * Script to create an admin account
 * 
 * Usage:
 * 1. Set environment variables:
 *    - SUPABASE_URL=your_supabase_url
 *    - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *    - ADMIN_EMAIL=admin@example.com
 *    - ADMIN_PASSWORD=secure_password_here
 *    - ADMIN_NAME=Admin Name
 * 
 * 2. Run: node scripts/create-admin.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n=== Create Admin Account ===\n');

    // Get admin details
    const email = process.env.ADMIN_EMAIL || await question('Enter admin email: ');
    const password = process.env.ADMIN_PASSWORD || await question('Enter admin password (min 6 characters): ');
    const displayName = process.env.ADMIN_NAME || await question('Enter admin display name: ');

    if (!email || !password || !displayName) {
      console.error('Error: Email, password, and display name are required');
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('Error: Password must be at least 6 characters');
      rl.close();
      process.exit(1);
    }

    console.log('\nCreating admin account...');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      rl.close();
      process.exit(1);
    }

    console.log('✓ Auth user created');

    // Create profile with admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        display_name: displayName,
        role: 'admin'
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, try to delete the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error('Error creating profile:', profileError.message);
      rl.close();
      process.exit(1);
    }

    console.log('✓ Admin profile created');
    console.log('\n=== Admin Account Created Successfully ===');
    console.log(`Email: ${email}`);
    console.log(`Display Name: ${displayName}`);
    console.log(`Role: admin`);
    console.log(`User ID: ${authData.user.id}`);
    console.log('\nYou can now log in with these credentials at /login\n');

    rl.close();
  } catch (error) {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  }
}

createAdmin();

