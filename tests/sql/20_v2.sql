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

\echo '── v2: editors, polls, audio, reactions, schedules'
\set D '00000000-0000-0000-0000-0000000000d1'
\set E '00000000-0000-0000-0000-0000000000e1'
\set F '00000000-0000-0000-0000-0000000000f1'
\set G '00000000-0000-0000-0000-0000000000a9'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'D', 'd@example.com', '{"full_name": "Deniz"}'),
  (:'E', 'e@example.com', '{"full_name": "Elif"}'),
  (:'F', 'f@example.com', '{"full_name": "Ferhat"}'),
  (:'G', 'g@example.com', '{"full_name": "Gizem"}');

select pg_temp.expect((select count(*) from public.question_bank where kind = 'who') = 20, 'bank has 20 "who" questions');
select pg_temp.expect((select count(*) from public.question_bank where kind = 'poll') = 10, 'bank has 10 polls');

set role authenticated;
select pg_temp.login(:'D');
select public.create_group('Editörler', null) as gid \gset
select token from public.invites where group_id = :'gid' \gset
select pg_temp.login(:'E');
select public.accept_invite(:'token');
select pg_temp.login(:'F');
select public.accept_invite(:'token');

-- ── Roles ────────────────────────────────────────────────────────────────────
select pg_temp.login(:'F');
update public.group_members set role = 'editor' where group_id = :'gid' and user_id = :'F';
select pg_temp.expect((select role::text from public.group_members where group_id = :'gid' and user_id = :'F') = 'member', 'member cannot make themselves editor');
select pg_temp.login(:'D');
update public.group_members set role = 'editor' where group_id = :'gid' and user_id = :'E';
select pg_temp.expect((select role::text from public.group_members where group_id = :'gid' and user_id = :'E') = 'editor', 'admin makes E an editor');
select pg_temp.login(:'E');
select pg_temp.expect(public.is_editor(:'gid'), 'is_editor true for editor');
select pg_temp.expect(not public.is_admin(:'gid'), 'editor is not admin');
select pg_temp.login(:'F');
select pg_temp.expect(not public.is_editor(:'gid'), 'is_editor false for member');

-- ── Question queue ───────────────────────────────────────────────────────────
select pg_temp.login(:'E');
insert into public.question_queue (group_id, text) values (:'gid', 'Elif''in sorusu: bu ay ne okudun?') returning id as qe \gset
insert into public.question_queue (group_id, text, kind, options) values (:'gid', 'Pizza mı döner mi?', 'poll', '["Pizza", "Döner"]') returning id as qe_poll \gset
select pg_temp.expect_error(
  format($q$insert into public.question_queue (group_id, text, kind, options) values (%L, 'Tek seçenek', 'poll', '["Yalnız"]')$q$, :'gid'),
  'poll needs at least 2 options', '%check constraint%');
select pg_temp.expect_error(
  format($q$insert into public.question_queue (group_id, text, kind, options) values (%L, 'Kim?', 'who', '["a","b"]')$q$, :'gid'),
  '"who" questions take no options', '%check constraint%');
select pg_temp.expect((select count(*) from public.question_queue) = 2, 'editor sees the queue');
insert into public.question_bank (group_id, text, created_by) values (:'gid', 'Editörün havuz sorusu', :'E');
select pg_temp.expect((select count(*) from public.question_bank where group_id = :'gid') = 1, 'editor can add to the group pool');

select pg_temp.login(:'F');
select pg_temp.expect((select count(*) from public.question_queue) = 0, 'member cannot see the queue');
select pg_temp.expect_error(
  format($q$insert into public.question_queue (group_id, text, added_by) values (%L, 'Üye sorusu', %L)$q$, :'gid', :'F'),
  'member cannot add to the queue', '%row-level security%');
select pg_temp.expect_error(
  format($q$insert into public.question_bank (group_id, text, created_by) values (%L, 'Üyenin havuz sorusu', %L)$q$, :'gid', :'F'),
  'member cannot add to the group pool', '%row-level security%');

select pg_temp.login(:'D');
insert into public.question_queue (group_id, text) values (:'gid', 'Yöneticinin sorusu') returning id as qd \gset
select pg_temp.login(:'E');
delete from public.question_queue where id = :'qd';
select pg_temp.login(:'D');
select pg_temp.expect((select count(*) from public.question_queue where id = :'qd') = 1, 'editor cannot remove the admin''s question');
delete from public.question_queue where id = :'qd';
select pg_temp.expect((select count(*) from public.question_queue) = 2, 'admin removes a queued question');

-- ── Issue with every question type ───────────────────────────────────────────
select pg_temp.expect_error(
  format($q$select public.save_issue(%L, null, null, now() + interval '3 days', 'classic', '[{"text": "Kötü anket", "kind": "poll", "options": ["tek"]}]', false)$q$, :'gid'),
  'save_issue rejects a bad poll', '%check constraint%');
select public.save_issue(:'gid', null, 'Oylu sayı', now() + interval '3 days', 'classic',
  format('[{"text": "Elif''in sorusu: bu ay ne okudun?", "queue_id": "%s"},
           {"text": "Kahve mi çay mı?", "kind": "poll", "options": ["Kahve", "Çay", "İkisi de"]},
           {"text": "Kim en çok geç kalır?", "kind": "who"}]', :'qe')::jsonb, true) as vid \gset
select pg_temp.expect((select count(*) from public.question_queue where id = :'qe') = 0, 'queued question is consumed');
select pg_temp.expect((select count(*) from public.question_queue) = 1, 'other queued question stays');
select pg_temp.expect((select asked_by from public.issue_questions where issue_id = :'vid' and position = 0) = :'E', 'question credits the editor who asked it');
select pg_temp.expect((select kind from public.issue_questions where issue_id = :'vid' and position = 1) = 'poll', 'poll kind stored');
select pg_temp.expect((select jsonb_array_length(options) from public.issue_questions where issue_id = :'vid' and position = 1) = 3, 'poll options stored');
select pg_temp.expect((select options from public.issue_questions where issue_id = :'vid' and position = 2) is null, '"who" stores no options');
select id as vq_text from public.issue_questions where issue_id = :'vid' and position = 0 \gset
select id as vq_poll from public.issue_questions where issue_id = :'vid' and position = 1 \gset
select id as vq_who from public.issue_questions where issue_id = :'vid' and position = 2 \gset

-- ── Taslaklar: editörler görür, sadece yöneticiler değiştirir (20261113090000_editors_see_drafts.sql)
select pg_temp.login(:'D');
select public.save_issue(:'gid', null, 'Taslak sayı', now() + interval '5 days', 'classic', '[{"text": "Taslak sorusu"}]', false) as did \gset
select pg_temp.login(:'E');
select pg_temp.expect((select count(*) from public.issues where id = :'did') = 1, 'editor sees the draft');
select pg_temp.expect((select count(*) from public.issue_questions where issue_id = :'did') = 1, 'editor sees the draft questions');
update public.issues set title = 'Editör değiştirdi' where id = :'did';
delete from public.issues where id = :'did';
select pg_temp.expect_error(format($q$select public.start_issue(%L)$q$, :'did'), 'editor cannot start the draft', '%bulunamadı%');
select pg_temp.expect_error(
  format($q$insert into public.responses (issue_question_id, body) values ((select id from public.issue_questions where issue_id = %L), 'Erken yanıt')$q$, :'did'),
  'nobody answers a draft', '%');
select pg_temp.login(:'F');
select pg_temp.expect((select count(*) from public.issues where id = :'did') = 0, 'member still cannot see the draft');
select pg_temp.expect((select count(*) from public.issue_questions where issue_id = :'did') = 0, 'member still cannot see draft questions');
select pg_temp.login(:'D');
select pg_temp.expect((select title from public.issues where id = :'did') = 'Taslak sayı', 'editor cannot edit or delete the draft');
delete from public.issues where id = :'did';

-- ── Votes ────────────────────────────────────────────────────────────────────
select pg_temp.login(:'F');
insert into public.votes (issue_question_id, choice) values (:'vq_poll', 1);
insert into public.votes (issue_question_id, choice) values (:'vq_poll', 2)
  on conflict (issue_question_id, user_id) do update set choice = excluded.choice;
select pg_temp.expect((select choice from public.votes where issue_question_id = :'vq_poll') = 2, 'vote can be changed while open');
select pg_temp.expect((select issue_id from public.votes where issue_question_id = :'vq_poll') = :'vid', 'vote trigger fills issue_id');
select pg_temp.expect_error(
  format($q$insert into public.votes (issue_question_id, choice) values (%L, 5)$q$, :'vq_who'),
  'poll-style vote on a "who" question rejected', '%Geçersiz oy%');
select pg_temp.expect_error(
  format($q$update public.votes set choice = 3 where issue_question_id = %L$q$, :'vq_poll'),
  'choice past the last option rejected', '%Geçersiz oy%');
insert into public.votes (issue_question_id, voted_user_id) values (:'vq_who', :'E');
select pg_temp.expect_error(
  format($q$insert into public.votes (issue_question_id, voted_user_id) values (%L, %L) on conflict (issue_question_id, user_id) do update set voted_user_id = excluded.voted_user_id$q$, :'vq_who', :'G'),
  'cannot vote for an outsider', '%Geçersiz oy%');
select pg_temp.expect_error(
  format($q$insert into public.votes (issue_question_id, choice) values (%L, 0)$q$, :'vq_text'),
  'text question cannot be voted on', '%oylama sorusu değil%');
insert into public.responses (issue_question_id, body) values (:'vq_text', 'Bir roman okudum') returning id as fr \gset

select pg_temp.login(:'E');
insert into public.votes (issue_question_id, voted_user_id) values (:'vq_who', :'F');
select pg_temp.expect((select count(*) from public.votes) = 1, 'votes stay secret until publish');
select pg_temp.expect((select count(*) from public.issue_participants(:'vid')) = 2, 'voters count as participants');
select pg_temp.expect((select count(*) from public.who_vote_counts(:'vid')) = 0, 'no "who" results before publish');
select pg_temp.expect_error(
  format($q$insert into public.reactions (response_id, emoji) values (%L, 'heart')$q$, :'fr'),
  'no reactions before publish', '%row-level security%');
select pg_temp.expect_error(
  format($q$insert into public.comments (issue_question_id, body) values (%L, 'Erken yorum')$q$, :'vq_poll'),
  'no poll comments before publish', '%row-level security%');

select pg_temp.login(:'G');
select pg_temp.expect_error(
  format($q$insert into public.votes (issue_question_id, choice) values (%L, 0)$q$, :'vq_poll'),
  'outsider cannot vote', '%row-level security%');

-- ── Publish → results, reactions, comments ───────────────────────────────────
select pg_temp.login(:'D');
select public.publish_issue(:'vid');
select pg_temp.login(:'E');
select pg_temp.expect((select count(*) from public.votes) = 2, 'after publish: poll votes and your own vote are visible');
select pg_temp.expect((select count(*) from public.votes where voted_user_id is not null and user_id <> :'E') = 0, '"who" votes of others stay secret after publish');
select pg_temp.expect((select count(*) from public.votes where choice is not null and user_id = :'F') = 1, 'poll votes of others visible after publish');
select pg_temp.expect((select count(*) from public.who_vote_counts(:'vid')) = 2, 'who_vote_counts: one row per person voted for');
select pg_temp.expect((select vote_count from public.who_vote_counts(:'vid') where person_id = :'E' and question_id = :'vq_who') = 1, 'who_vote_counts counts votes');
select pg_temp.expect((select sum(vote_count) from public.who_vote_counts(:'vid')) = 2, 'who_vote_counts covers every "who" vote');
insert into public.reactions (response_id, emoji) values (:'fr', 'heart');
insert into public.reactions (response_id, emoji) values (:'fr', 'laugh');
select pg_temp.expect((select issue_id from public.reactions where emoji = 'heart') = :'vid', 'reaction trigger fills issue_id');
select pg_temp.expect_error(
  format($q$insert into public.reactions (response_id, emoji) values (%L, 'poop')$q$, :'fr'),
  'unknown reaction rejected', '%check constraint%');
insert into public.comments (response_id, body) values (:'fr', 'Hangi roman?') returning id as ce \gset
select pg_temp.expect_error(
  format($q$insert into public.comments (response_id, body) values (%L, '   ')$q$, :'fr'),
  'empty comment rejected', '%check constraint%');
delete from public.reactions where response_id = :'fr' and emoji = 'laugh';
select pg_temp.expect((select count(*) from public.reactions) = 1, 'reaction can be taken back');

select pg_temp.login(:'F');
select pg_temp.expect((select count(*) from public.comments) = 1, 'members see comments');
delete from public.comments where id = :'ce';
select pg_temp.expect((select count(*) from public.comments) = 1, 'member cannot delete someone else''s comment');
update public.votes set choice = 0 where issue_question_id = :'vq_poll';
select pg_temp.expect((select choice from public.votes where issue_question_id = :'vq_poll' and user_id = :'F') = 2, 'votes locked after publish');

select pg_temp.login(:'G');
select pg_temp.expect((select count(*) from public.comments) = 0, 'outsider sees no comments');
select pg_temp.expect((select count(*) from public.reactions) = 0, 'outsider sees no reactions');
select pg_temp.expect((select count(*) from public.votes) = 0, 'outsider sees no votes');
select pg_temp.expect((select count(*) from public.who_vote_counts(:'vid')) = 0, 'outsider gets no "who" results');

select pg_temp.login(:'D');
delete from public.comments where id = :'ce';
select pg_temp.expect((select count(*) from public.comments) = 0, 'admin can delete any comment');

-- Anket ve "kim daha çok?" sorularına yorum (20261112090000_question_comments.sql)
select pg_temp.login(:'F');
insert into public.comments (issue_question_id, body) values (:'vq_poll', 'Çay tabii ki') returning id as cq \gset
insert into public.comments (issue_question_id, body) values (:'vq_who', 'Bu sonuç beklenmedik');
insert into public.comments (response_id, body) values (:'fr', 'Yanıta yorum hâlâ çalışıyor');
select pg_temp.expect((select issue_id from public.comments where id = :'cq') = :'vid', 'question comment gets its issue');
select pg_temp.expect((select count(*) from public.comments where issue_question_id is not null) = 2, 'members comment on polls and "who" questions');
select pg_temp.expect_error(
  format($q$insert into public.comments (response_id, issue_question_id, body) values (%L, %L, 'İkisine birden')$q$, :'fr', :'vq_poll'),
  'a comment has exactly one target', '%comments_one_target%');
select pg_temp.expect_error(
  $q$insert into public.comments (body) values ('Hiçbir yere')$q$,
  'a comment needs a target', '%bulunamadı%');
select pg_temp.login(:'E');
select pg_temp.expect((select count(*) from public.comments) = 3, 'members see question comments');
delete from public.comments where id = :'cq';
select pg_temp.expect((select count(*) from public.comments) = 3, 'member cannot delete someone else''s question comment');
select pg_temp.login(:'G');
select pg_temp.expect((select count(*) from public.comments) = 0, 'outsider sees no question comments');

-- ── Audio notes ──────────────────────────────────────────────────────────────
reset role;
set role service_role;
insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes, duration_s) values (:'fr', :'vid', :'F', 'audio', 'aud-1', 900000, 42);
select pg_temp.expect((select kind::text from public.response_media where public_id = 'aud-1') = 'audio', 'audio note stored');
select pg_temp.expect_error(
  format($q$insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (%L, %L, %L, 'audio', 'aud-2', 1000)$q$, :'fr', :'vid', :'F'),
  'second audio note rejected', '%1 sesli not%');
insert into public.responses (issue_question_id, user_id, body) values (:'vq_poll', :'F', '') returning id as fr2 \gset
select pg_temp.expect_error(
  format($q$insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (%L, %L, %L, 'audio', 'aud-big', 11000000)$q$, :'fr2', :'vid', :'F'),
  'oversized audio rejected', '%10 MB%');
insert into public.response_media (response_id, issue_id, user_id, kind, public_id, bytes) values (:'fr', :'vid', :'F', 'video', 'vid-a', 1000);
select pg_temp.expect((select count(*) from public.response_media where response_id = :'fr') = 2, 'audio does not use up the video slot');
reset role;

-- ── Schedules and automatic issues ───────────────────────────────────────────
set role authenticated;
select pg_temp.login(:'F');
select pg_temp.expect_error(
  format($q$insert into public.issue_schedules (group_id, frequency, month_day, next_run_at) values (%L, 'monthly', 1, now())$q$, :'gid'),
  'member cannot create a schedule', '%row-level security%');
select pg_temp.login(:'D');
insert into public.issue_schedules (group_id, frequency, month_day, duration_days, question_count, next_run_at)
values (:'gid', 'monthly', 1, 7, 3, now() - interval '1 hour');
select pg_temp.expect_error(
  format($q$insert into public.issue_schedules (group_id, frequency, weekday, next_run_at) values (%L, 'weekly', 1, now())$q$, :'gid'),
  'only one schedule per group', '%duplicate key%');
select pg_temp.login(:'F');
select pg_temp.expect((select count(*) from public.issue_schedules) = 1, 'members can see the schedule');
update public.issue_schedules set enabled = false where group_id = :'gid';
select pg_temp.expect((select enabled from public.issue_schedules where group_id = :'gid'), 'member cannot pause the schedule');
select pg_temp.expect_error(
  format($q$select public.create_scheduled_issue(%L, now() + interval '7 days', '[{"text": "x"}]')$q$, :'gid'),
  'clients cannot create scheduled issues', '%permission denied%');
select pg_temp.expect_error(
  format($q$select public.insert_issue_questions(%L, %L, '[{"text": "x"}]')$q$, :'vid', :'gid'),
  'clients cannot call the internal question writer', '%permission denied%');

reset role;
set role service_role;
select id as qe_poll_id from public.question_queue where group_id = :'gid' \gset
select public.create_scheduled_issue(:'gid', now() + interval '7 days',
  format('[{"text": "Pizza mı döner mi?", "kind": "poll", "options": ["Pizza", "Döner"], "queue_id": "%s"},
           {"text": "Kim en iyi yemek yapar?", "kind": "who"}]', :'qe_poll_id')::jsonb) as sid \gset
select pg_temp.expect((select status from public.issues where id = :'sid') = 'open', 'scheduled issue opens immediately');
select pg_temp.expect((select number from public.issues where id = :'sid') = 2, 'scheduled issue gets the next number');
select pg_temp.expect((select count(*) from public.issue_questions where issue_id = :'sid') = 2, 'scheduled issue has its questions');
select pg_temp.expect((select asked_by from public.issue_questions where issue_id = :'sid' and position = 0) = :'E', 'scheduled issue credits the editor');
select pg_temp.expect((select count(*) from public.question_queue where group_id = :'gid') = 0, 'scheduled issue empties the queue');
select pg_temp.expect(
  public.create_scheduled_issue(:'gid', now() + interval '7 days', '[{"text": "Bir soru daha"}]') is null,
  'no second issue while one is running');
reset role;

\echo ALL V2 SQL TESTS PASSED
