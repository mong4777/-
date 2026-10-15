-- Supabase SQL Editor에서 한 번 실행하세요. (로그인 없는 개인용)

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);
alter table notes enable row level security;
create policy "notes: anon all" on notes
  for all to anon using (true) with check (true);

insert into storage.buckets (id, name, public) values ('files', 'files', false)
  on conflict (id) do nothing;

create policy "files: anon select" on storage.objects
  for select to anon using (bucket_id = 'files');
create policy "files: anon insert" on storage.objects
  for insert to anon with check (bucket_id = 'files');
create policy "files: anon delete" on storage.objects
  for delete to anon using (bucket_id = 'files');
