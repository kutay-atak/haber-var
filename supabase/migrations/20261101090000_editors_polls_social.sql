-- ============================================================================
-- Haber Var · 2. sürüm: editörler, anketler, sesli notlar, tepkiler/yorumlar
-- ve otomatik tekrarlayan sayılar.
--
-- İlk iki dosyadan (init + question_bank) SONRA, Supabase SQL Editor'da bir kez
-- çalıştır. Tek seferde (tek işlem içinde) çalışacak şekilde yazıldı.
-- ============================================================================

-- ─── Yeni tip değerleri ─────────────────────────────────────────────────────
-- Not: Yeni enum değerleri aynı işlemde doğrudan kullanılamaz. Bu yüzden aşağıda
-- onlara sadece plpgsql fonksiyonlarının içinden (çalışma anında) ya da metin
-- karşılaştırmasıyla değiniyoruz.

alter type public.member_role add value if not exists 'editor';
alter type public.media_kind add value if not exists 'audio';

-- ─── Yardımcılar ────────────────────────────────────────────────────────────

-- Yönetici ya da editör mü? (Editörler sıradaki sayı için soru önerebilir.)
create or replace function public.is_editor(p_group_id uuid)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
begin
  return exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id
      and m.user_id = (select auth.uid())
      and m.role::text in ('admin', 'editor')
  );
end;
$$;

-- Anket seçenekleri: 2-6 adet, her biri 1-80 karakter metin.
create or replace function public.valid_poll_options(p_options jsonb)
returns boolean language sql immutable set search_path = ''
as $$
  select jsonb_typeof(p_options) = 'array'
    and jsonb_array_length(p_options) between 2 and 6
    and not exists (
      select 1 from jsonb_array_elements(p_options) e
      where jsonb_typeof(e) <> 'string' or char_length(trim(e #>> '{}')) not between 1 and 80
    );
$$;

-- ─── Soru tipleri: yazılı, anket, "kim daha çok?" ───────────────────────────

alter table public.question_bank
  add column if not exists kind text not null default 'text',
  add column if not exists options jsonb;
alter table public.question_bank
  add constraint question_bank_kind_check check (kind in ('text', 'poll', 'who')),
  add constraint question_bank_options_check check (
    (kind = 'poll' and public.valid_poll_options(options)) or (kind <> 'poll' and options is null)
  );

alter table public.issue_questions
  add column if not exists kind text not null default 'text',
  add column if not exists options jsonb,
  -- Soruyu sıraya ekleyen editör (gazetede "Ayşe'nin sorusu" yazar).
  add column if not exists asked_by uuid references public.profiles (id) on delete set null;
alter table public.issue_questions
  add constraint issue_questions_kind_check check (kind in ('text', 'poll', 'who')),
  add constraint issue_questions_options_check check (
    (kind = 'poll' and public.valid_poll_options(options)) or (kind <> 'poll' and options is null)
  );

-- ─── Ortak editörlük: sıradaki sayının soruları ─────────────────────────────

create table public.question_queue (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  text text not null check (char_length(text) between 3 and 300),
  kind text not null default 'text' check (kind in ('text', 'poll', 'who')),
  options jsonb,
  source_question_id uuid references public.question_bank (id) on delete set null,
  added_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check ((kind = 'poll' and public.valid_poll_options(options)) or (kind <> 'poll' and options is null))
);
create index question_queue_group_idx on public.question_queue (group_id, created_at);

create function public.check_queue_limit()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.groups where id = new.group_id for update;
  if (select count(*) from public.question_queue where group_id = new.group_id) >= 20 then
    raise exception 'Sıradaki sayı için en fazla 20 soru önerilebilir.';
  end if;
  return new;
end;
$$;

create trigger question_queue_limit
  before insert on public.question_queue
  for each row execute function public.check_queue_limit();

-- ─── Oylar (anket ve "kim daha çok?") ───────────────────────────────────────

create table public.votes (
  issue_question_id uuid not null references public.issue_questions (id) on delete cascade,
  issue_id uuid not null references public.issues (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Ankette seçilen seçeneğin sırası, "kim daha çok?" sorusunda seçilen kişi.
  choice int check (choice between 0 and 5),
  voted_user_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (issue_question_id, user_id),
  check ((choice is null) <> (voted_user_id is null))
);
create index votes_issue_id_idx on public.votes (issue_id);

create function public.set_vote_defaults()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_question public.issue_questions;
  v_group_id uuid;
begin
  select * into v_question from public.issue_questions where id = new.issue_question_id;
  if not found then
    raise exception 'Soru bulunamadı.';
  end if;
  new.issue_id := v_question.issue_id;
  new.updated_at := now();

  if v_question.kind = 'poll' then
    if new.choice is null or new.voted_user_id is not null or new.choice >= jsonb_array_length(v_question.options) then
      raise exception 'Geçersiz oy.';
    end if;
  elsif v_question.kind = 'who' then
    select group_id into v_group_id from public.issues where id = v_question.issue_id;
    if new.voted_user_id is null or new.choice is not null or not exists (
      select 1 from public.group_members where group_id = v_group_id and user_id = new.voted_user_id
    ) then
      raise exception 'Geçersiz oy.';
    end if;
  else
    raise exception 'Bu soru oylama sorusu değil.';
  end if;
  return new;
end;
$$;

create trigger votes_set_defaults
  before insert or update on public.votes
  for each row execute function public.set_vote_defaults();

-- ─── Tepkiler ve yorumlar (gazete yayımlandıktan sonra) ─────────────────────

create table public.reactions (
  response_id uuid not null references public.responses (id) on delete cascade,
  issue_id uuid not null references public.issues (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  emoji text not null check (emoji in ('heart', 'laugh', 'wow', 'sad', 'clap', 'fire')),
  created_at timestamptz not null default now(),
  primary key (response_id, user_id, emoji)
);
create index reactions_issue_id_idx on public.reactions (issue_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses (id) on delete cascade,
  issue_id uuid not null references public.issues (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index comments_issue_id_idx on public.comments (issue_id, created_at);

create function public.set_social_defaults()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  select r.issue_id into new.issue_id from public.responses r where r.id = new.response_id;
  if new.issue_id is null then
    raise exception 'Yanıt bulunamadı.';
  end if;
  return new;
end;
$$;

create trigger reactions_set_defaults
  before insert on public.reactions
  for each row execute function public.set_social_defaults();
create trigger comments_set_defaults
  before insert on public.comments
  for each row execute function public.set_social_defaults();

-- ─── Otomatik tekrarlayan sayılar ───────────────────────────────────────────

create table public.issue_schedules (
  group_id uuid primary key references public.groups (id) on delete cascade,
  enabled boolean not null default true,
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  -- Haftalık: 1 = Pazartesi … 7 = Pazar. Aylık: ayın kaçı (1-28).
  weekday int check (weekday between 1 and 7),
  month_day int check (month_day between 1 and 28),
  duration_days int not null default 7 check (duration_days between 2 and 21),
  question_count int not null default 4 check (question_count between 1 and 10),
  -- Havuzdan seçilen hazır soruların dili
  locale text not null default 'tr' check (locale in ('tr', 'en')),
  next_run_at timestamptz not null,
  last_run_at timestamptz,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  check ((frequency = 'monthly' and month_day is not null) or (frequency <> 'monthly' and weekday is not null))
);

-- ─── Medya sınırları: sesli notlar ──────────────────────────────────────────
-- Bu sayıları değiştirirsen src/lib/media/limits.ts dosyasını da güncelle.

create or replace function public.check_media_limits()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_count int;
begin
  -- Aynı yanıta eşzamanlı eklemeleri sıraya sokmak için yanıt satırını kilitle.
  select r.issue_id, r.user_id into new.issue_id, new.user_id
  from public.responses r where r.id = new.response_id
  for update;
  if new.issue_id is null then
    raise exception 'Yanıt bulunamadı.';
  end if;

  if new.kind::text = 'image' then
    if new.bytes > 3 * 1024 * 1024 then
      raise exception 'Fotoğraf çok büyük (en fazla 3 MB).';
    end if;
    select count(*) into v_count from public.response_media
    where response_id = new.response_id and kind::text = 'image';
    if v_count >= 4 then
      raise exception 'Bir yanıta en fazla 4 fotoğraf eklenebilir.';
    end if;
  elsif new.kind::text = 'audio' then
    if new.bytes > 10 * 1024 * 1024 then
      raise exception 'Ses kaydı çok büyük (en fazla 10 MB).';
    end if;
    select count(*) into v_count from public.response_media
    where response_id = new.response_id and kind::text = 'audio';
    if v_count >= 1 then
      raise exception 'Bir yanıta en fazla 1 sesli not eklenebilir.';
    end if;
  else
    if new.bytes > 30 * 1024 * 1024 then
      raise exception 'Video çok büyük (en fazla 30 MB).';
    end if;
    select count(*) into v_count from public.response_media
    where response_id = new.response_id and kind::text = 'video';
    if v_count >= 1 then
      raise exception 'Bir yanıta en fazla 1 video eklenebilir.';
    end if;
    select count(*) into v_count from public.response_media
    where issue_id = new.issue_id and user_id = new.user_id and kind::text = 'video';
    if v_count >= 2 then
      raise exception 'Bir sayıda en fazla 2 video paylaşabilirsin.';
    end if;
  end if;

  select coalesce(max(position) + 1, 0) into new.position
  from public.response_media where response_id = new.response_id;
  return new;
end;
$$;

-- ─── Soruları sayıya yazma (elle ve otomatik sayılar ortak kullanır) ────────
-- p_questions: [{"text", "source_id", "kind", "options", "queue_id", "asked_by"}, ...]
-- queue_id verilen sorular sıradan düşer; soruyu öneren editör "asked_by" olur.

create function public.insert_issue_questions(p_issue_id uuid, p_group_id uuid, p_questions jsonb)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_count int := jsonb_array_length(coalesce(p_questions, '[]'::jsonb));
begin
  if v_count < 1 or v_count > 10 then
    raise exception 'Bir sayıda 1 ile 10 arasında soru olmalı.';
  end if;

  insert into public.issue_questions (issue_id, position, question_text, source_question_id, kind, options, asked_by)
  select
    p_issue_id,
    (q.ord - 1)::int,
    trim(q.value ->> 'text'),
    nullif(q.value ->> 'source_id', '')::uuid,
    coalesce(nullif(q.value ->> 'kind', ''), 'text'),
    case when q.value ->> 'kind' = 'poll' then q.value -> 'options' end,
    coalesce(
      qq.added_by,
      (select m.user_id from public.group_members m
       where m.group_id = p_group_id and m.user_id = nullif(q.value ->> 'asked_by', '')::uuid)
    )
  from jsonb_array_elements(p_questions) with ordinality as q(value, ord)
  left join public.question_queue qq
    on qq.id = nullif(q.value ->> 'queue_id', '')::uuid and qq.group_id = p_group_id;

  delete from public.question_queue
  where group_id = p_group_id
    and id in (
      select nullif(e ->> 'queue_id', '')::uuid from jsonb_array_elements(p_questions) e
    );
end;
$$;

-- Yeni sayı oluştur ya da taslağı güncelle; istenirse hemen başlat.
create or replace function public.save_issue(
  p_group_id uuid,
  p_issue_id uuid,
  p_title text,
  p_deadline_at timestamptz,
  p_template public.newspaper_template,
  p_questions jsonb,
  p_start boolean default false
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_issue_id uuid := p_issue_id;
  v_status public.issue_status;
  v_number int;
  v_count int := jsonb_array_length(coalesce(p_questions, '[]'::jsonb));
begin
  if not public.is_admin(p_group_id) then
    raise exception 'Bunu sadece grup yöneticileri yapabilir.';
  end if;
  if v_count < 1 or v_count > 10 then
    raise exception 'Bir sayıda 1 ile 10 arasında soru olmalı.';
  end if;

  if v_issue_id is null then
    -- Grup satırını kilitleyerek iki sayının aynı numarayı almasını önle.
    perform 1 from public.groups where id = p_group_id for update;
    select coalesce(max(number), 0) + 1 into v_number from public.issues where group_id = p_group_id;
    -- Yeni sayı grubun varsayılan gazete tasarımını devralır.
    insert into public.issues (group_id, number, title, deadline_at, template, design, created_by)
    select p_group_id, v_number, nullif(trim(coalesce(p_title, '')), ''), p_deadline_at, p_template, g.default_design, auth.uid()
    from public.groups g where g.id = p_group_id
    returning id into v_issue_id;
  else
    select status into v_status from public.issues
    where id = v_issue_id and group_id = p_group_id
    for update;
    if not found then
      raise exception 'Sayı bulunamadı.';
    end if;
    if v_status <> 'draft' then
      raise exception 'Başlamış bir sayının soruları değiştirilemez.';
    end if;
    update public.issues
    set title = nullif(trim(coalesce(p_title, '')), ''), deadline_at = p_deadline_at, template = p_template
    where id = v_issue_id;
    delete from public.issue_questions where issue_id = v_issue_id;
  end if;

  perform public.insert_issue_questions(v_issue_id, p_group_id, p_questions);

  if p_start then
    perform public.start_issue(v_issue_id);
  end if;
  return v_issue_id;
end;
$$;

-- Zamanlanmış iş için: grubun yeni sayısını hemen açar. Devam eden bir sayı
-- varsa hiçbir şey yapmaz ve null döner (ertesi gün tekrar denenir).
create function public.create_scheduled_issue(p_group_id uuid, p_deadline_at timestamptz, p_questions jsonb)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_issue_id uuid;
  v_number int;
begin
  perform 1 from public.groups where id = p_group_id for update;
  update public.issues set status = 'published', published_at = now()
  where group_id = p_group_id and status = 'open' and deadline_at <= now();
  if exists (select 1 from public.issues where group_id = p_group_id and status = 'open') then
    return null;
  end if;

  select coalesce(max(number), 0) + 1 into v_number from public.issues where group_id = p_group_id;
  insert into public.issues (group_id, number, deadline_at, template, design, created_by, status, opened_at)
  select g.id, v_number, p_deadline_at, g.default_template, g.default_design, g.created_by, 'open', now()
  from public.groups g where g.id = p_group_id
  returning id into v_issue_id;

  perform public.insert_issue_questions(v_issue_id, p_group_id, p_questions);
  return v_issue_id;
end;
$$;

-- "Kim daha çok?" sonuçları: kimin kaç oy aldığı; kimin kime oy verdiği değil.
-- Bu oylar gizli olduğu için başkalarının satırları tablodan okunamaz (aşağıdaki
-- RLS politikası), gazete sonuçları buradan alır.
create function public.who_vote_counts(p_issue_id uuid)
returns table (question_id uuid, person_id uuid, vote_count int)
language sql stable security definer set search_path = ''
as $$
  select v.issue_question_id, v.voted_user_id, count(*)::int
  from public.votes v
  where v.issue_id = p_issue_id
    and v.voted_user_id is not null
    and public.issue_is_published(p_issue_id)
    and public.can_view_issue(p_issue_id)
  group by v.issue_question_id, v.voted_user_id;
$$;

-- Kim katıldı? Artık oy verenler de sayılır.
create or replace function public.issue_participants(p_issue_id uuid)
returns setof uuid language sql stable security definer set search_path = ''
as $$
  select r.user_id
  from public.responses r
  where r.issue_id = p_issue_id
    and public.can_view_issue(p_issue_id)
    and (
      char_length(trim(r.body)) > 0
      or exists (select 1 from public.response_media m where m.response_id = r.id)
    )
  union
  select v.user_id
  from public.votes v
  where v.issue_id = p_issue_id and public.can_view_issue(p_issue_id);
$$;

-- ─── RLS politikaları ───────────────────────────────────────────────────────

alter table public.question_queue enable row level security;
alter table public.votes enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.issue_schedules enable row level security;

-- Editörler de grubun soru havuzuna soru ekleyebilir.
drop policy if exists "soru havuzu: yöneticiler gruba soru ekler" on public.question_bank;
create policy "soru havuzu: yöneticiler ve editörler gruba soru ekler"
  on public.question_bank for insert to authenticated
  with check (group_id is not null and public.is_editor(group_id) and created_by = (select auth.uid()));

create policy "sıra: editörler ve yöneticiler görür"
  on public.question_queue for select to authenticated
  using (public.is_editor(group_id));
create policy "sıra: editörler ve yöneticiler soru ekler"
  on public.question_queue for insert to authenticated
  with check (public.is_editor(group_id) and added_by = (select auth.uid()));
create policy "sıra: yönetici her soruyu, editör kendi sorusunu çıkarır"
  on public.question_queue for delete to authenticated
  using (public.is_admin(group_id) or (added_by = (select auth.uid()) and public.is_editor(group_id)));

-- Ankette kimin neyi seçtiği gazetede görünür; "kim daha çok?" oyları (choice boş)
-- gizli kalır, onların sadece toplamı who_vote_counts() ile okunur.
create policy "oy: kendi oyun her zaman, anket oyları yayından sonra"
  on public.votes for select to authenticated
  using (
    user_id = (select auth.uid())
    or (choice is not null and public.issue_is_published(issue_id) and public.can_view_issue(issue_id))
  );
create policy "oy: açık sayıda oy verirsin"
  on public.votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.issue_is_open(issue_id)
    and public.can_view_issue(issue_id)
  );
create policy "oy: açık sayıda oyunu değiştirirsin"
  on public.votes for update to authenticated
  using (user_id = (select auth.uid()) and public.issue_is_open(issue_id))
  with check (user_id = (select auth.uid()) and public.issue_is_open(issue_id));
create policy "oy: açık sayıda oyunu geri alırsın"
  on public.votes for delete to authenticated
  using (user_id = (select auth.uid()) and public.issue_is_open(issue_id));

create policy "tepki: yayımlanan gazetede herkes görür"
  on public.reactions for select to authenticated
  using (public.issue_is_published(issue_id) and public.can_view_issue(issue_id));
create policy "tepki: yayımlanan gazeteye tepki verirsin"
  on public.reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.issue_is_published(issue_id)
    and public.can_view_issue(issue_id)
  );
create policy "tepki: kendi tepkini geri alırsın"
  on public.reactions for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "yorum: yayımlanan gazetede herkes görür"
  on public.comments for select to authenticated
  using (public.issue_is_published(issue_id) and public.can_view_issue(issue_id));
create policy "yorum: yayımlanan gazeteye yorum yazarsın"
  on public.comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.issue_is_published(issue_id)
    and public.can_view_issue(issue_id)
  );
create policy "yorum: kendi yorumunu, yönetici her yorumu siler"
  on public.comments for delete to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.issues i where i.id = comments.issue_id and public.is_admin(i.group_id))
  );

create policy "zamanlama: üyeler görür"
  on public.issue_schedules for select to authenticated
  using (public.is_member(group_id));
create policy "zamanlama: yöneticiler kurar"
  on public.issue_schedules for insert to authenticated
  with check (public.is_admin(group_id));
create policy "zamanlama: yöneticiler değiştirir"
  on public.issue_schedules for update to authenticated
  using (public.is_admin(group_id)) with check (public.is_admin(group_id));
create policy "zamanlama: yöneticiler kapatır"
  on public.issue_schedules for delete to authenticated
  using (public.is_admin(group_id));

-- ─── Yetkiler ───────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.question_queue, public.votes, public.reactions, public.comments, public.issue_schedules
  to authenticated, service_role;

revoke execute on function public.insert_issue_questions(uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.create_scheduled_issue(uuid, timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.create_scheduled_issue(uuid, timestamptz, jsonb) to service_role;
revoke execute on function public.who_vote_counts(uuid) from public, anon;
grant execute on function public.who_vote_counts(uuid) to authenticated;

-- ─── Yeni hazır sorular: anketler ve "kim daha çok?" ────────────────────────

insert into public.question_bank (category, text, kind, options) values
  ('Kim daha çok?', 'Kim en çok geç kalır?', 'who', null),
  ('Kim daha çok?', 'Kim en iyi yemek yapar?', 'who', null),
  ('Kim daha çok?', 'Kim bir gün ünlü olur?', 'who', null),
  ('Kim daha çok?', 'Kim en çok sesli mesaj atar?', 'who', null),
  ('Kim daha çok?', 'Kim ıssız bir adada en uzun hayatta kalır?', 'who', null),
  ('Kim daha çok?', 'Kim en kötü şakaları yapar?', 'who', null),
  ('Kim daha çok?', 'Kim telefonunu en sık kaybeder?', 'who', null),
  ('Kim daha çok?', 'Kim bir gün dünya turuna çıkar?', 'who', null),

  ('Anket', 'Tatil: deniz mi, dağ mı?', 'poll', '["Deniz", "Dağ", "İkisi de", "Evde kalırım"]'),
  ('Anket', 'Sabah insanı mısın, gece kuşu mu?', 'poll', '["Sabah insanı", "Gece kuşu", "Duruma göre"]'),
  ('Anket', 'Bir sonraki buluşmamız nerede olsun?', 'poll', '["Birinin evinde", "Bir restoranda", "Doğada", "Başka bir şehirde"]'),
  ('Anket', 'Kahve mi, çay mı?', 'poll', '["Kahve", "Çay", "İkisi de", "Hiçbiri"]'),
  ('Anket', 'Bu ay modun nasıldı?', 'poll', '["Harika 😄", "İdare eder 🙂", "Yorgun 😴", "Karışık 🌀"]'),
  ('Anket', 'Hafta sonu planın ne?', 'poll', '["Dışarıda gezmek", "Evde dinlenmek", "Arkadaşlarla buluşmak", "Bir şeyler üretmek"]');
