-- Add media fields used by the admin secret menu editor.
-- Without these columns, saving the menu can fail when the edge function updates photo/video URLs.

ALTER TABLE public.secret_menu
  ADD COLUMN IF NOT EXISTS galette_special_image_url text,
  ADD COLUMN IF NOT EXISTS galette_special_video_url text,
  ADD COLUMN IF NOT EXISTS crepe_special_image_url text,
  ADD COLUMN IF NOT EXISTS crepe_special_video_url text;
