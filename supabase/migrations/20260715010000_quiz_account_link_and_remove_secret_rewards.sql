-- Quiz premium: every participation is attached to a verified Supabase account.
alter table public.quiz_participations
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_quiz_participations_user_week
  on public.quiz_participations(user_id, week_start desc);

-- A signed-in client may read only their own quiz history and prize codes.
drop policy if exists "Users can view own quiz participations" on public.quiz_participations;
create policy "Users can view own quiz participations"
on public.quiz_participations
for select
to authenticated
using (user_id = auth.uid());

-- Prize creation remains server-side through the quiz-submit Edge Function.
-- Secret-menu columns/tables are intentionally preserved for migration safety,
-- but the quiz no longer writes to or returns secret-menu access codes.
