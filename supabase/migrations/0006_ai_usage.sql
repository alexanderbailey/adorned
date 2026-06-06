-- ============================================================
-- AI usage log — one row per AI provider call
-- ============================================================
-- Inserts happen server-side via the admin client only. Users can read
-- their own rows (RLS); the debug page uses the admin client to read all.

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  provider text not null,                -- 'anthropic' | 'google'
  model text not null,                   -- 'claude-haiku-4-5', 'gemini-2.5-flash-image', etc
  operation text not null,               -- 'tag_item', 'visualize_outfit', etc
  input_tokens int,
  output_tokens int,
  cached_input_tokens int,
  input_bytes int,                       -- raw byte size of inputs sent (image gen)
  output_bytes int,                      -- raw byte size of generated output (image gen)
  cost_usd numeric(10, 6),               -- our best estimate at log time
  duration_ms int,
  status text not null check (status in ('success', 'error')),
  error_message text,
  metadata jsonb not null default '{}'   -- free-form context: item_id, outfit_id, quality tier, prompt length
);

create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at desc);
create index ai_usage_operation_idx on public.ai_usage (operation, created_at desc);
create index ai_usage_created_idx on public.ai_usage (created_at desc);

alter table public.ai_usage enable row level security;

create policy "own usage view" on public.ai_usage for select
  using (user_id = auth.uid());
