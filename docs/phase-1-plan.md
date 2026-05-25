# Adorned — Phase 1 Plan

A personal wardrobe + outfit-styling PWA for a single user (Becca). Phase 1 ships a fully working app with flat-lay outfit visualization. Phases 2 and 3 add AI lookbook and real VTON try-on respectively.

## Locked decisions (from grilling session)

| Decision | Choice |
|---|---|
| Platform | Mobile-first PWA |
| Users | Single user (Becca), magic-link auth |
| Frontend | Next.js (App Router) + TypeScript |
| Styling | Tailwind, neutral editorial palette |
| Backend | Supabase (Postgres + Storage + Auth + RLS) |
| Deploy | Vercel free tier |
| Bg removal | Browser-side `@imgly/background-removal` (WASM) |
| Item tagging AI | Claude Haiku 4.5 (vision) |
| Outfit generation AI | Claude Sonnet 4.6 (text-only over item descriptions) |
| Style profile | Free-text + inspo photos, AI-synthesized canonical summary |
| Palette | 12-season preset picker + editable swatches |
| Categories | Tops, Bottoms, Skirts, Dresses, Outerwear, Shoes, Bags, Accessories, Jewellery (+ AI-tagged subcategories) |
| Outfit gen UX | Free-text prompt + optional chips → 3 outfits w/ reasoning |
| Manual builder | Tap-to-add from category drawers, auto-arranged flat-lay |
| Visualization | Phase 1: flat-lay only. Phase 2: AI lookbook. Phase 3: real VTON. |
| Persistence | All outfits saved, favorite + wear-log + delete |

## Out of scope for Phase 1
- AI lookbook tier (Phase 2)
- Real VTON tier (Phase 3)
- Calendar planning view
- Weather integration
- Multi-user / sharing
- Native mobile (Expo)

## Schema

```sql
-- profiles: one row per auth user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  palette_preset text,                              -- e.g. 'soft-summer'
  palette_swatches jsonb not null default '[]',     -- [{name, hex}]
  style_description text,                           -- raw free-text from user
  style_summary text,                               -- AI-synthesized canonical summary
  body_photo_url text,                              -- reference photo for try-on (Phase 2+)
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
  subcategory text,                                 -- 'blouse', 'jeans', etc — AI freeform
  primary_color_hex text,
  primary_color_name text,
  secondary_colors jsonb default '[]',              -- [{name, hex}]
  material text,
  pattern text,
  season text[],                                    -- ['spring','summer','fall','winter']
  formality text,                                   -- 'casual','smart-casual','formal'
  palette_fit_tags text[],                          -- ['matches:dusty-rose']
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
  source text not null,                             -- 'generated' | 'manual'
  prompt text,                                      -- free-text prompt if generated
  prompt_chips jsonb default '{}',                  -- {occasion, weather, formality, mood}
  ai_reasoning text,                                -- "why this works"
  favorited bool not null default false,
  created_at timestamptz not null default now()
);

create table outfit_items (
  outfit_id uuid not null references outfits(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  slot int not null default 0,                      -- ordering hint for flat-lay
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

-- RLS: enable on every table, scope by auth.uid()
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
```

**Storage buckets** (private, paths prefixed by `user_id/`):
- `items` — originals, cutouts, thumbs
- `inspo` — style inspiration uploads
- `body` — reference body photo (one per user)

## Folder structure

```
adorned/
├── docs/
│   └── phase-1-plan.md            ← this file
├── public/
│   ├── manifest.json
│   └── icons/
├── supabase/
│   └── migrations/
│       └── 0001_initial.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               → redirect to /wardrobe or /onboarding
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── (onboarding)/
│   │   │   ├── palette/page.tsx
│   │   │   ├── style/page.tsx
│   │   │   └── body/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx         → bottom-tab nav
│   │   │   ├── wardrobe/
│   │   │   │   ├── page.tsx       → gallery
│   │   │   │   ├── add/page.tsx   → single + bulk upload
│   │   │   │   └── [id]/page.tsx  → item detail
│   │   │   ├── outfits/
│   │   │   │   ├── page.tsx       → history + favorites
│   │   │   │   ├── new/page.tsx   → manual builder
│   │   │   │   └── [id]/page.tsx  → outfit detail
│   │   │   ├── generate/page.tsx
│   │   │   └── profile/page.tsx
│   │   └── api/
│   │       ├── items/tag/route.ts        → Claude Haiku
│   │       ├── style/synthesize/route.ts → Claude vision (inspo + text)
│   │       └── outfits/generate/route.ts → Claude Sonnet
│   ├── components/
│   │   ├── ui/        (button, chip, input, sheet, skeleton)
│   │   ├── nav/       (bottom tab bar, header)
│   │   ├── wardrobe/  (item card, gallery grid, filters)
│   │   ├── outfit/    (flat-lay canvas, builder sheet, outfit card)
│   │   └── onboarding/
│   ├── lib/
│   │   ├── supabase/  (client.ts, server.ts, middleware.ts)
│   │   ├── claude/    (client.ts, tag-item.ts, synthesize-style.ts, generate-outfit.ts)
│   │   ├── bg-removal.ts
│   │   ├── palette-presets.ts     → 12-season hex data
│   │   └── types.ts
│   └── middleware.ts              → auth + onboarding redirect
└── .env.local.example
```

## Milestones

Each milestone is a vertical slice that leaves the app in a usable state. Build in order — don't skip ahead.

### M0 — Foundation
Goal: app shell + auth + DB ready; no user-facing features yet.

- [ ] `create-next-app` w/ TypeScript, App Router, Tailwind, ESLint
- [ ] Tailwind config: design tokens (off-white `#FAFAF7`, charcoal `#1F1F1D`, mid-grey `#6B6B68`, hairline `#E8E6E1`, accent `#8B7355`); Inter or Geist font
- [ ] PWA: `next-pwa` or manual manifest + service worker; icons; `apple-touch-icon` set
- [ ] Supabase project (manual via dashboard); save URL + anon key + service role to `.env.local`
- [ ] Apply `0001_initial.sql` migration (Supabase SQL editor)
- [ ] Create storage buckets w/ RLS-style path policies
- [ ] Supabase client wrappers: browser, server, middleware (per Supabase Next.js docs)
- [ ] Magic-link login page + callback route
- [ ] Auth middleware: unauthenticated → `/login`
- [ ] Bottom-tab nav shell w/ four empty tabs

**Exit:** Becca logs in via magic link, lands on an empty Wardrobe tab.

### M1 — Single-item upload pipeline (highest-risk slice)
Goal: prove end-to-end ingestion of one item, including the trickiest pieces (browser bg removal, Claude vision, Storage upload).

- [ ] Single-item add UI: pick from camera or gallery (`<input type="file" accept="image/*" capture="environment">`)
- [ ] Integrate `@imgly/background-removal`; loading UI w/ first-time model download progress
- [ ] Upload original, cutout, generated thumb to `items` bucket under `${user_id}/${item_id}/`
- [ ] `/api/items/tag` route: POST `{cutout_image_url}` → Claude Haiku vision → structured JSON (category, subcategory, primary_color {hex, name}, secondary_colors, material, pattern, season[], formality, description, palette_fit_tags)
- [ ] Review/edit form with all tags pre-filled, editable
- [ ] Save item row to DB
- [ ] Wardrobe grid (one category, hardcoded, no filters yet)
- [ ] Item detail screen: photo, tags, AI description, edit, delete (soft-delete: `archived=true`)

**Exit:** Becca uploads one shirt, sees AI-filled tags, edits them, saves, sees it in the gallery, opens the detail page.

**Test on Becca's actual phone before moving on** — bg removal model download on cellular, iOS Safari WASM perf, camera permission flow.

### M2 — Bulk upload + full gallery
Goal: seed an 80-item wardrobe in one sitting.

- [ ] Bulk picker: `<input type="file" multiple>`
- [ ] Processing queue UI: per-item rows with status (bg-removing / tagging / ready / failed). Max 3 concurrent Claude calls.
- [ ] Swipe review stack: one item per screen, Save / Skip, batch commits
- [ ] All category chips above gallery
- [ ] Filter sheet: subcategory, color (sample from primary_color_hex), season
- [ ] Empty state ("Your wardrobe is empty. Add your first item.")
- [ ] Skeletons during load

**Exit:** Becca bulk-uploads 20-80 items, reviews them, and the gallery shows everything filtered correctly.

### M3 — Onboarding (palette + style + body)
Goal: complete style profile saved; outfit gen will have what it needs in M5.

- [ ] `lib/palette-presets.ts`: 12 seasonal palettes w/ named hex swatches
- [ ] Palette picker: grid of 12 seasons; selecting one loads its swatches as editable chips (add/remove swatch)
- [ ] Style description page: large textarea + multi-pick inspo upload (5-20 images) saved to `inspo` bucket
- [ ] `/api/style/synthesize`: Claude vision reads each inspo image + the description text → returns a canonical 2-3 paragraph style summary
- [ ] Show synthesized summary; user can edit before saving
- [ ] Body reference photo upload to `body` bucket (one image, replaceable)
- [ ] Mark `profiles.onboarded_at` when complete
- [ ] Middleware: if `onboarded_at IS NULL` → redirect to `/onboarding/palette`
- [ ] Profile/settings screen: edit any of the above post-onboarding

**Exit:** Becca completes onboarding once. Profile screen lets her tweak later.

### M4 — Manual outfit builder
Goal: hand-build outfits from wardrobe items, save them, see them in history.

- [ ] Empty flat-lay canvas (top half of screen)
- [ ] Bottom sheet w/ horizontal item carousels per category drawer
- [ ] Tap item → adds to outfit; auto-arrange layout: tops top-row, bottoms/skirts mid, shoes bottom, accessories floating right, jewellery floating left
- [ ] Remove item by tapping it on the canvas
- [ ] Save: writes `outfits` row (`source='manual'`) + `outfit_items` rows
- [ ] Outfits tab grid: flat-lay thumbnails, date created

**Exit:** Becca can build and save 2-3 outfits manually.

### M5 — AI outfit generation (the killer feature)
Goal: text-prompt → 3 outfit suggestions w/ reasoning.

- [ ] Generate tab UI: prompt textarea, rotating placeholder examples, optional chips (Occasion, Weather, Formality, Mood)
- [ ] `/api/outfits/generate`:
  - Input: prompt + chips + user's style_summary + palette + array of `{item_id, category, subcategory, ai_description, primary_color_name, season, formality}` for all non-archived items
  - System prompt: "You are styling Becca. Given her style, palette, and wardrobe, propose 3 distinct outfits matching the request. Output JSON: `{outfits: [{item_ids: [...], reasoning: '...'}]}`."
  - Model: `claude-sonnet-4-6`, JSON mode / strict response shape, prompt cache the system prompt + wardrobe summary block
  - Returns: 3 outfit candidates
- [ ] Result UI: 3 stacked cards, each w/ flat-lay collage + reasoning + Favorite/Save/Regenerate
- [ ] Save creates `outfits` row (`source='generated'`) + `outfit_items` + stores `ai_reasoning`
- [ ] Regenerate hits the same endpoint
- [ ] Outfit detail page: flat-lay hero, reasoning, item list (tap → item detail), favorite + wear-log + delete

**Exit:** Becca types "beach lunch with friends" and gets 3 plausible outfit suggestions she can save.

### M6 — History, wear log, polish
Goal: Phase 1 feature-complete.

- [ ] All / Favorites toggle on Outfits tab
- [ ] "Mark as worn" action with date picker (default today) → inserts wear_log row
- [ ] Sort: most recent / most worn / never worn
- [ ] Outfit detail: wear timeline ("worn 3 times: 12 May, 8 May, 2 May")
- [ ] Skeleton loaders for all async paths
- [ ] Toast/snackbar component for save/error feedback
- [ ] iOS PWA install instructions page (linked from Profile)

**Exit:** Phase 1 complete.

### M7 — Deploy
- [ ] Vercel project linked to repo
- [ ] All env vars set in Vercel (Supabase URL, anon key, service role, Anthropic API key)
- [ ] Custom domain optional (e.g. `adorned.app` if available, else `adorned-becca.vercel.app`)
- [ ] Becca installs PWA on phone home screen
- [ ] End-to-end test on her actual phone: add item, generate outfit, mark as worn

## Risks & open questions

| Risk | Mitigation |
|---|---|
| **iOS PWA + magic link**: link opens in default browser, not the installed PWA | Render a "Tap to return to Adorned" page on `/callback` w/ deep link instructions; users tap to open in PWA. Test in M0. |
| **Bg removal model size** (25MB first download) | Visible progress bar, cached forever after first use. Test on Becca's actual phone in M1 before going further. |
| **iOS PWA camera quirks** | Test single + bulk capture flows in M1. Fall back to gallery-only if `capture` attribute misbehaves. |
| **Claude rate limits during bulk** | Throttle to 3 concurrent. Retry w/ backoff on 429. |
| **Outfit gen latency** (5-10s with full wardrobe in context) | Strong loading UI; prompt-cache the wardrobe summary block; stream the response if supported. |
| **Storage cost** | Free tier 1GB ≈ 750 items at 1.3MB each. Plenty. Compress originals to 1200px max. |
| **Magic-link email limits** | Supabase free tier 3 magic links/hour. Fine for one user. |
| **Apple home-screen icon set** | Need full `apple-touch-icon` sizes, not just PWA manifest. |

## Cost estimates (single user, active use)
- **Supabase**: $0 (free tier)
- **Vercel**: $0 (hobby)
- **Claude Haiku ingest**: ~$0.16 to seed 80-item wardrobe, ~$0.002 per new item
- **Claude Sonnet generation**: ~$0.024 per generation × ~100/mo = ~$2.40/mo
- **Total**: ~$3-5/mo at active use

## Build order summary

```
M0 Foundation     →  ~1-2 evenings
M1 Single upload  →  ~2-3 evenings   (highest risk — validate on phone)
M2 Bulk + gallery →  ~1-2 evenings
M3 Onboarding     →  ~1-2 evenings
M4 Manual builder →  ~2 evenings
M5 AI generation  →  ~1-2 evenings
M6 Polish         →  ~1 evening
M7 Deploy         →  ~½ evening
                     ────────────────
                     ~10-15 evenings total
```

## Phase 2 preview (not for now)

AI lookbook tier: "Visualise on me" button on outfit detail → image-gen API (Gemini image or Flux on Replicate) using body reference photo + cutout item images → stylised lookbook render. ~$0.04 per render, ~10-20s latency.

## Phase 3 preview (not for now)

Real VTON tier: "Try it on" button → Replicate VTON model (IDM-VTON or FitDiT) sequentially composes garments onto body photo. ~$0.10-0.30 per render, ~30-60s latency. Quality is iffy on multi-garment composition — re-evaluate state of VTON tech before building.
