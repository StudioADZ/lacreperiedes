-- Fix post_interactions INSERT policy to require device_fingerprint
DROP POLICY IF EXISTS "Anyone can add interactions" ON public.post_interactions;

-- More restrictive INSERT: require device_fingerprint to be non-empty
CREATE POLICY "Add interactions with fingerprint"
ON public.post_interactions
FOR INSERT
WITH CHECK (
    device_fingerprint IS NOT NULL 
    AND device_fingerprint != ''
    AND LENGTH(device_fingerprint) >= 5
    AND LENGTH(device_fingerprint) <= 50
);