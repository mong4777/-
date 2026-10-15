-- Supabase SQL Editor에서 한 번 실행하세요.

-- 1) 메모 테이블
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);
alter table notes enable row level security;
create policy "notes: own rows" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) 파일 저장용 비공개 버킷 (경로: <user_id>/<파일명>)
insert into storage.buckets (id, name, public) values ('files', 'files', false)
  on conflict (id) do nothing;

create policy "files: own folder select" on storage.objects
  for select using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "files: own folder insert" on storage.objects
  for insert with check (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "files: own folder delete" on storage.objects
  for delete using (bucket_id = 'files' and (storage.foldername(name))[1] = auth.uid()::text);
