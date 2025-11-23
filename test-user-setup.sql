-- Test User Setup Script
-- Run this in your Supabase SQL Editor to create a test user that bypasses authentication

-- Insert test user directly into auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'test@laya.app',
  '$2a$10$DUMMY_ENCRYPTED_PASSWORD_HASH_FOR_TEST',
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the test user was created
SELECT id, email, email_confirmed_at FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';

