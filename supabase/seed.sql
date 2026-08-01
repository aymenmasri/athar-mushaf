-- Local development fixture only. Supabase CLI applies this file during a
-- local database reset; do not execute it against a production project.
--
-- The owner has no email, password, token, or auth identity, so it cannot be
-- used to sign in. The dedication remains unlisted and receives its opaque
-- 128-bit slug from the same database trigger as every other dedication.
-- Quran text is never inserted into user-data tables.

begin;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  '{"provider":"local-seed","providers":[]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.dedications (
  id,
  recipient_name,
  recipient_status,
  giver_name,
  message,
  theme_key,
  visibility,
  created_by,
  is_active
)
values (
  '20000000-0000-4000-8000-000000000001',
  'محمود ووحيدة المصري',
  'deceased',
  'أيمن وحاتم المصري',
  'اللهم ارحمهما واغفر لهما، واجعل القرآن نورًا لهما في قبريهما، ورفعةً في درجاتهما، واجزهما عنا خير الجزاء، واجمعنا بهما في جنات النعيم.',
  'emerald',
  'unlisted',
  '10000000-0000-4000-8000-000000000001',
  true
)
on conflict (id) do update
set
  recipient_name = excluded.recipient_name,
  recipient_status = excluded.recipient_status,
  giver_name = excluded.giver_name,
  message = excluded.message,
  theme_key = excluded.theme_key,
  visibility = excluded.visibility,
  is_active = excluded.is_active;

commit;
