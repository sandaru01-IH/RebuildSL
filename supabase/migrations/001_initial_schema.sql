-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT NOT NULL DEFAULT 'government_agent' CHECK (role IN ('admin', 'government_agent'))
);

-- Create damage_reports table
CREATE TABLE IF NOT EXISTS damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gnd_code TEXT,
  gnd_name TEXT,
  location GEOGRAPHY(POINT, 4326),
  property_type TEXT NOT NULL,
  property_condition TEXT NOT NULL,
  damage_level INTEGER NOT NULL CHECK (damage_level >= 1 AND damage_level <= 10),
  estimated_damage_lkr NUMERIC NOT NULL,
  affected_residents INTEGER NOT NULL CHECK (affected_residents >= 0),
  description TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Create support_posts table
CREATE TABLE IF NOT EXISTS support_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  support_type TEXT NOT NULL,
  description TEXT NOT NULL,
  location_preference TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'inactive'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_damage_reports_gnd_code ON damage_reports(gnd_code);
CREATE INDEX IF NOT EXISTS idx_damage_reports_location ON damage_reports USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_damage_reports_created_at ON damage_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_support_posts_status ON support_posts(status);
CREATE INDEX IF NOT EXISTS idx_support_posts_created_at ON support_posts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public can insert damage reports
CREATE POLICY "Public can insert damage reports"
  ON damage_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public can view only aggregated stats (no personal data)
-- This will be handled via API routes, but we set a restrictive policy
CREATE POLICY "Public cannot view damage reports"
  ON damage_reports FOR SELECT
  TO anon, authenticated
  USING (false);

-- Public can insert and view support posts
CREATE POLICY "Public can insert support posts"
  ON support_posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can view active support posts"
  ON support_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Admin users can view all damage reports
CREATE POLICY "Admins can view all damage reports"
  ON damage_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admin users can update damage reports
CREATE POLICY "Admins can update damage reports"
  ON damage_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Admin users can view all support posts
CREATE POLICY "Admins can view all support posts"
  ON support_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

