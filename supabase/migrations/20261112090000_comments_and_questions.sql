-- Haber Var · anketlere ve "Kim daha çok?" sorularına yorum + 30 yeni soru
-- Var olan yorumlar, yanıtlar, sayılar ve havuzdaki sorular değişmez.
-- Tekrar çalıştırmak sorun olmaz: aynı soru iki kez eklenmez.

-- ─── Yorumlar: bir yanıta ya da (oylamalı) bir soruya ────────────────────────

alter table public.comments
  add column if not exists issue_question_id uuid references public.issue_questions (id) on delete cascade;
alter table public.comments alter column response_id drop not null;
alter table public.comments drop constraint if exists comments_one_target;
alter table public.comments
  add constraint comments_one_target check ((response_id is null) <> (issue_question_id is null));

-- Yorumun sayısını yanıttan ya da sorudan bulur (güvenlik kuralları sayıya bakar).
create or replace function public.set_comment_defaults()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.response_id is not null then
    select r.issue_id into new.issue_id from public.responses r where r.id = new.response_id;
  else
    select q.issue_id into new.issue_id from public.issue_questions q where q.id = new.issue_question_id;
  end if;
  if new.issue_id is null then
    raise exception 'Yorum yazılacak yanıt ya da soru bulunamadı.';
  end if;
  return new;
end;
$$;

drop trigger if exists comments_set_defaults on public.comments;
create trigger comments_set_defaults
  before insert on public.comments
  for each row execute function public.set_comment_defaults();

-- ─── Soru havuzu: 30 yeni soru ───────────────────────────────────────────────

insert into public.question_bank (category, text, kind, options)
select v.category, v.text, v.kind, v.options::jsonb
from (values
  ('Yurtdışı', 'Yaşadığın yerde herkesin normal bulduğu ama sana hâlâ tuhaf gelen bir şey ne?', 'text', null),
  ('Yurtdışı', 'Taşındığından beri edindiğin, Türkiye''de olsan asla yapmayacağın bir alışkanlık var mı?', 'text', null),
  ('Yurtdışı', 'Orada bulamadığın bir Türk ürünü ne? Yerine ne kullanıyorsun?', 'text', null),
  ('Yurtdışı', 'Bu ay yaşadığın yerde herkes ne konuşuyordu? Bizim haberimiz olmayan bir şey anlat.', 'text', null),
  ('Yurtdışı', 'Bu ay kendini en çok yabancı hissettiğin an hangisiydi?', 'text', null),
  ('Yurtdışı', 'Oradaki arkadaşlarına bizi nasıl anlatıyorsun?', 'text', null),
  ('Yurtdışı', 'Oradakilere Türkiye''yi anlatırken en çok neyi yanlış anlıyorlar?', 'text', null),
  ('Yurtdışı', 'Başka bir dilde karşılığını bulamadığın, özlediğin bir Türkçe laf ne?', 'text', null),
  ('Yurtdışı', 'Yaşadığın yerde bir kahve, bir aylık kira ve bir toplu taşıma bileti ne kadar? Bizi şaşırt.', 'text', null),
  ('Yurtdışı', 'Bu ay saat farkı yüzünden kaçırdığın bir şey oldu mu?', 'text', null),
  ('Yurtdışı', 'Yaşadığın şehirde turistlerin bilmediği bir yerin fotoğrafını paylaş.', 'text', null),
  ('Yurtdışı', 'Bizden biri seni bir günlüğüne ziyarete gelse o günün planı ne olurdu?', 'text', null),
  ('Yurtdışı', 'Türkiye''de olsaydın bu ay neyi farklı yapardın?', 'text', null),
  ('Yurtdışı', 'Gruptan birini yaşadığın yere taşınmaya ikna etmen gerekse en güçlü argümanın ne olurdu?', 'text', null),
  ('Yurtdışı', 'Gruptan birinin şehrinde bir gün geçirebilsen kimin şehrini seçerdin, ne yapardın?', 'text', null),

  ('Birlikte', 'Birbirimizi tanıdığımızdan beri gruptan en çok kim değişti, nasıl?', 'text', null),
  ('Birlikte', 'Bu grupla ilgili kimseye anlatmadığın bir anı var mı?', 'text', null),
  ('Birlikte', '10 yıl sonra bu gruptan kim nerede olur? Herkes için bir tahmin yaz.', 'text', null),
  ('Birlikte', 'Sadece bizim anladığımız bir laf ya da şaka hangisi? Nereden çıktığını hatırlıyor musun?', 'text', null),
  ('Birlikte', 'Gruptan biri hakkında yıllarca yanlış bildiğin bir şey çıktı mı?', 'text', null),

  ('Anket', 'Bu ay kaç dil konuştun?', 'poll', '["1", "2", "3", "4 ve üstü"]'),
  ('Anket', 'Türkiye''ye en son ne zaman gittin?', 'poll', '["Bu yıl", "Geçen yıl", "Daha önce", "Zaten buradayım"]'),
  ('Anket', 'Yaşadığın ülkede seni en çok ne zorluyor?', 'poll', '["Dil", "Bürokrasi", "Hava", "Yalnızlık"]'),
  ('Anket', 'Bir sonraki tatilin nerede?', 'poll', '["Türkiye", "Yaşadığım ülke", "Başka bir ülke", "Tatil yok"]'),
  ('Anket', 'Grup sohbetini ne sıklıkla sessize alıyorsun?', 'poll', '["Hiç", "Bazen", "Hep sessizde", "Söylemeyeceğim"]'),

  ('Kim daha çok?', 'Kim bir gün Türkiye''ye kesin dönüş yapar?', 'who', null),
  ('Kim daha çok?', 'Kim yaşadığı ülkenin dilini en iyi konuşur?', 'who', null),
  ('Kim daha çok?', 'Kim bir sonraki taşınmayı yapar?', 'who', null),
  ('Kim daha çok?', 'Kim gittiği her şehirde hemen bir Türk marketi bulur?', 'who', null),
  ('Kim daha çok?', 'Kim bavulunda en çok Türk yiyeceği taşır?', 'who', null)
) as v (category, text, kind, options)
where not exists (
  select 1 from public.question_bank q where q.group_id is null and q.text = v.text
);
