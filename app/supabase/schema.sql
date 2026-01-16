-- Supabase schema for icecream game content
-- Run this in the Supabase SQL editor to set up tables

-- Cities table
create table if not exists cities (
  id text primary key,                    -- e.g., "los-angeles-ca"
  name text not null,                     -- e.g., "Los Angeles"
  state text not null,                    -- e.g., "CA"
  overview text not null,                 -- narrative overview
  pulse jsonb not null,                   -- CityPulse values
  playability_rationale text,
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Neighborhoods table
create table if not exists neighborhoods (
  id text primary key,                    -- e.g., "los-angeles-ca-east-la"
  city_id text not null references cities(id) on delete cascade,
  name text not null,                     -- e.g., "East LA"
  description text not null,              -- one-sentence characterization
  pulse jsonb not null,                   -- NeighborhoodPulse values
  rationale text,                         -- why this neighborhood is interesting
  event_pool jsonb,                       -- default neighborhood events
  enabled boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast city lookups
create index if not exists neighborhoods_city_id_idx on neighborhoods(city_id);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to both tables
drop trigger if exists cities_updated_at on cities;
create trigger cities_updated_at
  before update on cities
  for each row execute function update_updated_at();

drop trigger if exists neighborhoods_updated_at on neighborhoods;
create trigger neighborhoods_updated_at
  before update on neighborhoods
  for each row execute function update_updated_at();

-- Row Level Security (optional but recommended)
alter table cities enable row level security;
alter table neighborhoods enable row level security;

-- Public read access (anon key can read enabled content)
create policy "Public can read enabled cities"
  on cities for select
  using (enabled = true);

create policy "Public can read enabled neighborhoods"
  on neighborhoods for select
  using (enabled = true);

-- Service role can do everything (for admin/content generation)
create policy "Service role full access to cities"
  on cities for all
  using (auth.role() = 'service_role');

create policy "Service role full access to neighborhoods"
  on neighborhoods for all
  using (auth.role() = 'service_role');
