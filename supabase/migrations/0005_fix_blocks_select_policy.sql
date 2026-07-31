-- Fixes a real bug: the blocks SELECT policy only let the blocker see their
-- own blocks. That's a problem beyond just UI — the follows insert policy's
-- "not exists (select ... from blocks ...)" check runs under the *follower's*
-- row-security context, so if someone blocked YOU, you couldn't actually see
-- that row, and the block-prevention check could be evaded. Both parties to
-- a block need to be able to see it exists.
--
-- Run once in the SQL Editor. Safe to re-run.

drop policy if exists "users can view their own blocks" on public.blocks;
create policy "users can view blocks involving themselves" on public.blocks
  for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
