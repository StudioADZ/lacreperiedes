-- Add length constraints to messages table to prevent resource exhaustion
-- Using triggers instead of CHECK constraints for flexibility

-- Create validation function for messages
CREATE OR REPLACE FUNCTION public.validate_message_lengths()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate sender_name length
  IF length(NEW.sender_name) > 100 THEN
    RAISE EXCEPTION 'sender_name cannot exceed 100 characters';
  END IF;
  
  -- Validate sender_email length
  IF NEW.sender_email IS NOT NULL AND length(NEW.sender_email) > 254 THEN
    RAISE EXCEPTION 'sender_email cannot exceed 254 characters';
  END IF;
  
  -- Validate sender_phone length
  IF NEW.sender_phone IS NOT NULL AND length(NEW.sender_phone) > 20 THEN
    RAISE EXCEPTION 'sender_phone cannot exceed 20 characters';
  END IF;
  
  -- Validate subject length
  IF NEW.subject IS NOT NULL AND length(NEW.subject) > 200 THEN
    RAISE EXCEPTION 'subject cannot exceed 200 characters';
  END IF;
  
  -- Validate message length
  IF length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'message cannot exceed 5000 characters';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for message validation
DROP TRIGGER IF EXISTS validate_message_insert ON public.messages;
CREATE TRIGGER validate_message_insert
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_message_lengths();

-- Ensure old public read policy on admin_settings is dropped (defensive cleanup)
DROP POLICY IF EXISTS "Anyone can read settings" ON public.admin_settings;