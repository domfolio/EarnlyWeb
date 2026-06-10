create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  setup_completed boolean not null default false,
  selected_job_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workplace_name text not null,
  default_hourly_rate numeric(10, 2) not null check (default_hourly_rate >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_selected_job_id_fkey;

alter table public.profiles
  add constraint profiles_selected_job_id_fkey
  foreign key (selected_job_id) references public.jobs(id) on delete set null;

create table if not exists public.shift_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  work_date date not null,
  week_start_date date not null,
  start_time time,
  end_time time,
  break_minutes integer not null default 0 check (break_minutes >= 0),
  hourly_rate_override numeric(10, 2) check (hourly_rate_override >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, work_date)
);

create index if not exists jobs_user_id_idx on public.jobs(user_id);
create index if not exists jobs_active_user_idx on public.jobs(user_id) where archived_at is null;
create index if not exists shift_entries_user_idx on public.shift_entries(user_id);
create index if not exists shift_entries_job_week_idx on public.shift_entries(job_id, week_start_date);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

drop trigger if exists shift_entries_set_updated_at on public.shift_entries;
create trigger shift_entries_set_updated_at
before update on public.shift_entries
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.shift_entries enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can view own jobs" on public.jobs;
create policy "Users can view own jobs"
on public.jobs for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own jobs" on public.jobs;
create policy "Users can insert own jobs"
on public.jobs for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own jobs" on public.jobs;
create policy "Users can update own jobs"
on public.jobs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own jobs" on public.jobs;
create policy "Users can delete own jobs"
on public.jobs for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own shift entries" on public.shift_entries;
create policy "Users can view own shift entries"
on public.shift_entries for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own shift entries" on public.shift_entries;
create policy "Users can insert own shift entries"
on public.shift_entries for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own shift entries" on public.shift_entries;
create policy "Users can update own shift entries"
on public.shift_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own shift entries" on public.shift_entries;
create policy "Users can delete own shift entries"
on public.shift_entries for delete
using (auth.uid() = user_id);
