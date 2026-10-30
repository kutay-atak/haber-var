-- ============================================================================
-- Haber Var · telefon bildirimleri (Web Push) ve "ana ekrana ekle".
--
-- Önceki üç dosyadan SONRA, Supabase SQL Editor'da bir kez çalıştır.
-- Ek bir ayar gerekmez: bildirim anahtarları (VAPID) ilk kullanımda sunucu
-- tarafından üretilip app_secrets tablosunda saklanır.
-- ============================================================================

-- ─── Cihazlar: her tarayıcı/telefon için bir bildirim aboneliği ─────────────

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Tarayıcının bildirim servisi (Google, Apple, Mozilla, Microsoft) adresi.
  endpoint text not null unique check (char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) between 1 and 200),
  auth text not null check (char_length(auth) between 1 and 100),
  user_agent text check (char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Aynı bildirim aynı kişiye iki kez gitmesin (e-postadaki email_log gibi).
create table public.push_log (
  issue_id uuid not null references public.issues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.email_kind not null,
  created_at timestamptz not null default now(),
  primary key (issue_id, user_id, kind)
);

-- Sadece sunucunun (service_role) okuyabildiği değerler: bildirim anahtarları.
create table public.app_secrets (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

-- Cihazı kaydeder. Aynı cihaz daha önce başka bir hesaba kayıtlıysa artık bu
-- hesaba geçer (telefonda hesap değiştirildiğinde eski hesabın bildirimleri gelmesin).
-- Sunucu bu adrese istek gönderdiği için sadece bilinen bildirim servislerine izin var.
create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Önce giriş yapmalısın.';
  end if;
  if p_endpoint !~ '^https://([a-z0-9-]+\.)*(googleapis\.com|mozilla\.com|apple\.com|windows\.com)/' then
    raise exception 'Bu tarayıcının bildirim servisi desteklenmiyor.';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, created_at)
  values (v_uid, p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300), clock_timestamp())
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        created_at = excluded.created_at;

  -- Kişi başı en fazla 10 cihaz: en eskiler düşer.
  delete from public.push_subscriptions
  where id in (
    select id from public.push_subscriptions
    where user_id = v_uid
    order by created_at desc
    offset 10
  );
end;
$$;

-- ─── RLS ve yetkiler ────────────────────────────────────────────────────────

alter table public.push_subscriptions enable row level security;
alter table public.push_log enable row level security;
alter table public.app_secrets enable row level security;

create policy "bildirim: kendi cihazlarını görürsün"
  on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "bildirim: kendi cihazını çıkarırsın"
  on public.push_subscriptions for delete to authenticated
  using (user_id = (select auth.uid()));
-- Ekleme sadece save_push_subscription() ile. push_log ve app_secrets için
-- politika yok: onlara sadece sunucu erişir.

revoke all on public.push_subscriptions, public.push_log, public.app_secrets from anon, authenticated;
grant select, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.push_subscriptions, public.push_log, public.app_secrets to service_role;

revoke execute on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;
