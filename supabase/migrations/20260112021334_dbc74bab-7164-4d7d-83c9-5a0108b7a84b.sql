-- Create social posts table for admin actus management
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('instagram', 'facebook')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Public can read visible posts
CREATE POLICY "Anyone can view visible social posts" 
ON public.social_posts 
FOR SELECT 
USING (is_visible = true);

-- For now, allow inserts/updates/deletes without auth (admin panel uses password)
-- In production, you'd want proper auth
CREATE POLICY "Allow all operations for now" 
ON public.social_posts 
FOR ALL 
USING (true)
WITH CHECK (true);