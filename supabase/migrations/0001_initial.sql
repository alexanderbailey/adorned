-- ============================================================
-- Adorned — Phase 1 schema
-- Apply via Supabase SQL editor
-- ============================================================

-- profiles: one row per auth user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  palette_preset text,
  palette_swatches jsonb not null default '[]',
  style_description text,
  style_summary text,
  body_photo_url text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inspo_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create type item_category as enum (
  'tops', 'bottoms', 'skirts', 'dresses', 'outerwear',
  'shoes', 'bags', 'accessories', 'jewellery'
);

create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_image_url text not null,
  cutout_image_url text not null,
  thumb_image_url text,
  category item_category not null,
  subcategory text,
  primary_color_hex text,
  primary_color_name text,
  secondary_colors jsonb default '[]',
  material text,
  pattern text,
  season text[],
  formality text,
  palette_fit_tags text[],
  ai_description text,
  user_notes text,
  archived bool not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index items_user_category_idx on items (user_id, category) where not archived;

create table outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  prompt text,
  prompt_chips jsonb default '{}',
  ai_reasoning text,
  favorited bool not null default false,
  created_at timestamptz not null default now()
);

create table outfit_items (
  outfit_id uuid not null references outfits(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  slot int not null default 0,
  primary key (outfit_id, item_id)
);

create table wear_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  outfit_id uuid not null references outfits(id) on delete cascade,
  worn_on date not null,
  created_at timestamptz not null default now()
);
create index wear_log_user_date_idx on wear_log (user_id, worn_on desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles      enable row level security;
alter table inspo_images  enable row level security;
alter table items         enable row level security;
alter table outfits       enable row level security;
alter table outfit_items  enable row level security;
alter table wear_log      enable row level security;

create policy "own profile"      on profiles      for all using (id = auth.uid());
create policy "own inspo"        on inspo_images  for all using (user_id = auth.uid());
create policy "own items"        on items         for all using (user_id = auth.uid());
create policy "own outfits"      on outfits       for all using (user_id = auth.uid());
create policy "own outfit_items" on outfit_items  for all using (
  exists (select 1 from outfits o where o.id = outfit_id and o.user_id = auth.uid())
);
create policy "own wear_log"     on wear_log      for all using (user_id = auth.uid());

-- ============================================================
-- Auto-update updated_at trigger
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger items_updated_at before update on items
  for each row execute function update_updated_at();

-- ============================================================
-- Storage buckets (create manually in Supabase dashboard,
-- or via CLI: supabase storage create items inspo body)
-- Each bucket should be private with path-level RLS policies.
--
-- Bucket names:  items | inspo | body
-- Path convention: {user_id}/{item_id}/original.webp etc.
-- ============================================================
