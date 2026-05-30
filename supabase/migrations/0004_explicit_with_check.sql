-- ============================================================
-- Make WITH CHECK explicit on every "own X" policy.
-- ============================================================
-- Postgres docs say FOR ALL policies inherit USING as WITH CHECK when
-- WITH CHECK is omitted, but in practice this can behave inconsistently
-- under PostgREST/Supabase. Spelling it out removes the ambiguity.
--
-- Idempotent — drops + recreates.

drop policy if exists "own profile"      on profiles;
drop policy if exists "own inspo"        on inspo_images;
drop policy if exists "own items"        on items;
drop policy if exists "own outfits"      on outfits;
drop policy if exists "own outfit_items" on outfit_items;
drop policy if exists "own wear_log"     on wear_log;

create policy "own profile" on profiles for all
  using       (id = auth.uid())
  with check  (id = auth.uid());

create policy "own inspo" on inspo_images for all
  using       (user_id = auth.uid())
  with check  (user_id = auth.uid());

create policy "own items" on items for all
  using       (user_id = auth.uid())
  with check  (user_id = auth.uid());

create policy "own outfits" on outfits for all
  using       (user_id = auth.uid())
  with check  (user_id = auth.uid());

create policy "own outfit_items" on outfit_items for all
  using       (exists (select 1 from outfits o where o.id = outfit_id and o.user_id = auth.uid()))
  with check  (exists (select 1 from outfits o where o.id = outfit_id and o.user_id = auth.uid()));

create policy "own wear_log" on wear_log for all
  using       (user_id = auth.uid())
  with check  (user_id = auth.uid());
