-- Haber Var · anketlere ve "Kim daha çok?" sorularına yorum + 35 yeni soru
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

-- ─── Soru havuzu: 35 yeni soru ───────────────────────────────────────────────

insert into public.question_bank (category, text, kind, options)
select v.category, v.text, v.kind, v.options::jsonb
from (values
  ('Yaşadığın yer', 'Yaşadığın yerde herkesin normal bulduğu ama sana hâlâ tuhaf gelen bir şey ne?', 'text', null),
  ('Yaşadığın yer', 'Yaşadığın yer yüzünden edindiğin bir alışkanlık var mı?', 'text', null),
  ('Yaşadığın yer', 'Yaşadığın yerde bulamadığın, özlediğin bir şey ne? Yerine ne kullanıyorsun?', 'text', null),
  ('Yaşadığın yer', 'Bu ay yaşadığın yerde herkes ne konuşuyordu? Bizim haberimiz olmayan bir şey anlat.', 'text', null),
  ('Yaşadığın yer', 'Bu ay kendini en çok yabancı hissettiğin an hangisiydi?', 'text', null),
  ('Yaşadığın yer', 'Yeni tanıştığın insanlara bizi nasıl anlatıyorsun?', 'text', null),
  ('Yaşadığın yer', 'Yaşadığın şehir hakkında dışarıdakilerin en çok yanlış bildiği şey ne?', 'text', null),
  ('Yaşadığın yer', 'Yaşadığın yerde herkesin kullandığı ama bizim bilmediğimiz bir laf var mı?', 'text', null),
  ('Yaşadığın yer', 'Yaşadığın yerde bir kahve, bir aylık kira ve bir toplu taşıma bileti ne kadar? Bizi şaşırt.', 'text', null),
  ('Yaşadığın yer', 'Bu ay mesafe yüzünden kaçırdığın bir şey oldu mu?', 'text', null),
  ('Yaşadığın yer', 'Yaşadığın şehirde turistlerin bilmediği bir yerin fotoğrafını paylaş.', 'text', null),
  ('Yaşadığın yer', 'Bizden biri seni bir günlüğüne ziyarete gelse o günün planı ne olurdu?', 'text', null),
  ('Yaşadığın yer', 'Yaşadığın şehirden ayrılsan en çok neyi özlerdin?', 'text', null),
  ('Yaşadığın yer', 'Gruptan birini yaşadığın yere taşınmaya ikna etmen gerekse en güçlü argümanın ne olurdu?', 'text', null),
  ('Yaşadığın yer', 'Gruptan birinin şehrinde bir gün geçirebilsen kimin şehrini seçerdin, ne yapardın?', 'text', null),
  ('Yaşadığın yer', 'Bu ay yaşadığın şehirde ilk kez yaptığın bir şey var mı?', 'text', null),
  ('Yaşadığın yer', 'Yaşadığın şehirde sana "burası artık benim" dedirten yer hangisi?', 'text', null),
  ('Yaşadığın yer', 'Mahallende bu ay ne değişti?', 'text', null),
  ('Yaşadığın yer', 'Yaşadığın yerde en sevdiğin esnaf ya da dükkân hangisi, neden?', 'text', null),
  ('Yaşadığın yer', 'Uzun süredir aynı şehirde yaşıyorsan, bu ay şehrinde seni hâlâ şaşırtan ne oldu?', 'text', null),

  ('Birlikte', 'Birbirimizi tanıdığımızdan beri gruptan en çok kim değişti, nasıl?', 'text', null),
  ('Birlikte', 'Bu grupla ilgili kimseye anlatmadığın bir anı var mı?', 'text', null),
  ('Birlikte', '10 yıl sonra bu gruptan kim nerede olur? Herkes için bir tahmin yaz.', 'text', null),
  ('Birlikte', 'Sadece bizim anladığımız bir laf ya da şaka hangisi? Nereden çıktığını hatırlıyor musun?', 'text', null),
  ('Birlikte', 'Gruptan biri hakkında yıllarca yanlış bildiğin bir şey çıktı mı?', 'text', null),

  ('Anket', 'Bu ay kaç farklı şehirde bulundun?', 'poll', '["1", "2", "3", "4 ve üstü"]'),
  ('Anket', 'Gruptan biriyle en son ne zaman yüz yüze görüştün?', 'poll', '["Bu ay", "Bu yıl", "Geçen yıl", "Daha önce"]'),
  ('Anket', 'Yaşadığın yerde seni en çok ne zorluyor?', 'poll', '["Trafik", "Hayat pahalılığı", "Hava", "Yalnızlık", "Bürokrasi"]'),
  ('Anket', 'Bir sonraki tatilin nerede?', 'poll', '["Yaşadığım şehirde", "Türkiye''de başka bir yerde", "Yurtdışında", "Tatil yok"]'),
  ('Anket', 'Grup sohbetini ne sıklıkla sessize alıyorsun?', 'poll', '["Hiç", "Bazen", "Hep sessizde", "Söylemeyeceğim"]'),

  ('Kim daha çok?', 'Kim bir gün hiç beklenmedik bir şehre taşınır?', 'who', null),
  ('Kim daha çok?', 'Kim yaşadığı şehri en iyi bilir?', 'who', null),
  ('Kim daha çok?', 'Kim bir sonraki taşınmayı yapar?', 'who', null),
  ('Kim daha çok?', 'Kim gittiği her yerde hemen bir tanıdık bulur?', 'who', null),
  ('Kim daha çok?', 'Kim bavulunda en çok yiyecek taşır?', 'who', null)
) as v (category, text, kind, options)
where not exists (
  select 1 from public.question_bank q where q.group_id is null and q.text = v.text
);
