\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null

create function pg_temp.expect(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not p_ok then raise exception 'FAIL: %', p_label; end if;
  raise notice 'ok  %', p_label;
end $$;

create function pg_temp.login(p_uid text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(p_uid, ''), false);
$$;

-- Runs a statement as the current role and asserts it raises an error.
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

-- ── Users ────────────────────────────────────────────────────────────────────
\set A '00000000-0000-0000-0000-00000000000a'
\set B '00000000-0000-0000-0000-00000000000b'
\set C '00000000-0000-0000-0000-00000000000c'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'A', 'ayse@example.com', '{"full_name": "Ayşe Yılmaz", "avatar_url": "https://lh3.googleusercontent.com/a/x"}'),
  (:'B', 'mehmet.k@example.com', '{}'),
  (:'C', 'can@example.com', '{"name": "Can"}');

select pg_temp.expect((select display_name from public.profiles where id = :'A') = 'Ayşe Yılmaz', 'profile from Google full_name');
select pg_temp.expect((select display_name from public.profiles where id = :'B') = 'mehmet.k', 'profile from email prefix');
select pg_temp.expect((select count(*) from public.question_bank where group_id is null and kind = 'text') = 112, 'question bank seeded with 112 written questions (no duplicates after a re-run)');

-- ── Group + invite ───────────────────────────────────────────────────────────
select pg_temp.login(:'A');
set role authenticated;
select public.create_group('Kuzenler Şubesi', 'Uzaktaki kuzenler') as gid \gset
select pg_temp.expect((select role from public.group_members where group_id = :'gid' and user_id = :'A') = 'admin', 'creator is admin');
select token from public.invites where group_id = :'gid' \gset
select pg_temp.expect(length(:'token') = 16, 'invite token is 16 chars');

select pg_temp.login(:'B');
select pg_temp.expect((select count(*) from public.groups) = 0, 'non-member sees no groups');
select pg_temp.expect((select count(*) from public.invites) = 0, 'non-member sees no invites');
select pg_temp.expect((select group_name from public.get_invite_preview(:'token')) = 'Kuzenler Şubesi', 'invite preview works');
select pg_temp.expect((select inviter_name from public.get_invite_preview(:'token')) = 'Ayşe Yılmaz', 'invite preview shows inviter');
select pg_temp.expect(public.accept_invite(:'token') = :'gid', 'B accepts invite');
select pg_temp.expect(public.accept_invite(:'token') = :'gid', 'accepting twice is harmless');
select pg_temp.expect((select count(*) from public.groups) = 1, 'member sees group');
select pg_temp.expect((select count(*) from public.profiles) = 2, 'member sees co-member profile');
select pg_temp.expect((select count(*) from public.invites) = 0, 'plain member cannot read invites');
select pg_temp.expect_error(format('select public.regenerate_invite(%L)', :'gid'), 'member cannot regenerate invite', '%yönetici%');

reset role;
select set_config('test.gid', :'gid', false);
set role anon;
select pg_temp.expect((select member_count from public.get_invite_preview(:'token')) = 2, 'anon can preview invite');
select pg_temp.expect_error(format('select public.accept_invite(%L)', :'token'), 'anon cannot accept invite');
reset role;

select pg_temp.login(:'C');
set role authenticated;
select pg_temp.expect((select count(*) from public.profiles) = 1, 'outsider sees only own profile');
select pg_temp.expect_error('select public.accept_invite(''nope'')', 'bad token rejected', '%geçersiz%');

-- ── Issue lifecycle ──────────────────────────────────────────────────────────
select pg_temp.login(:'B');
select pg_temp.expect_error(
  format($q$select public.save_issue(%L, null, 'x', now() + interval '3 days', 'classic', '[{"text":"Nasılsın?"}]', false)$q$, :'gid'),
  'member cannot create issue', '%yönetici%');

select pg_temp.login(:'A');
update public.groups set default_design = '{"palette": "okyanus", "fontPair": "retro"}' where id = :'gid';
select public.save_issue(:'gid', null, 'Ekim sayısı', now() + interval '3 days', 'scrapbook',
  '[{"text": "Bu ay seni ne güldürdü?"}, {"text": "Penceren"}, {"text": "Üçüncü soru"}]', false) as iid \gset
select pg_temp.expect((select number from public.issues where id = :'iid') = 1, 'first issue is number 1');
select pg_temp.expect((select design ->> 'palette' from public.issues where id = :'iid') = 'okyanus', 'new issue inherits group design');
update public.issues set template = 'tabloid', design = '{"palette": "gece"}' where id = :'iid';
select pg_temp.expect((select template from public.issues where id = :'iid') = 'tabloid', 'admin can change template to a new one');
select pg_temp.expect((select count(*) from public.issue_questions where issue_id = :'iid') = 3, 'issue has 3 questions');
select pg_temp.expect_error(
  format($q$select public.save_issue(%L, null, 'x', now() + interval '3 days', 'classic', '[]', false)$q$, :'gid'),
  'empty question list rejected', '%1 ile 10%');

select pg_temp.login(:'B');
select pg_temp.expect((select count(*) from public.issues) = 0, 'member cannot see draft');
update public.groups set default_design = '{"palette": "seker"}' where id = :'gid';
reset role;
select pg_temp.expect((select default_design ->> 'palette' from public.groups where id = :'gid') = 'okyanus', 'member cannot change group design');
set role authenticated;
select pg_temp.expect((select count(*) from public.issue_questions) = 0, 'member cannot see draft questions');

select pg_temp.login(:'A');
select public.save_issue(:'gid', :'iid', 'Ekim sayısı', now() + interval '3 days', 'scrapbook',
  '[{"text": "Bu ay seni ne güldürdü?"}, {"text": "Şu an pencerenden ne görüyorsun?"}, {"text": "Üçüncü soru"}]', true);
select pg_temp.expect((select status from public.issues where id = :'iid') = 'open', 'draft started');
select pg_temp.expect_error(
  format($q$select public.save_issue(%L, %L, 'x', now() + interval '3 days', 'classic', '[{"text":"Yeni soru"}]', false)$q$, :'gid', :'iid'),
  'open issue questions are locked', '%değiştirilemez%');
select public.save_issue(:'gid', null, 'Kasım', now() + interval '10 days', 'classic', '[{"text": "Kasım sorusu"}]', false) as iid2 \gset
select pg_temp.expect_error(format('select public.start_issue(%L)', :'iid2'), 'only one open issue per group', '%devam eden%');

-- ── Answers stay secret until publish ────────────────────────────────────────
select pg_temp.login(:'B');
select pg_temp.expect((select count(*) from public.issues) = 1, 'member sees open issue but not the new draft');
select id as q1 from public.issue_questions where issue_id = :'iid' and position = 0 \gset
select id as q2 from public.issue_questions where issue_id = :'iid' and position = 1 \gset
select id as q3 from public.issue_questions where issue_id = :'iid' and position = 2 \gset
insert into public.responses (issue_question_id, body) values (:'q1', 'Kedim klavyeye bastı') returning id as rb1 \gset
insert into public.responses (issue_question_id, body) values (:'q2', '') returning id as rb2 \gset
insert into public.responses (issue_question_id, body) values (:'q3', '') returning id as rb3 \gset
insert into public.responses (issue_question_id, body) values (:'q1', 'İkinci deneme')
  on conflict (issue_question_id, user_id) do update set body = excluded.body;
select pg_temp.expect((select body from public.responses where id = :'rb1') = 'İkinci deneme', 'upsert updates own answer');
select pg_temp.expect((select issue_id from public.responses where id = :'rb1') = :'iid', 'trigger fills issue_id');
select pg_temp.expect_error(
  format($q$insert into public.responses (issue_question_id, user_id, body) values (%L, %L, 'sahte')$q$, :'q1', :'A'),
  'cannot write as someone else', '%row-level security%');

select pg_temp.login(:'A');
insert into public.responses (issue_question_id, body) values (:'q1', 'Ayşe yanıtı');
select pg_temp.expect((select count(*) from public.responses) = 1, 'admin sees only own answer while open');
select pg_temp.expect((select count(*) from public.issue_participants(:'iid')) = 2, 'participants counts both writers');

select pg_temp.login(:'C');
select pg_temp.expect((select count(*) from public.issue_participants(:'iid')) = 0, 'outsider gets no participants');

-- ── Media limits (server inserts with service_role) ─────────────────────────
reset role;
set role service_role;
insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes)
select :'rb1', :'iid', :'B', 'image', 'img-' || g, 200000 from generate_series(1, 4) g;
select pg_temp.expect((select max(position) from public.response_media where response_id = :'rb1') = 3, 'positions assigned 0..3');
select pg_temp.expect_error(
  format($q$insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (%L, %L, %L, 'image', 'img-5', 1000)$q$, :'rb1', :'iid', :'B'),
  '5th photo rejected', '%4 fotoğraf%');
select pg_temp.expect_error(
  format($q$insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (%L, %L, %L, 'image', 'img-big', 5000000)$q$, :'rb2', :'iid', :'B'),
  'oversized photo rejected', '%3 MB%');
insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (:'rb1', :'iid', :'B', 'video', 'vid-1', 15000000);
select pg_temp.expect_error(
  format($q$insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (%L, %L, %L, 'video', 'vid-x', 1000)$q$, :'rb1', :'iid', :'B'),
  'second video on same answer rejected', '%1 video%');
insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (:'rb2', :'iid', :'B', 'video', 'vid-2', 15000000);
select pg_temp.expect_error(
  format($q$insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (%L, %L, %L, 'video', 'vid-3', 1000)$q$, :'rb3', :'iid', :'B'),
  'third video in issue rejected', '%2 video%');
select pg_temp.expect((select count(*) from public.notification_recipients(:'gid')) = 2, 'server can list recipients');
reset role;

set role authenticated;
select pg_temp.login(:'B');
select pg_temp.expect_error(format('select * from public.notification_recipients(%L)', :'gid'), 'members cannot read emails', '%permission denied%');
select pg_temp.expect((select count(*) from public.response_media) = 6, 'B sees own media');
select pg_temp.expect_error(
  format($q$insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (%L, %L, %L, 'image', 'sneaky', 1000)$q$, :'rb2', :'iid', :'B'),
  'clients cannot insert media directly', '%row-level security%');
select pg_temp.login(:'A');
select pg_temp.expect((select count(*) from public.response_media) = 0, 'admin cannot see B media before publish');

-- ── Deadline passes → newspaper opens ───────────────────────────────────────
reset role;
update public.issues set deadline_at = now() - interval '1 minute' where id = :'iid';
set role authenticated;
select pg_temp.login(:'A');
select pg_temp.expect((select count(*) from public.responses) = 4, 'after deadline admin sees all answers');
select pg_temp.expect((select count(*) from public.response_media) = 6, 'after deadline admin sees all media');
select pg_temp.login(:'B');
update public.responses set body = 'geç kaldım' where id = :'rb1';
select pg_temp.expect((select body from public.responses where id = :'rb1') = 'İkinci deneme', 'answers locked after deadline');
select pg_temp.login(:'C');
select pg_temp.expect((select count(*) from public.responses) = 0, 'outsider still sees nothing');

select pg_temp.login(:'A');
select public.start_issue(:'iid2');
select pg_temp.expect((select status from public.issues where id = :'iid') = 'published', 'starting next issue finalizes the expired one');
select pg_temp.expect((select status from public.issues where id = :'iid2') = 'open', 'next issue is open');
select public.publish_issue(:'iid2');
select pg_temp.expect((select status from public.issues where id = :'iid2') = 'published', 'admin can publish early');
update public.issues set template = 'retro', design = '{"palette": "nane"}' where id = :'iid2';
select pg_temp.expect((select design ->> 'palette' from public.issues where id = :'iid2') = 'nane', 'admin can redesign a published issue');
select pg_temp.expect((select status from public.issues where id = :'iid2') = 'published', 'redesign keeps the issue published');
select pg_temp.login(:'B');
update public.issues set design = '{"palette": "gece"}' where id = :'iid2';
select pg_temp.expect((select design ->> 'palette' from public.issues where id = :'iid2') = 'nane', 'member cannot redesign a published issue');
select pg_temp.login(:'A');

-- ── Membership management ────────────────────────────────────────────────────
select pg_temp.login(:'B');
delete from public.groups where id = :'gid';
reset role;
select pg_temp.expect((select count(*) from public.groups where id = :'gid') = 1, 'member cannot delete group');
set role authenticated;
select pg_temp.login(:'A');
select public.regenerate_invite(:'gid') as token2 \gset
select pg_temp.expect(:'token2' <> :'token', 'new invite token generated');
select pg_temp.login(:'C');
select pg_temp.expect_error(format('select public.accept_invite(%L)', :'token'), 'old invite revoked', '%geçersiz%');
select pg_temp.login(:'B');
delete from public.group_members where group_id = :'gid' and user_id = :'B';
select pg_temp.expect((select count(*) from public.groups) = 0, 'member can leave group');
reset role;

reset role;
select pg_temp.expect_error(
  format($q$update public.issues set design = jsonb_build_object('x', repeat('a', 30000)) where id = %L$q$, :'iid'),
  'oversized design rejected', '%check constraint%');

\echo ALL SQL TESTS PASSED
