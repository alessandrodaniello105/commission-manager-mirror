-- Migration for voice_files table (PDF uploads for voices)
create table if not exists voice_files (
  id uuid primary key default gen_random_uuid(),
  voice_id uuid not null references voices(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);