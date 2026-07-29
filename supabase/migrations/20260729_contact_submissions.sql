-- Contact Us submissions -- replaces the plain mailto: link in the footer.
-- Lets someone attach the actual statement that isn't converting correctly,
-- which a mailto link can't do, and gives a real, queryable record instead
-- of email that only lives in one inbox.
--
-- Deliberately NOT wired to any email-sending function -- there is no edge
-- function in this project yet, and adding one is a separate decision.
-- Submissions land in this table; check them via the Supabase dashboard's
-- table editor for now. A notification email can be layered on later
-- without changing this schema.
--
-- No SELECT policy for authenticated/anon at all, on purpose -- someone
-- should not be able to read other people's contact submissions or
-- attachments through the client SDK. Only the dashboard (service role,
-- bypasses RLS) can read this table.

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  email text not null,
  issue_type text not null,
  message text not null,
  attachment_path text,
  user_id uuid references auth.users(id) on delete set null
);

alter table public.contact_submissions enable row level security;

-- Anyone -- signed in or not -- can submit the contact form. This is an
-- insert-only policy; there is deliberately no matching select policy.
create policy "Anyone can submit a contact request"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (true);

-- Storage bucket for optional attachments (a statement that isn't
-- converting correctly). Private -- not a public bucket -- since these
-- are real bank statements someone is sharing specifically for support,
-- not something to expose via a public URL.
insert into storage.buckets (id, name, public)
values ('support-attachments', 'support-attachments', false)
on conflict (id) do nothing;

-- Anyone can upload an attachment alongside their contact submission.
-- No read policy for anon/authenticated here either -- only the
-- dashboard (service role) can browse these files.
create policy "Anyone can upload a support attachment"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'support-attachments');
