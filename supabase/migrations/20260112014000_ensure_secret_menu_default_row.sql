-- Ensure the admin editor always has one secret menu row to update.
-- Without an existing active row, the save button has no target menu id.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.secret_menu) THEN
    INSERT INTO public.secret_menu (
      week_start,
      menu_name,
      secret_code,
      valid_from,
      valid_to,
      is_active
    ) VALUES (
      date_trunc('week', now())::date,
      'Menu secret de la semaine',
      'SECRET',
      date_trunc('week', now()),
      date_trunc('week', now()) + interval '6 days 23 hours 59 minutes',
      true
    );
  END IF;
END $$;
