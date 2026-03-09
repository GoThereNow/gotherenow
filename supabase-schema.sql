-- ============================================
-- GoThereNow — Supabase Database Setup
-- Run this entire file in your Supabase SQL Editor
-- ============================================

-- 1. PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  bio text,
  role text default 'user', -- 'user' or 'influencer'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. INFLUENCERS
create table public.influencers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  handle text unique not null,
  instagram_url text,
  tiktok_url text,
  follower_count integer default 0,
  recommendation_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. RECOMMENDATIONS
create table public.recommendations (
  id uuid default gen_random_uuid() primary key,
  influencer_id uuid references public.influencers(id) on delete cascade,
  hotel_name text not null,
  city text not null,
  country text not null,
  latitude double precision,
  longitude double precision,
  influencer_quote text,
  star_rating integer default 5,
  price_from integer,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. BOOKING LINKS
create table public.booking_links (
  id uuid default gen_random_uuid() primary key,
  recommendation_id uuid references public.recommendations(id) on delete cascade,
  platform text not null, -- 'Booking.com', 'Expedia', 'Direct', etc.
  affiliate_url text not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.influencers enable row level security;
alter table public.recommendations enable row level security;
alter table public.booking_links enable row level security;

-- PROFILES: users can read all, edit only their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- INFLUENCERS: anyone can read, only owner can write
create policy "Influencers are viewable by everyone" on public.influencers for select using (true);
create policy "Influencer can insert own record" on public.influencers for insert with check (auth.uid() = user_id);
create policy "Influencer can update own record" on public.influencers for update using (auth.uid() = user_id);

-- RECOMMENDATIONS: anyone can read, only influencer can write
create policy "Recommendations are viewable by everyone" on public.recommendations for select using (true);
create policy "Influencer can insert own recommendations" on public.recommendations for insert
  with check (influencer_id in (select id from public.influencers where user_id = auth.uid()));
create policy "Influencer can update own recommendations" on public.recommendations for update
  using (influencer_id in (select id from public.influencers where user_id = auth.uid()));
create policy "Influencer can delete own recommendations" on public.recommendations for delete
  using (influencer_id in (select id from public.influencers where user_id = auth.uid()));

-- BOOKING LINKS: anyone can read, influencer can write
create policy "Booking links are viewable by everyone" on public.booking_links for select using (true);
create policy "Influencer can insert booking links" on public.booking_links for insert
  with check (recommendation_id in (
    select r.id from public.recommendations r
    join public.influencers i on i.id = r.influencer_id
    where i.user_id = auth.uid()
  ));
create policy "Influencer can delete booking links" on public.booking_links for delete
  using (recommendation_id in (
    select r.id from public.recommendations r
    join public.influencers i on i.id = r.influencer_id
    where i.user_id = auth.uid()
  ));
