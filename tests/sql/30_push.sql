\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null

create function pg_temp.expect(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAIL: %', p_label; end if;
  raise notice 'ok  %', p_label;
end $$;

create function pg_temp.login(p_uid text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(p_uid, ''), false);
$$;

create function pg_temp.expect_error(p_sql text, p_label text, p_like text default '%') returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FAIL (no error): %', p_label;
exception when others then
  if sqlerrm like 'FAIL (no error)%' then raise; end if;
  if sqlerrm not like p_like then raise exception 'FAIL (wrong error "%"): %', sqlerrm, p_label; end if;
  raise notice 'ok  % → "%"', p_label, sqlerrm;
end $$;

grant execute on all functions in schema pg_temp to authenticated, service_role, anon;

\echo '── push: device subscriptions, log, secrets'
\set P '00000000-0000-0000-0000-0000000000b1'
\set Q '00000000-0000-0000-0000-0000000000b2'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'P', 'p@example.com', '{"full_name": "Pelin"}'),
  (:'Q', 'q@example.com', '{"full_name": "Kaan"}');

set role authenticated;
select pg_temp.login(:'P');
select public.save_push_subscription('https://fcm.googleapis.com/fcm/send/aaa', 'key-a', 'auth-a', 'Chrome Android');
select pg_temp.expect((select count(*) from public.push_subscriptions) = 1, 'device saved');
select pg_temp.expect((select user_id from public.push_subscriptions) = :'P', 'device belongs to the caller');
select public.save_push_subscription('https://fcm.googleapis.com/fcm/send/aaa', 'key-a2', 'auth-a2', 'Chrome Android');
select pg_temp.expect((select count(*) from public.push_subscriptions) = 1, 'saving the same device again keeps one row');
select pg_temp.expect((select p256dh from public.push_subscriptions) = 'key-a2', 'saving again refreshes the keys');

select public.save_push_subscription('https://web.push.apple.com/QGv1', 'key-i', 'auth-i', 'Safari iPhone');
select public.save_push_subscription('https://updates.push.services.mozilla.com/wpush/v2/x', 'key-f', 'auth-f', 'Firefox');
select public.save_push_subscription('https://wns2-par02p.notify.windows.com/w/?token=x', 'key-e', 'auth-e', 'Edge');
select pg_temp.expect((select count(*) from public.push_subscriptions) = 4, 'Apple, Mozilla and Microsoft push services accepted');

select pg_temp.expect_error(
  $q$select public.save_push_subscription('https://evil.example.com/push', 'k', 'a', null)$q$,
  'unknown push service rejected', '%desteklenmiyor%');
select pg_temp.expect_error(
  $q$select public.save_push_subscription('http://fcm.googleapis.com/fcm/send/x', 'k', 'a', null)$q$,
  'plain http rejected', '%desteklenmiyor%');
select pg_temp.expect_error(
  $q$select public.save_push_subscription('https://fcm.googleapis.com.evil.io/x', 'k', 'a', null)$q$,
  'look-alike host rejected', '%desteklenmiyor%');
select pg_temp.expect_error(
  $q$select public.save_push_subscription('https://192.168.1.10/x', 'k', 'a', null)$q$,
  'internal address rejected', '%desteklenmiyor%');
select pg_temp.expect_error(
  $q$insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values (auth.uid(), 'https://evil.example.com/x', 'k', 'a')$q$,
  'direct insert blocked', '%permission denied%');
select pg_temp.expect_error(
  $q$select count(*) from public.push_log$q$,
  'clients cannot read the push log', '%permission denied%');
select pg_temp.expect_error(
  $q$select count(*) from public.app_secrets$q$,
  'clients cannot read app secrets', '%permission denied%');

select pg_temp.login(:'Q');
select pg_temp.expect((select count(*) from public.push_subscriptions) = 0, 'others cannot see your devices');
delete from public.push_subscriptions where endpoint = 'https://web.push.apple.com/QGv1';
select pg_temp.login(:'P');
select pg_temp.expect((select count(*) from public.push_subscriptions) = 4, 'others cannot remove your devices');

-- Telefonda hesap değişince cihaz yeni hesaba geçer.
select pg_temp.login(:'Q');
select public.save_push_subscription('https://web.push.apple.com/QGv1', 'key-q', 'auth-q', 'Safari iPhone');
select pg_temp.expect((select count(*) from public.push_subscriptions) = 1, 'a shared device moves to the new account');
select pg_temp.login(:'P');
select pg_temp.expect((select count(*) from public.push_subscriptions) = 3, 'the previous account no longer has that device');

delete from public.push_subscriptions where endpoint = 'https://updates.push.services.mozilla.com/wpush/v2/x';
select pg_temp.expect((select count(*) from public.push_subscriptions) = 2, 'you can remove your own device');

select public.save_push_subscription('https://fcm.googleapis.com/fcm/send/n' || g, 'k', 'a', null) from generate_series(1, 12) g;
select pg_temp.expect((select count(*) from public.push_subscriptions) = 10, 'at most 10 devices per person');
select pg_temp.expect(
  (select count(*) from public.push_subscriptions where endpoint = 'https://fcm.googleapis.com/fcm/send/n12') = 1,
  'the newest devices are kept');

select pg_temp.login(null);
select pg_temp.expect_error(
  $q$select public.save_push_subscription('https://fcm.googleapis.com/fcm/send/z', 'k', 'a', null)$q$,
  'must be logged in', '%giriş yapmalısın%');

reset role;
set role anon;
select pg_temp.expect_error(
  $q$select public.save_push_subscription('https://fcm.googleapis.com/fcm/send/z', 'k', 'a', null)$q$,
  'anonymous visitors cannot save devices', '%permission denied%');
select pg_temp.expect_error($q$select count(*) from public.app_secrets$q$, 'anon cannot read app secrets', '%permission denied%');

reset role;
set role service_role;
insert into public.app_secrets (key, value) values ('vapid', '{"publicKey": "x", "privateKey": "y"}') on conflict (key) do nothing;
insert into public.app_secrets (key, value) values ('vapid', '{"publicKey": "other", "privateKey": "pair"}') on conflict (key) do nothing;
select pg_temp.expect((select value::jsonb ->> 'publicKey' from public.app_secrets where key = 'vapid') = 'x', 'first stored key pair wins');
select pg_temp.expect((select count(*) from public.push_subscriptions) = 11, 'server sees every device');

reset role;
delete from auth.users where id = :'Q';
select pg_temp.expect(
  (select count(*) from public.push_subscriptions where endpoint = 'https://web.push.apple.com/QGv1') = 0,
  'deleting an account removes its devices');

\echo ALL PUSH SQL TESTS PASSED
