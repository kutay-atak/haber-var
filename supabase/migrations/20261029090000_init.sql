-- ============================================================================
-- Haber Var · veritabanı şeması
--
-- Supabase panelinde SQL Editor'a yapıştırıp bir kez çalıştır
-- (ya da Supabase CLI ile: `npx supabase db push`).
--
-- Güvenlik modeli kısaca:
--   * Her tabloda RLS (satır bazlı güvenlik) açık.
--   * Kullanıcı sadece üyesi olduğu grupları ve o grupların sayılarını görür.
--   * Yanıtlar sayı yayımlanana kadar sadece sahibine görünür (sürpriz!).
--   * Grup oluşturma, davet kabulü, sayı başlatma gibi çok adımlı işler
--     aşağıdaki "security definer" fonksiyonlarla tek seferde yapılır.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ─── Tipler ─────────────────────────────────────────────────────────────────

create type public.member_role as enum ('admin', 'member');
create type public.issue_status as enum ('draft', 'open', 'published');
create type public.newspaper_template as enum ('classic', 'magazine', 'scrapbook');
create type public.media_kind as enum ('image', 'video');
create type public.email_kind as enum ('issue_open', 'reminder', 'published');

-- ─── Tablolar ───────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  email_opt_in boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 280),
  default_template public.newspaper_template not null default 'classic',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_id_idx on public.group_members (user_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  -- 16 karakterlik, URL'de güvenle kullanılabilen rastgele kod
  token text not null unique
    default translate(encode(extensions.gen_random_bytes(12), 'base64'), '+/', '-_'),
  created_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz,
  revoked_at timestamptz,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);
create index invites_group_id_idx on public.invites (group_id);

-- group_id boşsa herkesin gördüğü hazır soru, doluysa o gruba özel soru.
create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 3 and 300),
  category text not null default 'Bizim sorular',
  group_id uuid references public.groups (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index question_bank_group_id_idx on public.question_bank (group_id);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  number int not null,
  title text check (char_length(title) <= 80),
  status public.issue_status not null default 'draft',
  template public.newspaper_template not null default 'classic',
  deadline_at timestamptz not null,
  opened_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (group_id, number)
);
-- Bir grupta aynı anda tek bir açık sayı olabilir.
create unique index issues_one_open_per_group on public.issues (group_id) where status = 'open';

create table public.issue_questions (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  position int not null,
  -- Soru metni kopyalanır: havuzdaki soru sonradan değişse de eski sayılar bozulmaz.
  question_text text not null check (char_length(question_text) between 3 and 300),
  source_question_id uuid references public.question_bank (id) on delete set null,
  unique (issue_id, position)
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  issue_question_id uuid not null references public.issue_questions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null default '' check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_question_id, user_id)
);
create index responses_issue_id_idx on public.responses (issue_id);

create table public.response_media (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses (id) on delete cascade,
  issue_id uuid not null references public.issues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.media_kind not null,
  public_id text not null unique, -- Cloudinary'deki dosya kimliği
  width int,
  height int,
  duration_s numeric(6, 2),
  bytes int not null check (bytes > 0),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index response_media_response_id_idx on public.response_media (response_id);
create index response_media_issue_user_idx on public.response_media (issue_id, user_id);

-- Aynı e-postanın iki kez gitmesini engelleyen kayıt defteri.
create table public.email_log (
  issue_id uuid not null references public.issues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.email_kind not null,
  sent_at timestamptz not null default now(),
  primary key (issue_id, user_id, kind)
);

-- ─── Yardımcı fonksiyonlar (RLS politikalarında kullanılır) ─────────────────

create function public.is_member(p_group_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = (select auth.uid())
  );
$$;

create function public.is_admin(p_group_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = (select auth.uid()) and m.role = 'admin'
  );
$$;

create function public.shares_group_with(p_user_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on b.group_id = a.group_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user_id
  );
$$;

-- Üye sayıyı görebilir mi? (Taslakları sadece yöneticiler görür.)
create function public.can_view_issue(p_issue_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = p_issue_id
      and public.is_member(i.group_id)
      and (i.status <> 'draft' or public.is_admin(i.group_id))
  );
$$;

-- Yanıt kabul ediliyor mu?
create function public.issue_is_open(p_issue_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = p_issue_id and i.status = 'open' and i.deadline_at > now()
  );
$$;

-- Süresi dolan açık sayı, zamanlanmış iş onu 'published' yapmadan önce de
-- yayımlanmış sayılır. Böylece gazete tam son teslim anında açılır.
create function public.issue_is_published(p_issue_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = p_issue_id
      and (i.status = 'published' or (i.status = 'open' and i.deadline_at <= now()))
  );
$$;

-- ─── Tetikleyiciler ─────────────────────────────────────────────────────────

-- Yeni kullanıcı kaydolunca profilini oluştur (Google adı/avatarı ya da formdaki ad).
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Arkadaş'
    ), 60),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Yanıtın hangi sayıya ait olduğunu sorudan türet.
create function public.set_response_defaults()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  select q.issue_id into new.issue_id
  from public.issue_questions q where q.id = new.issue_question_id;
  if new.issue_id is null then
    raise exception 'Soru bulunamadı.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger responses_set_defaults
  before insert or update on public.responses
  for each row execute function public.set_response_defaults();

-- Medya kotası. Bu sayıları değiştirirsen src/lib/media/limits.ts dosyasını da güncelle.
create function public.check_media_limits()
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

  if new.kind = 'image' then
    if new.bytes > 3 * 1024 * 1024 then
      raise exception 'Fotoğraf çok büyük (en fazla 3 MB).';
    end if;
    select count(*) into v_count from public.response_media
    where response_id = new.response_id and kind = 'image';
    if v_count >= 4 then
      raise exception 'Bir yanıta en fazla 4 fotoğraf eklenebilir.';
    end if;
  else
    if new.bytes > 30 * 1024 * 1024 then
      raise exception 'Video çok büyük (en fazla 30 MB).';
    end if;
    select count(*) into v_count from public.response_media
    where response_id = new.response_id and kind = 'video';
    if v_count >= 1 then
      raise exception 'Bir yanıta en fazla 1 video eklenebilir.';
    end if;
    select count(*) into v_count from public.response_media
    where issue_id = new.issue_id and user_id = new.user_id and kind = 'video';
    if v_count >= 2 then
      raise exception 'Bir sayıda en fazla 2 video paylaşabilirsin.';
    end if;
  end if;

  select coalesce(max(position) + 1, 0) into new.position
  from public.response_media where response_id = new.response_id;
  return new;
end;
$$;

create trigger response_media_check_limits
  before insert on public.response_media
  for each row execute function public.check_media_limits();

-- ─── RLS politikaları ───────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.invites enable row level security;
alter table public.question_bank enable row level security;
alter table public.issues enable row level security;
alter table public.issue_questions enable row level security;
alter table public.responses enable row level security;
alter table public.response_media enable row level security;
alter table public.email_log enable row level security; -- politika yok: sadece sunucu erişir

create policy "profil: kendin ve grup arkadaşların"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_group_with(id));
create policy "profil: sadece kendin düzenlersin"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "grup: üyeler görür"
  on public.groups for select to authenticated
  using (public.is_member(id));
create policy "grup: yöneticiler düzenler"
  on public.groups for update to authenticated
  using (public.is_admin(id)) with check (public.is_admin(id));
create policy "grup: yöneticiler siler"
  on public.groups for delete to authenticated
  using (public.is_admin(id));

create policy "üyelik: üyeler görür"
  on public.group_members for select to authenticated
  using (public.is_member(group_id));
create policy "üyelik: yöneticiler rol değiştirir"
  on public.group_members for update to authenticated
  using (public.is_admin(group_id)) with check (public.is_admin(group_id));
create policy "üyelik: yönetici çıkarır ya da kendin ayrılırsın"
  on public.group_members for delete to authenticated
  using (public.is_admin(group_id) or user_id = (select auth.uid()));

create policy "davet: yöneticiler görür"
  on public.invites for select to authenticated
  using (public.is_admin(group_id));

create policy "soru havuzu: hazır sorular ve grubun soruları"
  on public.question_bank for select to authenticated
  using (group_id is null or public.is_member(group_id));
create policy "soru havuzu: yöneticiler gruba soru ekler"
  on public.question_bank for insert to authenticated
  with check (group_id is not null and public.is_admin(group_id) and created_by = (select auth.uid()));
create policy "soru havuzu: yöneticiler grubun sorusunu siler"
  on public.question_bank for delete to authenticated
  using (group_id is not null and public.is_admin(group_id));

create policy "sayı: üyeler görür (taslakları sadece yöneticiler)"
  on public.issues for select to authenticated
  using (public.is_member(group_id) and (status <> 'draft' or public.is_admin(group_id)));
create policy "sayı: yöneticiler düzenler"
  on public.issues for update to authenticated
  using (public.is_admin(group_id)) with check (public.is_admin(group_id));
create policy "sayı: yöneticiler siler"
  on public.issues for delete to authenticated
  using (public.is_admin(group_id));

create policy "soru: sayıyı görenler görür"
  on public.issue_questions for select to authenticated
  using (public.can_view_issue(issue_id));

create policy "yanıt: kendi yanıtın her zaman, diğerleri yayından sonra"
  on public.responses for select to authenticated
  using (
    user_id = (select auth.uid())
    or (public.issue_is_published(issue_id) and public.can_view_issue(issue_id))
  );
create policy "yanıt: açık sayıya kendi yanıtını yazarsın"
  on public.responses for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.issue_is_open(issue_id)
    and public.can_view_issue(issue_id)
  );
create policy "yanıt: açık sayıda kendi yanıtını düzenlersin"
  on public.responses for update to authenticated
  using (user_id = (select auth.uid()) and public.issue_is_open(issue_id))
  with check (user_id = (select auth.uid()) and public.issue_is_open(issue_id));
create policy "yanıt: açık sayıda kendi yanıtını silersin"
  on public.responses for delete to authenticated
  using (user_id = (select auth.uid()) and public.issue_is_open(issue_id));

-- Medya ekleme/silme sadece sunucudan yapılır (Cloudinary imzası doğrulandıktan sonra).
create policy "medya: kendi medyan her zaman, diğerleri yayından sonra"
  on public.response_media for select to authenticated
  using (
    user_id = (select auth.uid())
    or (public.issue_is_published(issue_id) and public.can_view_issue(issue_id))
  );

-- ─── İşlem fonksiyonları (RPC) ──────────────────────────────────────────────

-- Grup oluştur: kurucu yönetici olur ve ilk davet linki hazırlanır.
create function public.create_group(p_name text, p_description text default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_group_id uuid;
begin
  if v_uid is null then
    raise exception 'Önce giriş yapmalısın.';
  end if;
  insert into public.groups (name, description, created_by)
  values (trim(p_name), nullif(trim(coalesce(p_description, '')), ''), v_uid)
  returning id into v_group_id;
  insert into public.group_members (group_id, user_id, role) values (v_group_id, v_uid, 'admin');
  insert into public.invites (group_id, created_by) values (v_group_id, v_uid);
  return v_group_id;
end;
$$;

-- Davet sayfası için önizleme (giriş yapmamış ziyaretçiler de çağırabilir).
create function public.get_invite_preview(p_token text)
returns table (
  group_id uuid,
  group_name text,
  group_description text,
  member_count int,
  inviter_name text,
  already_member boolean
)
language sql stable security definer set search_path = ''
as $$
  select
    g.id,
    g.name,
    g.description,
    (select count(*)::int from public.group_members m where m.group_id = g.id),
    (select p.display_name from public.profiles p where p.id = i.created_by),
    exists (
      select 1 from public.group_members m
      where m.group_id = g.id and m.user_id = (select auth.uid())
    )
  from public.invites i
  join public.groups g on g.id = i.group_id
  where i.token = p_token
    and i.revoked_at is null
    and (i.expires_at is null or i.expires_at > now());
$$;

-- Daveti kabul et ve gruba katıl.
create function public.accept_invite(p_token text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.invites;
begin
  if v_uid is null then
    raise exception 'Önce giriş yapmalısın.';
  end if;

  select * into v_invite from public.invites
  where token = p_token
    and revoked_at is null
    and (expires_at is null or expires_at > now())
  for update;
  if not found then
    raise exception 'Bu davet linki geçersiz ya da süresi dolmuş.';
  end if;

  if exists (
    select 1 from public.group_members
    where group_id = v_invite.group_id and user_id = v_uid
  ) then
    return v_invite.group_id;
  end if;

  if (select count(*) from public.group_members where group_id = v_invite.group_id) >= 50 then
    raise exception 'Bu grup dolu (en fazla 50 kişi).';
  end if;

  insert into public.group_members (group_id, user_id) values (v_invite.group_id, v_uid);
  update public.invites set use_count = use_count + 1 where id = v_invite.id;
  return v_invite.group_id;
end;
$$;

-- Eski davet linklerini iptal edip yenisini üret.
create function public.regenerate_invite(p_group_id uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_token text;
begin
  if not public.is_admin(p_group_id) then
    raise exception 'Bunu sadece grup yöneticileri yapabilir.';
  end if;
  update public.invites set revoked_at = now()
  where group_id = p_group_id and revoked_at is null;
  insert into public.invites (group_id, created_by) values (p_group_id, auth.uid())
  returning token into v_token;
  return v_token;
end;
$$;

-- Sayıyı başlat (taslak → açık).
create function public.start_issue(p_issue_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_issue public.issues;
begin
  select * into v_issue from public.issues where id = p_issue_id for update;
  if not found or not public.is_admin(v_issue.group_id) then
    raise exception 'Sayı bulunamadı.';
  end if;
  if v_issue.status <> 'draft' then
    raise exception 'Bu sayı zaten başlamış.';
  end if;
  if v_issue.deadline_at <= now() + interval '1 hour' then
    raise exception 'Son teslim tarihi en az 1 saat sonra olmalı.';
  end if;

  -- Süresi dolmuş ama henüz kapanmamış sayıyı kapat, sonra "tek açık sayı" kuralını kontrol et.
  update public.issues set status = 'published', published_at = now()
  where group_id = v_issue.group_id and status = 'open' and deadline_at <= now();
  if exists (select 1 from public.issues where group_id = v_issue.group_id and status = 'open') then
    raise exception 'Bu grupta devam eden bir sayı var. Önce onun bitmesini bekle ya da erken yayımla.';
  end if;

  update public.issues set status = 'open', opened_at = now() where id = p_issue_id;
end;
$$;

-- Yeni sayı oluştur ya da taslağı güncelle; istenirse hemen başlat.
-- p_questions: [{"text": "Soru metni", "source_id": "<question_bank.id ya da null>"}, ...]
create function public.save_issue(
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
    insert into public.issues (group_id, number, title, deadline_at, template, created_by)
    values (p_group_id, v_number, nullif(trim(coalesce(p_title, '')), ''), p_deadline_at, p_template, auth.uid())
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

  insert into public.issue_questions (issue_id, position, question_text, source_question_id)
  select v_issue_id, (q.ord - 1)::int, trim(q.value ->> 'text'), nullif(q.value ->> 'source_id', '')::uuid
  from jsonb_array_elements(p_questions) with ordinality as q(value, ord);

  if p_start then
    perform public.start_issue(v_issue_id);
  end if;
  return v_issue_id;
end;
$$;

-- Süreyi beklemeden yayımla.
create function public.publish_issue(p_issue_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.issues
  set status = 'published', published_at = now(), deadline_at = least(deadline_at, now())
  where id = p_issue_id and status = 'open' and public.is_admin(group_id);
  if not found then
    raise exception 'Sadece devam eden bir sayı yayımlanabilir.';
  end if;
end;
$$;

-- Kim yazdı? (İçerik değil, sadece kişiler: "5/8 kişi yazdı" göstergesi için.)
create function public.issue_participants(p_issue_id uuid)
returns setof uuid language sql stable security definer set search_path = ''
as $$
  select distinct r.user_id
  from public.responses r
  where r.issue_id = p_issue_id
    and public.can_view_issue(p_issue_id)
    and (
      char_length(trim(r.body)) > 0
      or exists (select 1 from public.response_media m where m.response_id = r.id)
    );
$$;

-- E-posta alıcıları. Adresler arkadaşlara gösterilmez; sadece sunucu çağırabilir.
create function public.notification_recipients(p_group_id uuid)
returns table (user_id uuid, email text, display_name text)
language sql stable security definer set search_path = ''
as $$
  select p.id, u.email::text, p.display_name
  from public.group_members m
  join public.profiles p on p.id = m.user_id
  join auth.users u on u.id = m.user_id
  where m.group_id = p_group_id and p.email_opt_in and u.email is not null;
$$;

-- ─── Yetkiler ───────────────────────────────────────────────────────────────

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;

revoke execute on function public.create_group(text, text) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
revoke execute on function public.regenerate_invite(uuid) from public, anon;
revoke execute on function public.start_issue(uuid) from public, anon;
revoke execute on function public.save_issue(uuid, uuid, text, timestamptz, public.newspaper_template, jsonb, boolean) from public, anon;
revoke execute on function public.publish_issue(uuid) from public, anon;
revoke execute on function public.issue_participants(uuid) from public, anon;
revoke execute on function public.notification_recipients(uuid) from public, anon, authenticated;

grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.regenerate_invite(uuid) to authenticated;
grant execute on function public.start_issue(uuid) to authenticated;
grant execute on function public.save_issue(uuid, uuid, text, timestamptz, public.newspaper_template, jsonb, boolean) to authenticated;
grant execute on function public.publish_issue(uuid) to authenticated;
grant execute on function public.issue_participants(uuid) to authenticated;
grant execute on function public.get_invite_preview(text) to anon, authenticated;
grant execute on function public.notification_recipients(uuid) to service_role;
