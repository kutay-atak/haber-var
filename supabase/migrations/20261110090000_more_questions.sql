-- Haber Var · soru havuzuna 24 yeni soru (21 yazılı, 3 "Kim daha çok?")
-- Tekrar çalıştırmak sorun olmaz: havuzda zaten olan bir soru ikinci kez eklenmez.

insert into public.question_bank (category, text, kind)
select v.category, v.text, v.kind
from (values
  ('Isınma', 'Bu ay kimseye anlatmadığın küçük bir başarın var mı? Şimdi anlat.', 'text'),
  ('Isınma', 'Bu ay başına gelen en saçma şey neydi?', 'text'),
  ('Isınma', 'Bu ay hangi lafı dilinden düşürmedin?', 'text'),

  ('Fotoğraf & Video', 'Buzdolabının içini göster. Açıklama yapmak serbest.', 'text'),
  ('Fotoğraf & Video', 'Her gün geçtiğin bir yolu 10 saniyelik bir videoyla göster.', 'text'),

  ('Hayat', 'Bu ay neye para verdin ve hiç pişman değilsin?', 'text'),
  ('Hayat', 'Son zamanlarda kendinde fark ettiğin yeni bir huy var mı?', 'text'),
  ('Hayat', 'Bu yıl "iyi ki" dediğin bir karar hangisi?', 'text'),

  ('Derin', 'Senin için mükemmel ama sıradan bir gün nasıl geçer?', 'text'),
  ('Derin', 'Kimsenin katılmadığı ama hâlâ savunduğun bir fikrin ne?', 'text'),

  ('Nostalji', 'Çocukken her evde böyle sandığın, sonra sadece sizin evde olduğunu öğrendiğin bir şey ne?', 'text'),
  ('Nostalji', 'Çocukken gerçekten inandığın bir saçmalık var mı?', 'text'),
  ('Nostalji', 'Hâlâ ezbere bildiğin bir reklam müziği ya da dizi jeneriği var mı? Sesli not olarak söylersen daha iyi.', 'text'),

  ('Eğlenceli', 'Bu ay kendine uydurduğun en iyi bahane neydi?', 'text'),
  ('Eğlenceli', 'İşe yaramaz ama gurur duyduğun bir becerin var mı?', 'text'),
  ('Eğlenceli', 'Bu ayın manşetini sen atsan başlık ne olurdu?', 'text'),
  ('Eğlenceli', 'Bir günlüğüne bir şeyi yasaklama yetkin olsa neyi yasaklardın?', 'text'),
  ('Eğlenceli', 'Son zamanlarda gördüğün en tuhaf rüya ne?', 'text'),

  ('Birlikte', 'Gruptan birinden kaptığın bir laf ya da huy var mı?', 'text'),
  ('Birlikte', 'Uzakta olmasaydık bu ay birlikte ne yapardık?', 'text'),
  ('Birlikte', 'Grupta hâlâ kapanmamış bir hesap var mı? Borç, iddia, yarım kalmış bir plan…', 'text'),

  ('Kim daha çok?', 'Kim "yoldayım" der ama daha evden çıkmamıştır?', 'who'),
  ('Kim daha çok?', 'Kim bir gün her şeyi bırakıp köye yerleşir?', 'who'),
  ('Kim daha çok?', 'Kim bir tartışmayı asla kaybetmez?', 'who')
) as v (category, text, kind)
where not exists (
  select 1 from public.question_bank q where q.group_id is null and q.text = v.text
);
