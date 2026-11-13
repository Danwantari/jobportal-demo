-- Review and run in your own Supabase project's SQL editor.
-- Separate demo table/bucket. Does not modify existing application tables.
create table if not exists public.jobportal_records (
  kind text not null,
  id text not null,
  payload jsonb not null,
  primary key (kind, id)
);
alter table public.jobportal_records enable row level security;
revoke all on public.jobportal_records from anon, authenticated;
grant all on public.jobportal_records to service_role;
insert into storage.buckets (id, name, public, file_size_limit)
values ('jobportal-resumes', 'jobportal-resumes', false, 5242880)
on conflict (id) do nothing;
-- No anonymous storage policies. The server signs a short-lived upload URL,
-- and proxies authenticated downloads. Never expose the service-role key.
