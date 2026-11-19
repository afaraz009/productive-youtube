create table if not exists public.notes (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null,
  video_title text not null,
  start_time double precision not null,
  end_time double precision not null,
  start_segment_start double precision not null default 0,
  end_segment_start double precision not null default 0,
  start_offset integer not null default 0,
  end_offset integer not null default 0,
  preview text not null,
  created_at bigint not null,
  constraint notes_pkey primary key (id)
);

do $$
declare
  source_name text;
  target_name text;
begin
  for source_name, target_name in
    select * from (values
      ('videoId', 'video_id'),
      ('videoid', 'video_id'),
      ('videoTitle', 'video_title'),
      ('videotitle', 'video_title'),
      ('startTime', 'start_time'),
      ('starttime', 'start_time'),
      ('endTime', 'end_time'),
      ('endtime', 'end_time'),
      ('startSegmentStart', 'start_segment_start'),
      ('startsegmentstart', 'start_segment_start'),
      ('endSegmentStart', 'end_segment_start'),
      ('endsegmentstart', 'end_segment_start'),
      ('startOffset', 'start_offset'),
      ('startoffset', 'start_offset'),
      ('endOffset', 'end_offset'),
      ('endoffset', 'end_offset'),
      ('createdAt', 'created_at'),
      ('createdat', 'created_at')
    ) as column_names(source_name, target_name)
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notes'
        and column_name = source_name
    ) and not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notes'
        and column_name = target_name
    ) then
      execute format(
        'alter table public.notes rename column %I to %I',
        source_name,
        target_name
      );
    end if;
  end loop;
end
$$;

alter table public.notes
  add column if not exists start_segment_start double precision not null default 0,
  add column if not exists end_segment_start double precision not null default 0,
  add column if not exists start_offset integer not null default 0,
  add column if not exists end_offset integer not null default 0;

alter table public.notes
  alter column user_id set not null,
  alter column id set not null,
  alter column video_id set not null,
  alter column video_title set not null,
  alter column start_time set not null,
  alter column end_time set not null,
  alter column start_segment_start set not null,
  alter column end_segment_start set not null,
  alter column start_offset set not null,
  alter column end_offset set not null,
  alter column preview set not null,
  alter column created_at set not null;

do $$
declare
  primary_key_name text;
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.notes'::regclass
      and c.contype = 'p'
      and c.conkey = array[(
        select a.attnum
        from pg_attribute a
        where a.attrelid = 'public.notes'::regclass
          and a.attname = 'id'
          and not a.attisdropped
      )]::smallint[]
  ) then
    select c.conname
      into primary_key_name
    from pg_constraint c
    where c.conrelid = 'public.notes'::regclass
      and c.contype = 'p';

    if primary_key_name is not null then
      execute format(
        'alter table public.notes drop constraint %I',
        primary_key_name
      );
    end if;

    alter table public.notes
      add constraint notes_pkey primary key (id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.notes'::regclass
      and c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
      and pg_get_constraintdef(c.oid) like 'FOREIGN KEY (user_id)%'
  ) then
    alter table public.notes
      add constraint notes_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end
$$;

create index if not exists notes_user_created_at_idx
  on public.notes (user_id, created_at desc);

alter table public.notes enable row level security;

drop policy if exists notes_owner_all on public.notes;
create policy notes_owner_all
  on public.notes
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.notes to authenticated;
