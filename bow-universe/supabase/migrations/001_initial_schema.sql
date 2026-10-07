create extension if not exists "pgcrypto";

create type public.bow_school as enum ('Babson', 'Olin', 'Wellesley');
create type public.connection_state as enum ('pending', 'confirmed', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  school public.bow_school not null,
  graduation_year int not null check (graduation_year between 2024 and 2040),
  major text not null,
  bio text check (char_length(bio) <= 500),
  location text,
  photo_url text,
  looking_for text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.organizations (id uuid primary key default gen_random_uuid(), name text not null, description text, website text, school public.bow_school, created_at timestamptz not null default now());
create table public.leadership_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, role_title text not null, organization_name text not null, organization_url text, short_description text, start_date date, end_date date, is_current boolean not null default true, created_at timestamptz not null default now());
create table public.projects (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade, name text not null, type text, description text, stage text, website text, skills_needed text[], created_at timestamptz not null default now());
create table public.organization_memberships (organization_id uuid references public.organizations(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, role text, primary key (organization_id,user_id));
create table public.project_members (project_id uuid references public.projects(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, role text, primary key (project_id,user_id));
create table public.skills (id uuid primary key default gen_random_uuid(), name text unique not null);
create table public.user_skills (user_id uuid references public.profiles(id) on delete cascade, skill_id uuid references public.skills(id) on delete cascade, primary key(user_id,skill_id));
create table public.interests (id uuid primary key default gen_random_uuid(), name text unique not null);
create table public.user_interests (user_id uuid references public.profiles(id) on delete cascade, interest_id uuid references public.interests(id) on delete cascade, primary key(user_id,interest_id));
create table public.connections (id uuid primary key default gen_random_uuid(), user_a uuid not null references public.profiles(id) on delete cascade, user_b uuid not null references public.profiles(id) on delete cascade, requested_by uuid not null references public.profiles(id), relationship_type text not null, context text, description text, state public.connection_state not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), constraint different_people check(user_a <> user_b), unique(user_a,user_b));
create table public.external_links (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, kind text not null, url text not null, unique(user_id,kind));

alter table public.profiles enable row level security;
alter table public.leadership_roles enable row level security;
alter table public.projects enable row level security;
alter table public.connections enable row level security;
create policy "Profiles are publicly discoverable" on public.profiles for select using (true);
create policy "People manage their own profile" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "Leadership is readable" on public.leadership_roles for select using (true);
create policy "People manage their leadership" on public.leadership_roles for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Projects are readable" on public.projects for select using (true);
create policy "People manage their projects" on public.projects for all using (auth.uid()=owner_id) with check (auth.uid()=owner_id);
create policy "Confirmed or involved connections are readable" on public.connections for select using (state='confirmed' or auth.uid() in (user_a,user_b));
create policy "People request connections" on public.connections for insert with check (auth.uid()=requested_by and auth.uid() in (user_a,user_b));
create policy "Recipients respond to connections" on public.connections for update using (auth.uid() in (user_a,user_b));
