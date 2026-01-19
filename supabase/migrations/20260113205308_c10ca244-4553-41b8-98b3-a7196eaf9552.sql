DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'quiz_participations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_participations;
  END IF;
END $$;
