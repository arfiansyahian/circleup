-- =========================================================
-- CIRCLE UP — RE:DATE  |  DATABASE SCHEMA (MVP)
-- Jalankan di Supabase SQL editor, urutan dari atas ke bawah.
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- ENUM TYPES ----------
create type app_role as enum ('participant', 'crew', 'admin');
create type dating_intent as enum ('casual', 'serious', 'open_to_both');
create type event_status as enum (
  'draft', 'open_registration', 'registration_closed', 'curation',
  'ready', 'check_in', 'opening', 'mingle', 'speed_dating',
  'chikology', 'match_reveal', 'closed'
);
create type registration_status as enum ('pending', 'approved', 'waitlist', 'rejected');
create type round_status as enum ('not_started', 'ready', 'active', 'time_up', 'voting', 'completed');
create type vote_choice as enum ('interested', 'maybe', 'not_for_me');
create type connection_status as enum ('pending', 'consented_a', 'consented_b', 'connected');
create type contact_channel as enum ('instagram', 'whatsapp');
create type referral_reward_status as enum ('none', 'pending', 'rewarded');

-- ---------- PROFILES (extends auth.users) ----------
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'participant',
  full_name text not null,
  nickname text not null,
  age int check (age >= 18),
  gender text,
  occupation text,
  city text,
  photo_url text,
  bio text,
  ask_me_about text,
  currently_into text,
  dating_intent dating_intent,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- INTERESTS ----------
create table interests (
  id serial primary key,
  name text unique not null
);

create table user_interests (
  user_id uuid references profiles(user_id) on delete cascade,
  interest_id int references interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

-- ---------- EVENTS ----------
create table events (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  date timestamptz not null,
  location text,
  capacity int not null default 20,
  duration_minutes int not null default 180,
  round_duration_minutes int not null default 6,
  number_of_rounds int not null default 6,
  status event_status not null default 'draft',
  cover_image_url text,
  created_at timestamptz not null default now()
);

-- ---------- REGISTRATIONS ----------
create table registrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(user_id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  status registration_status not null default 'pending',
  participant_code text unique,
  checked_in_at timestamptz,
  curation_notes text,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- ---------- MINGLE GAME (Human Bingo) ----------
create table mingle_challenges (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create table mingle_progress (
  user_id uuid references profiles(user_id) on delete cascade,
  challenge_id uuid references mingle_challenges(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- ---------- ROUNDS ----------
create table rounds (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  round_number int not null,
  duration_seconds int not null default 360,
  status round_status not null default 'not_started',
  server_start_at timestamptz,
  prompt text,
  created_at timestamptz not null default now(),
  unique (event_id, round_number)
);

-- ---------- PAIRINGS ----------
create table pairings (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid references rounds(id) on delete cascade,
  participant_a uuid references profiles(user_id) on delete cascade,
  participant_b uuid references profiles(user_id) on delete cascade,
  table_number int,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  check (participant_a <> participant_b)
);

-- ---------- VOTES (private) ----------
create table votes (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  round_id uuid references rounds(id) on delete cascade,
  voter_id uuid references profiles(user_id) on delete cascade,
  candidate_id uuid references profiles(user_id) on delete cascade,
  vote vote_choice not null,
  created_at timestamptz not null default now(),
  unique (event_id, voter_id, candidate_id)
);

-- ---------- MATCHES ----------
create table matches (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  user_a uuid references profiles(user_id) on delete cascade,
  user_b uuid references profiles(user_id) on delete cascade,
  matched_at timestamptz not null default now(),
  connection_status connection_status not null default 'pending',
  unique (event_id, user_a, user_b)
);

create table connect_consents (
  match_id uuid references matches(id) on delete cascade,
  user_id uuid references profiles(user_id) on delete cascade,
  channel contact_channel not null,
  consented_at timestamptz not null default now(),
  primary key (match_id, user_id, channel)
);

-- ---------- FEEDBACK ----------
create table feedback (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(user_id) on delete cascade,
  connection_score int check (connection_score between 1 and 5),
  comfort_score int check (comfort_score between 1 and 5),
  conversation_score int check (conversation_score between 1 and 5),
  overall_score int check (overall_score between 1 and 5),
  would_join_again boolean,
  notes text,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

-- ---------- REFERRALS ----------
create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references profiles(user_id) on delete cascade,
  referred_user_id uuid references profiles(user_id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  reward_status referral_reward_status not null default 'none',
  created_at timestamptz not null default now()
);

-- ---------- AUDIT LOG ----------
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(user_id),
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table registrations enable row level security;
alter table events enable row level security;
alter table rounds enable row level security;
alter table pairings enable row level security;
alter table votes enable row level security;
alter table matches enable row level security;
alter table connect_consents enable row level security;
alter table feedback enable row level security;
alter table referrals enable row level security;
alter table mingle_progress enable row level security;

-- helper: is current user admin/crew
create or replace function is_staff()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and role in ('admin', 'crew')
  );
$$;

-- profiles: user sees/edits own row; staff sees all
create policy "profiles_select_own_or_staff" on profiles
  for select using (user_id = auth.uid() or is_staff());
create policy "profiles_update_own" on profiles
  for update using (user_id = auth.uid());
create policy "profiles_insert_own" on profiles
  for insert with check (user_id = auth.uid());

-- events: public read for non-draft, staff full access
create policy "events_public_read" on events
  for select using (status <> 'draft' or is_staff());
create policy "events_staff_write" on events
  for all using (is_staff()) with check (is_staff());

-- registrations: own record or staff
create policy "registrations_select_own_or_staff" on registrations
  for select using (user_id = auth.uid() or is_staff());
create policy "registrations_insert_own" on registrations
  for insert with check (user_id = auth.uid());
create policy "registrations_staff_update" on registrations
  for update using (is_staff());

-- rounds: participants can read rounds of events they're registered to; staff full
create policy "rounds_select" on rounds
  for select using (
    is_staff() or exists (
      select 1 from registrations r
      where r.event_id = rounds.event_id and r.user_id = auth.uid() and r.status = 'approved'
    )
  );
create policy "rounds_staff_write" on rounds
  for all using (is_staff()) with check (is_staff());

-- pairings: a participant may only see pairing rows involving themselves
create policy "pairings_select_own_or_staff" on pairings
  for select using (is_staff() or participant_a = auth.uid() or participant_b = auth.uid());
create policy "pairings_staff_write" on pairings
  for all using (is_staff()) with check (is_staff());

-- votes: strictly private — only the voter (insert) and staff (read aggregate) can touch
create policy "votes_insert_own" on votes
  for insert with check (voter_id = auth.uid());
create policy "votes_select_own_or_staff" on votes
  for select using (voter_id = auth.uid() or is_staff());

-- matches: only the two participants involved, or staff
create policy "matches_select_own_or_staff" on matches
  for select using (is_staff() or user_a = auth.uid() or user_b = auth.uid());
create policy "matches_staff_write" on matches
  for all using (is_staff()) with check (is_staff());

-- connect consents: only participants in the match
create policy "consents_select_own_or_staff" on connect_consents
  for select using (is_staff() or user_id = auth.uid());
create policy "consents_insert_own" on connect_consents
  for insert with check (user_id = auth.uid());

-- feedback: own insert, staff read all
create policy "feedback_insert_own" on feedback
  for insert with check (user_id = auth.uid());
create policy "feedback_select_own_or_staff" on feedback
  for select using (user_id = auth.uid() or is_staff());

-- referrals
create policy "referrals_select_own_or_staff" on referrals
  for select using (referrer_id = auth.uid() or referred_user_id = auth.uid() or is_staff());
create policy "referrals_insert_own" on referrals
  for insert with check (referrer_id = auth.uid());

-- mingle progress: own read/write, staff read
create policy "mingle_select_own_or_staff" on mingle_progress
  for select using (user_id = auth.uid() or is_staff());
create policy "mingle_insert_own" on mingle_progress
  for insert with check (user_id = auth.uid());

-- =========================================================
-- REALTIME
-- =========================================================
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table pairings;
alter publication supabase_realtime add table matches;

-- =========================================================
-- SEED: default mingle challenges example (optional)
-- =========================================================
-- insert into mingle_challenges (event_id, label, sort_order) values (...);
