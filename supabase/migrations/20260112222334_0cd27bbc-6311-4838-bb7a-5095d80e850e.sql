-- Phase 3: Add status column to quiz_participations for admin management
-- Phase 4: Add security_token and token_generated_at for anti-fraud

-- Add status column (default 'pending' for existing records)
ALTER TABLE public.quiz_participations 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- Add security token columns for anti-fraud
ALTER TABLE public.quiz_participations 
ADD COLUMN IF NOT EXISTS security_token TEXT,
ADD COLUMN IF NOT EXISTS token_generated_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster status queries
CREATE INDEX IF NOT EXISTS idx_quiz_participations_status ON public.quiz_participations(status);

-- Add index for prize_code lookups
CREATE INDEX IF NOT EXISTS idx_quiz_participations_prize_code ON public.quiz_participations(prize_code);

-- Phase 2: Create storage bucket for secret menu media (images/videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('secret-menu-media', 'secret-menu-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for secret menu media
CREATE POLICY "Anyone can view secret menu media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'secret-menu-media');

CREATE POLICY "Admin can upload secret menu media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'secret-menu-media');

CREATE POLICY "Admin can update secret menu media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'secret-menu-media');

CREATE POLICY "Admin can delete secret menu media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'secret-menu-media');