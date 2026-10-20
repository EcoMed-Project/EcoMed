ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';

CREATE POLICY "Users upload own donation photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'donation-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own donation photos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'donation-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR has_role(auth.uid(), 'professional'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Users delete own donation photos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'donation-photos' AND (storage.foldername(name))[1] = auth.uid()::text);