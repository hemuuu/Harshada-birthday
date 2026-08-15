create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now(),
  is_hidden boolean not null default false
);

create table if not exists public.room_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('photo','painting','decor')),
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;
alter table public.room_assets enable row level security;

create policy "Anyone can read visible notes" on public.notes
for select using (is_hidden = false);
create policy "Anyone can add notes" on public.notes
for insert with check (char_length(name) between 1 and 60 and char_length(message) between 1 and 500);

create policy "Anyone can read room assets" on public.room_assets
for select using (true);

-- Admin writes/deletes should be done through a server-side API/Edge Function.
-- Do NOT expose a Supabase service_role key in the browser.
-- For the first prototype, admin actions are stored locally; production setup should add an Edge Function.

insert into public.notes (name, message) values
('A little reminder', 'You are so loved. ♡')
on conflict do nothing;
