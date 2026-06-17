-- Aurora schema — run in Supabase SQL editor

create table if not exists profiles (
  id uuid references auth.users primary key,
  name text not null default '',
  age int,
  gender text,
  height_cm float,
  weight_kg float,
  wake_time time,
  bedtime time,
  activity_level text,
  goals text[] default '{}',
  water_goal_ml int default 2500,
  personality text default 'chaotic',
  created_at timestamptz default now()
);

create table if not exists hydration_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  amount_ml int not null,
  logged_at timestamptz default now()
);

create table if not exists sleep_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  duration_hours float not null,
  logged_at date default current_date
);

create table if not exists habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  icon text default '⭐',
  frequency text default 'daily',
  status text default 'active',
  streak int default 0,
  created_at timestamptz default now()
);

create table if not exists habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text not null,
  logged_at date default current_date,
  unique(habit_id, logged_at)
);

create table if not exists mood_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  mood text not null,
  logged_at date default current_date,
  unique(user_id, logged_at)
);

create table if not exists nutrition_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  meal_type text not null,
  description text,
  logged_at date default current_date
);

alter table profiles enable row level security;
alter table hydration_logs enable row level security;
alter table sleep_logs enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table mood_logs enable row level security;
alter table nutrition_logs enable row level security;

create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id);

create policy "Users manage own hydration" on hydration_logs
  for all using (auth.uid() = user_id);

create policy "Users manage own sleep" on sleep_logs
  for all using (auth.uid() = user_id);

create policy "Users manage own habits" on habits
  for all using (auth.uid() = user_id);

create policy "Users manage own habit logs" on habit_logs
  for all using (auth.uid() = user_id);

create policy "Users manage own mood" on mood_logs
  for all using (auth.uid() = user_id);

create policy "Users manage own nutrition" on nutrition_logs
  for all using (auth.uid() = user_id);
