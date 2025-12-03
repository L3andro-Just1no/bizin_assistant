-- Storage bucket setup for Supabase
-- Run these in the Supabase dashboard SQL editor or via CLI

-- Create knowledge-base bucket (admin-uploaded documents for RAG)
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-base', 'knowledge-base', false);

-- Create user-uploads bucket (paid session document uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', false);

-- Create reports bucket (generated PDF reports)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true);

-- Storage policies for knowledge-base bucket
CREATE POLICY "Admins can upload to knowledge-base" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'knowledge-base' AND
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Admins can update knowledge-base" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'knowledge-base' AND
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Admins can delete from knowledge-base" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'knowledge-base' AND
    auth.uid() IN (SELECT id FROM admin_users)
  );

CREATE POLICY "Anyone can read knowledge-base" ON storage.objects
  FOR SELECT USING (bucket_id = 'knowledge-base');

-- Storage policies for user-uploads bucket
CREATE POLICY "Anyone can upload to user-uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-uploads');

CREATE POLICY "Anyone can read user-uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-uploads');

-- Storage policies for reports bucket (public read)
CREATE POLICY "Service role can upload reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Anyone can read reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'reports');

