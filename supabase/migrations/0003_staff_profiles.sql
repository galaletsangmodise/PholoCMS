
-- Links Supabase Auth users to a role

create table staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('reception', 'clinical', 'manager')),
  facility_id text not null, -- which clinic this person works at
  created_at timestamptz not null default now()
);

-- Anyone logged in can read their OWN profile, to find out their own role —
-- but not anyone else's. This is the first real, non-permissive RLS policy
-- in the project 
alter table staff_profiles enable row level security;

create policy "staff_can_read_own_profile" on staff_profiles
  for select
  using (auth.uid() = id);