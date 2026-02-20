
-- Create app_role enum
create type public.app_role as enum ('admin', 'student', 'vendor', 'vendor_employee', 'hostel_manager', 'super_admin');

-- Create user_roles table (separate from profiles to prevent privilege escalation)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Security definer function to check roles (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Users can only read their own role
create policy "Users can read own role"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Service role can manage all roles
create policy "Service role can manage all roles"
  on public.user_roles
  for all
  to service_role
  using (true)
  with check (true);
