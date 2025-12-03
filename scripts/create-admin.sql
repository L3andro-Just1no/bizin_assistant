-- Run this in your Supabase SQL Editor to create an admin user
-- Step 1: First, create the user in Supabase Auth (do this in the Supabase Dashboard > Authentication > Users > Add user)
-- Email: admin@bizin.pt
-- Password: admin123

-- Step 2: Then run this SQL to add them to the admin_users table
-- Replace 'admin@bizin.pt' with the email you used when creating the auth user

INSERT INTO admin_users (email)
VALUES ('admin@bizin.pt')
ON CONFLICT (email) DO NOTHING;

-- Verify the admin was created
SELECT * FROM admin_users;

