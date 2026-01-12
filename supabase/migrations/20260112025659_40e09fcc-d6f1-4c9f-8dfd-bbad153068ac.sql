-- Create table for on-site post interactions (likes/comments)
CREATE TABLE public.post_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment')),
  device_fingerprint TEXT NOT NULL,
  comment_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_interactions ENABLE ROW LEVEL SECURITY;

-- Public can read interactions (for counts)
CREATE POLICY "Anyone can view interactions"
ON public.post_interactions
FOR SELECT
USING (true);

-- Anyone can add interactions (controlled by device fingerprint for anti-spam)
CREATE POLICY "Anyone can add interactions"
ON public.post_interactions
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_post_interactions_post_id ON public.post_interactions(post_id);
CREATE INDEX idx_post_interactions_device ON public.post_interactions(device_fingerprint, post_id);