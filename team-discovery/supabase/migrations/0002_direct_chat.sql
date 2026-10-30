-- CrewMatch direct-message hardening and realtime setup.
-- Apply this AFTER 0001_initial_schema.sql in the Supabase SQL Editor.
-- This migration keeps the existing conversations/conversation_members/messages tables.

create or replace function public.get_or_create_direct_conversation(p_connection_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  connection_row public.connections%rowtype;
  conversation_uuid uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into connection_row
    from public.connections
   where id = p_connection_id
     and status = 'accepted'
     and (requester_id = current_user_id or recipient_id = current_user_id)
   for update;

  if not found then
    raise exception 'Accepted connection not found or access denied';
  end if;

  if public.is_blocked_pair(connection_row.requester_id, connection_row.recipient_id) then
    raise exception 'Messaging is unavailable for this connection';
  end if;

  insert into public.conversations(created_by, connection_id)
  values(current_user_id, p_connection_id)
  on conflict(connection_id) do nothing;

  select id into conversation_uuid
    from public.conversations
   where connection_id = p_connection_id;

  insert into public.conversation_members(conversation_id, user_id)
  values
    (conversation_uuid, connection_row.requester_id),
    (conversation_uuid, connection_row.recipient_id)
  on conflict(conversation_id, user_id) do nothing;

  return conversation_uuid;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(uuid) from public;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;


-- Accepted connections must be able to see the basic profile card used in the inbox,
-- even if a user has limited public discoverability.
drop policy if exists "Accepted connections can read each other's profiles" on public.profiles;
create policy "Accepted connections can read each other's profiles"
on public.profiles for select to authenticated
using (
  exists (
    select 1
      from public.connections c
     where c.status = 'accepted'
       and (
         (c.requester_id = (select auth.uid()) and c.recipient_id = profiles.id)
         or
         (c.recipient_id = (select auth.uid()) and c.requester_id = profiles.id)
       )
  )
);

-- SECURITY DEFINER membership helper avoids recursive RLS policy evaluation.
create or replace function public.is_conversation_member(p_conversation_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.conversation_members cm
     where cm.conversation_id = p_conversation_id
       and cm.user_id = p_user_id
  );
$$;

revoke all on function public.is_conversation_member(uuid, uuid) from public;
grant execute on function public.is_conversation_member(uuid, uuid) to authenticated;

-- Replace self-referencing membership policies from the initial schema.
drop policy if exists "Conversation members read conversations" on public.conversations;
drop policy if exists "Members read conversation memberships" on public.conversation_members;

create policy "Conversation members read conversations"
on public.conversations for select to authenticated
using (public.is_conversation_member(id, (select auth.uid())));

create policy "Members read conversation memberships"
on public.conversation_members for select to authenticated
using (public.is_conversation_member(conversation_id, (select auth.uid())));

-- Replace the original broad message policies with conversation-scoped checks.
drop policy if exists "Conversation participants read messages" on public.messages;
drop policy if exists "Send messages only to accepted connections" on public.messages;
drop policy if exists "Recipients mark messages read" on public.messages;

create policy "Conversation members read messages"
on public.messages for select to authenticated
using (
  public.is_conversation_member(messages.conversation_id, (select auth.uid()))
  and (
    sender_id = (select auth.uid())
    or recipient_id = (select auth.uid())
  )
);

create policy "Members send messages in accepted direct conversations"
on public.messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and conversation_id is not null
  and char_length(btrim(body)) between 1 and 5000
  and exists (
    select 1
      from public.conversations cv
      join public.connections c on c.id = cv.connection_id
      join public.conversation_members sender_member
        on sender_member.conversation_id = cv.id
       and sender_member.user_id = (select auth.uid())
      join public.conversation_members recipient_member
        on recipient_member.conversation_id = cv.id
       and recipient_member.user_id = messages.recipient_id
     where cv.id = messages.conversation_id
       and c.status = 'accepted'
       and (
         (c.requester_id = sender_id and c.recipient_id = recipient_id)
         or
         (c.recipient_id = sender_id and c.requester_id = recipient_id)
       )
       and not public.is_blocked_pair(sender_id, recipient_id)
  )
);

create policy "Recipients mark own messages read"
on public.messages for update to authenticated
using (
  recipient_id = (select auth.uid())
  and exists (
    select 1
      from public.conversation_members cm
     where cm.conversation_id = messages.conversation_id
       and cm.user_id = (select auth.uid())
  )
)
with check (
  recipient_id = (select auth.uid())
  and sender_id <> (select auth.uid())
  and exists (
    select 1
      from public.conversation_members cm
     where cm.conversation_id = messages.conversation_id
       and cm.user_id = (select auth.uid())
  )
);

-- Prevent clients from changing message content/participants while marking it read.
create or replace function public.guard_message_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id <> old.id
     or new.conversation_id is distinct from old.conversation_id
     or new.sender_id <> old.sender_id
     or new.recipient_id <> old.recipient_id
     or new.body <> old.body
     or new.created_at <> old.created_at then
    raise exception 'Messages cannot be edited';
  end if;

  if auth.uid() <> old.recipient_id then
    raise exception 'Only the recipient can mark a message as read';
  end if;

  if old.read_at is not null and new.read_at is distinct from old.read_at then
    raise exception 'Read receipts cannot be reverted';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_message_update_trigger on public.messages;
create trigger guard_message_update_trigger
before update on public.messages
for each row execute function public.guard_message_update();

create index if not exists messages_conversation_created_asc_idx
  on public.messages(conversation_id, created_at asc);
create index if not exists messages_recipient_unread_idx
  on public.messages(recipient_id, read_at)
  where read_at is null;

-- Realtime delivers only rows visible under the table's RLS policies.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'supabase_realtime publication not found; enable Realtime for public.messages in the Supabase dashboard.';
end;
$$;
