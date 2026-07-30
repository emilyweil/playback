-- Run once in the SQL Editor of an already-deployed Supabase project.
-- New projects get this automatically from the updated supabase/schema.sql.

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_id_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

drop policy if exists "users can view their own blocks" on public.blocks;
create policy "users can view their own blocks" on public.blocks
  for select using (auth.uid() = blocker_id);

drop policy if exists "users can create their own blocks" on public.blocks;
create policy "users can create their own blocks" on public.blocks
  for insert with check (auth.uid() = blocker_id);

drop policy if exists "users can remove their own blocks" on public.blocks;
create policy "users can remove their own blocks" on public.blocks
  for delete using (auth.uid() = blocker_id);

-- Blocking someone removes any existing follow relationship in either direction.
create or replace function public.handle_new_block()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end;
$$;

drop trigger if exists on_block_created on public.blocks;
create trigger on_block_created
  after insert on public.blocks
  for each row execute procedure public.handle_new_block();

-- Prevent following someone you've blocked, or who has blocked you.
drop policy if exists "users can follow as themselves" on public.follows;
create policy "users can follow as themselves" on public.follows
  for insert with check (
    auth.uid() = follower_id
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = follower_id and b.blocked_id = following_id)
         or (b.blocker_id = following_id and b.blocked_id = follower_id)
    )
  );
