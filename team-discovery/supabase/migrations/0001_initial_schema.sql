-- CrewMatch initial schema. Apply through Supabase SQL Editor or Supabase CLI.
create extension if not exists pgcrypto;

create type public.discoverability as enum ('everyone','relevant','unavailable','hidden');
create type public.connection_status as enum ('pending','accepted','declined','withdrawn','disconnected');
create type public.opportunity_status as enum ('draft','open','paused','filled','closed','archived');
create type public.application_status as enum ('pending','shortlisted','accepted','rejected','withdrawn');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  full_name text not null check (char_length(full_name) between 2 and 80),
  headline text not null default '' check (char_length(headline) <= 120),
  bio text not null default '' check (char_length(bio) <= 700),
  avatar_url text,
  city text,
  state text,
  organization text,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  goals text[] not null default '{}',
  looking_for text[] not null default '{}',
  collaboration_preferences text[] not null default '{}',
  availability_hours integer check (availability_hours between 0 and 80),
  experience_level text check (experience_level in ('Beginner','Intermediate','Advanced')),
  preferred_duration text,
  discoverability public.discoverability not null default 'relevant',
  github_url text,
  linkedin_url text,
  portfolio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  summary text not null check (char_length(summary) between 15 and 300),
  description text not null check (char_length(description) between 30 and 8000),
  category text not null check (category in ('Hackathon','College Project','AI/ML','Web Development','Startup','Open Source','Research','Social Impact','Other')),
  project_stage text,
  problem_statement text,
  proposed_solution text,
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  open_roles text[] not null default '{}',
  weekly_hours integer not null check (weekly_hours between 1 and 80),
  collaboration_mode text not null check (collaboration_mode in ('Remote','Hybrid','In person')),
  duration text not null,
  city text,
  state text,
  start_date date,
  deadline date,
  external_event_name text,
  external_event_url text,
  repository_url text,
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  status public.opportunity_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (deadline is null or start_date is null or deadline >= start_date)
);
create index opportunities_status_created_idx on public.opportunities(status, created_at desc);
create index opportunities_owner_idx on public.opportunities(owner_id);
create index opportunities_skills_gin_idx on public.opportunities using gin(required_skills);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status public.connection_status not null default 'pending',
  message text check (char_length(message) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> recipient_id),
  unique (requester_id, recipient_id)
);
create index connections_recipient_status_idx on public.connections(recipient_id,status);
create index connections_requester_status_idx on public.connections(requester_id,status);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id <> blocked_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  role_title text,
  introduction text not null check (char_length(introduction) between 20 and 1200),
  relevant_skills text[] not null default '{}',
  portfolio_url text,
  availability_confirmed boolean not null default false,
  status public.application_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index applications_one_active_per_user_opportunity on public.applications(opportunity_id,applicant_id) where status in ('pending','shortlisted','accepted');
create index applications_owner_lookup_idx on public.applications(opportunity_id,status,created_at desc);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 1200),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  status text not null default 'active' check(status in ('active','paused','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check(role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key(team_id,user_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check(score between 0 and 100),
  component_scores jsonb not null default '{}',
  reasons jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique(user_id,candidate_id),
  check(user_id <> candidate_id)
);

create table public.saved_profiles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  saved_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,saved_profile_id),
  check(user_id <> saved_profile_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null check(char_length(title) <= 160),
  body text not null default '' check(char_length(body) <= 1000),
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications(user_id,created_at desc);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  connection_id uuid not null unique references public.connections(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(conversation_id,user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check(sender_id <> recipient_id)
);
create index messages_conversation_created_idx on public.messages(conversation_id,created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  reason text not null check(char_length(reason) between 3 and 80),
  details text not null default '' check(char_length(details) <= 2000),
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  check ((reported_user_id is not null)::int + (opportunity_id is not null)::int = 1)
);

-- Create profile rows from Supabase Auth signup metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  candidate_username text;
begin
  candidate_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), '[^a-zA-Z0-9_]', '', 'g'));
  candidate_username := left(candidate_username, 18);
  if length(candidate_username) < 3 then candidate_username := 'builder' || left(replace(new.id::text,'-',''), 8); end if;
  if exists(select 1 from public.profiles p where p.username = candidate_username) then
    candidate_username := left(candidate_username, 14) || '_' || left(replace(new.id::text,'-',''), 8);
  end if;
  insert into public.profiles(id,username,full_name)
  values(new.id,candidate_username,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1)))
  on conflict(id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- RLS: all policies use auth.uid(); clients use only the public anon/publishable key.
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.connections enable row level security;
alter table public.blocks enable row level security;
alter table public.applications enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.matches enable row level security;
alter table public.saved_profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

create or replace function public.is_blocked_pair(user_a uuid, user_b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = user_a and b.blocked_id = user_b)
       or (b.blocker_id = user_b and b.blocked_id = user_a)
  );
$$;

create or replace function public.is_team_member(team_uuid uuid, member_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.team_members tm where tm.team_id = team_uuid and tm.user_id = member_uuid);
$$;

create or replace function public.guard_connection_transition()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.requester_id <> old.requester_id or new.recipient_id <> old.recipient_id then
    raise exception 'Connection participants cannot be changed';
  end if;
  if old.status = 'pending' and new.status in ('accepted','declined') and auth.uid() = old.recipient_id then return new; end if;
  if old.status = 'pending' and new.status = 'withdrawn' and auth.uid() = old.requester_id then return new; end if;
  if old.status = 'accepted' and new.status = 'disconnected' and auth.uid() in (old.requester_id, old.recipient_id) then return new; end if;
  raise exception 'Invalid connection status transition';
end;
$$;
create trigger guard_connection_transition before update on public.connections for each row execute function public.guard_connection_transition();

create or replace function public.guard_application_transition()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare owner_uuid uuid;
begin
  if new.opportunity_id <> old.opportunity_id or new.applicant_id <> old.applicant_id then
    raise exception 'Application owner and opportunity cannot be changed';
  end if;
  select owner_id into owner_uuid from public.opportunities where id = old.opportunity_id;
  if auth.uid() = old.applicant_id and old.status in ('pending','shortlisted') and new.status = 'withdrawn' then return new; end if;
  if auth.uid() = owner_uuid and old.status in ('pending','shortlisted') and new.status in ('shortlisted','accepted','rejected') then
    new.reviewed_by := auth.uid(); new.reviewed_at := now(); return new;
  end if;
  raise exception 'Invalid application status transition';
end;
$$;
create trigger guard_application_transition before update on public.applications for each row execute function public.guard_application_transition();

create or replace function public.prevent_reverse_connection_duplicate()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if exists(select 1 from public.connections c where c.requester_id=new.recipient_id and c.recipient_id=new.requester_id and c.status in ('pending','accepted')) then
    raise exception 'A connection request already exists in the opposite direction';
  end if;
  return new;
end;
$$;
create trigger prevent_reverse_connection_duplicate before insert on public.connections for each row execute function public.prevent_reverse_connection_duplicate();

create policy "Discoverable profiles can be read by authenticated users" on public.profiles for select to authenticated using (
  id = (select auth.uid()) or (discoverability in ('everyone','relevant') and not public.is_blocked_pair((select auth.uid()), id))
);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check(id = (select auth.uid()));
create policy "Users update own profile" on public.profiles for update to authenticated using(id = (select auth.uid())) with check(id = (select auth.uid()));

create policy "Public open opportunities are readable" on public.opportunities for select to authenticated using (
  owner_id = (select auth.uid()) or (visibility = 'public' and status <> 'archived')
);
create policy "Users create own opportunities" on public.opportunities for insert to authenticated with check(owner_id = (select auth.uid()));
create policy "Owners update opportunities" on public.opportunities for update to authenticated using(owner_id = (select auth.uid())) with check(owner_id = (select auth.uid()));
create policy "Owners delete opportunities" on public.opportunities for delete to authenticated using(owner_id = (select auth.uid()));

create policy "Participants read connections" on public.connections for select to authenticated using(requester_id = (select auth.uid()) or recipient_id = (select auth.uid()));
create policy "Requester creates connection" on public.connections for insert to authenticated with check(requester_id = (select auth.uid()) and not exists(select 1 from public.blocks b where (b.blocker_id=requester_id and b.blocked_id=recipient_id) or (b.blocker_id=recipient_id and b.blocked_id=requester_id)));
create policy "Participants update connection" on public.connections for update to authenticated using(requester_id = (select auth.uid()) or recipient_id = (select auth.uid())) with check(requester_id = (select auth.uid()) or recipient_id = (select auth.uid()));
create policy "Users manage own blocks" on public.blocks for select to authenticated using(blocker_id = (select auth.uid()));
create policy "Users create own blocks" on public.blocks for insert to authenticated with check(blocker_id = (select auth.uid()));
create policy "Users remove own blocks" on public.blocks for delete to authenticated using(blocker_id = (select auth.uid()));

create policy "Applicant and owner read applications" on public.applications for select to authenticated using(applicant_id = (select auth.uid()) or exists(select 1 from public.opportunities o where o.id=opportunity_id and o.owner_id=(select auth.uid())));
create policy "Users apply as themselves" on public.applications for insert to authenticated with check(applicant_id = (select auth.uid()) and exists(select 1 from public.opportunities o where o.id=opportunity_id and o.status='open' and o.owner_id <> (select auth.uid())));
create policy "Applicant or owner updates application" on public.applications for update to authenticated using(applicant_id=(select auth.uid()) or exists(select 1 from public.opportunities o where o.id=opportunity_id and o.owner_id=(select auth.uid()))) with check(applicant_id=(select auth.uid()) or exists(select 1 from public.opportunities o where o.id=opportunity_id and o.owner_id=(select auth.uid())));

create policy "Team members read teams" on public.teams for select to authenticated using(owner_id=(select auth.uid()) or public.is_team_member(id,(select auth.uid())));
create policy "Owners create teams" on public.teams for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "Owners update teams" on public.teams for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "Members read team membership" on public.team_members for select to authenticated using(user_id=(select auth.uid()) or public.is_team_member(team_id,(select auth.uid())));
create policy "Owner adds self to team" on public.team_members for insert to authenticated with check(user_id=(select auth.uid()) or exists(select 1 from public.teams t where t.id=team_id and t.owner_id=(select auth.uid())));
create policy "User leaves team or owner manages membership" on public.team_members for delete to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.teams t where t.id=team_id and t.owner_id=(select auth.uid())));

create policy "Users read own match snapshots" on public.matches for select to authenticated using(user_id=(select auth.uid()));
create policy "Users save profiles as themselves" on public.saved_profiles for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Users read own notifications" on public.notifications for select to authenticated using(user_id=(select auth.uid()));
create policy "Users update own notifications" on public.notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create policy "Conversation members read conversations" on public.conversations for select to authenticated using(exists(select 1 from public.conversation_members cm where cm.conversation_id=id and cm.user_id=(select auth.uid())));
create policy "Connection participants create conversation" on public.conversations for insert to authenticated with check(exists(select 1 from public.connections c where c.id=connection_id and c.status='accepted' and (c.requester_id=(select auth.uid()) or c.recipient_id=(select auth.uid()))));
create policy "Members read conversation memberships" on public.conversation_members for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.conversation_members cm where cm.conversation_id=conversation_id and cm.user_id=(select auth.uid())));
create policy "Accepted connection participants join conversations" on public.conversation_members for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.conversations cv join public.connections c on c.id=cv.connection_id where cv.id=conversation_id and c.status='accepted' and (c.requester_id=(select auth.uid()) or c.recipient_id=(select auth.uid()))));
create policy "Conversation participants read messages" on public.messages for select to authenticated using(sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
create policy "Send messages only to accepted connections" on public.messages for insert to authenticated with check(sender_id=(select auth.uid()) and exists(select 1 from public.connections c where c.status='accepted' and ((c.requester_id=sender_id and c.recipient_id=recipient_id) or (c.requester_id=recipient_id and c.recipient_id=sender_id))) and not exists(select 1 from public.blocks b where (b.blocker_id=sender_id and b.blocked_id=recipient_id) or (b.blocker_id=recipient_id and b.blocked_id=sender_id)));
create policy "Recipients mark messages read" on public.messages for update to authenticated using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));

create policy "Users create reports" on public.reports for insert to authenticated with check(reporter_id=(select auth.uid()) and (reported_user_id is null or reported_user_id <> (select auth.uid())));
create policy "Users read own reports" on public.reports for select to authenticated using(reporter_id=(select auth.uid()));

-- Realtime can be enabled for messages and notifications from the Supabase dashboard.
