-- Block direct client modifications to social_posts
-- All write operations must go through Edge Functions with admin password validation

-- Create policy to block direct INSERT
CREATE POLICY "Block direct inserts" ON public.social_posts
FOR INSERT WITH CHECK (false);

-- Create policy to block direct UPDATE  
CREATE POLICY "Block direct updates" ON public.social_posts
FOR UPDATE USING (false);

-- Create policy to block direct DELETE
CREATE POLICY "Block direct deletes" ON public.social_posts
FOR DELETE USING (false);