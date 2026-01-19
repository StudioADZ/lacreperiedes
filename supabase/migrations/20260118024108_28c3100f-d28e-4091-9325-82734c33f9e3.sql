-- =====================================================
-- SAFE PATCH: message length validation + defensive cleanup
-- =====================================================

-- 1) Create a new validation function (avoid clobbering an existing one)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'validate_message_lengths_v2'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.validate_message_lengths_v2()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SET search_path = public
      AS $$
      BEGIN
        -- sender_name
        IF NEW.sender_name IS NULL OR length(NEW.sender_name) < 1 THEN
          RAISE EXCEPTION USING ERRCODE = '23502', MESSAGE = 'sender_name is required';
        END IF;

        IF length(NEW.sender_name) > 100 THEN
          RAISE EXCEPTION USING ERRCODE = '22001', MESSAGE = 'sender_name cannot exceed 100 characters';
        END IF;

        -- sender_email
        IF NEW.sender_email IS NOT NULL AND length(NEW.sender_email) > 254 THEN
          RAISE EXCEPTION USING ERRCODE = '22001', MESSAGE = 'sender_email cannot exceed 254 characters';
        END IF;

        -- sender_phone
        IF NEW.sender_phone IS NOT NULL AND length(NEW.sender_phone) > 20 THEN
          RAISE EXCEPTION USING ERRCODE = '22001', MESSAGE = 'sender_phone cannot exceed 20 characters';
        END IF;

        -- subject
        IF NEW.subject IS NOT NULL AND length(NEW.subject) > 200 THEN
          RAISE EXCEPTION USING ERRCODE = '22001', MESSAGE = 'subject cannot exceed 200 characters';
        END IF;

        -- message
        IF NEW.message IS NULL OR length(NEW.message) < 1 THEN
          RAISE EXCEPTION USING ERRCODE = '23502', MESSAGE = 'message is required';
        END IF;

        IF length(NEW.message) > 5000 THEN
          RAISE EXCEPTION USING ERRCODE = '22001', MESSAGE = 'message cannot exceed 5000 characters';
        END IF;

        RETURN NEW;
      END;
      $$;
    $fn$;
  END IF;
END $$;

-- 2) Trigger: validate on INSERT and UPDATE (covers both paths)
DROP TRIGGER IF EXISTS validate_message_write ON public.messages;

CREATE TRIGGER validate_message_write
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_message_lengths_v2();

-- 3) Defensive cleanup: remove old public read policy on admin_settings (if it exists)
DROP POLICY IF EXISTS "Anyone can read settings" ON public.admin_settings;
