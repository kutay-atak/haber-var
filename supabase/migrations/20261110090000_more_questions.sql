-- Haber Var · soru havuzuna 46 yeni soru (39 yazılı, 7 "Kim daha çok?")
-- Tekrar çalıştırmak sorun olmaz: havuzda zaten olan bir soru ikinci kez eklenmez.

insert into public.question_bank (category, text, kind)
select v.category, v.text, v.kind
from (values
  ('Isınma', 'Bu ay kimseye anlatmadığın küçük bir başarın var mı? Şimdi anlat.', 'text'),
  ('Isınma', 'Bu ay başına gelen en saçma şey neydi?', 'text'),
  ('Isınma', 'Bu ay hangi lafı dilinden düşürmedin?', 'text'),
  ('Isınma', 'Yediğin en tuhaf şey neydi? Bir daha yer miydin?', 'text'),

  ('Fotoğraf & Video', 'Buzdolabının içini göster. Açıklama yapmak serbest.', 'text'),
  ('Fotoğraf & Video', 'Her gün geçtiğin bir yolu 10 saniyelik bir videoyla göster.', 'text'),

  ('Hayat', 'Bu ay neye para verdin ve hiç pişman değilsin?', 'text'),
  ('Hayat', 'Son zamanlarda kendinde fark ettiğin yeni bir huy var mı?', 'text'),
  ('Hayat', 'Bu yıl "iyi ki" dediğin bir karar hangisi?', 'text'),
  ('Hayat', 'Bir süredir ertelediğin bir şey var mı? Neden hâlâ yapmadın?', 'text'),
  ('Hayat', 'Son zamanlarda "hayır" demeyi öğrendiğin bir şey var mı?', 'text'),
  ('Hayat', 'Bu aralar seni geceleri ne uyutmuyor?', 'text'),

  ('Derin', 'Senin için mükemmel ama sıradan bir gün nasıl geçer?', 'text'),
  ('Derin', 'Kimsenin katılmadığı ama hâlâ savunduğun bir fikrin ne?', 'text'),
  ('Derin', 'Defalarca öğrenip yine unuttuğun bir ders var mı?', 'text'),
  ('Derin', 'Eskiden utandığın ama artık sahiplendiğin bir şey ne?', 'text'),
  ('Derin', 'İnsanlar senin hakkında genelde neyi yanlış tahmin ediyor?', 'text'),
  ('Derin', 'Başta felaket gibi görünen ama sonunda işine yarayan bir şey oldu mu?', 'text'),

  ('Nostalji', 'Çocukken her evde böyle sandığın, sonra sadece sizin evde olduğunu öğrendiğin bir şey ne?', 'text'),
  ('Nostalji', 'Çocukken gerçekten inandığın bir saçmalık var mı?', 'text'),
  ('Nostalji', 'Hâlâ ezbere bildiğin bir reklam müziği ya da dizi jeneriği var mı? Sesli not olarak söylersen daha iyi.', 'text'),
  ('Nostalji', 'Başından geçen en kötü buluşma hangisiydi?', 'text'),

  ('Eğlenceli', 'Bu ay kendine uydurduğun en iyi bahane neydi?', 'text'),
  ('Eğlenceli', 'İşe yaramaz ama gurur duyduğun bir becerin var mı?', 'text'),
  ('Eğlenceli', 'Bu ayın manşetini sen atsan başlık ne olurdu?', 'text'),
  ('Eğlenceli', 'Bir günlüğüne bir şeyi yasaklama yetkin olsa neyi yasaklardın?', 'text'),
  ('Eğlenceli', 'Son zamanlarda gördüğün en tuhaf rüya ne?', 'text'),
  ('Eğlenceli', 'Hangi klişeye tıpatıp uyduğunu artık kabul ediyorsun?', 'text'),
  ('Eğlenceli', 'En son ne hakkında yalan söyledin?', 'text'),
  ('Eğlenceli', 'Gizlice çiğnemeyi sevdiğin bir kural var mı?', 'text'),
  ('Eğlenceli', 'Annene asla anlatmayacağın ama bize anlatabileceğin bir şey ne?', 'text'),
  ('Eğlenceli', 'Gerçek olmadığını bildiğin ama keşke olsa dediğin bir şey ne?', 'text'),
  ('Eğlenceli', 'Kedi gibi dokuz canın olsa birini neyi denemeye harcardın?', 'text'),
  ('Eğlenceli', 'Şehrin en büyük reklam panosu bir günlüğüne senin olsa üzerine ne yazardın?', 'text'),

  ('Birlikte', 'Gruptan birinden kaptığın bir laf ya da huy var mı?', 'text'),
  ('Birlikte', 'Uzakta olmasaydık bu ay birlikte ne yapardık?', 'text'),
  ('Birlikte', 'Grupta hâlâ kapanmamış bir hesap var mı? Borç, iddia, yarım kalmış bir plan…', 'text'),
  ('Birlikte', 'Kafanı dinlemek için yaptığın ve birimizin de katılabileceği bir şey ne?', 'text'),
  ('Birlikte', 'Gruptan biriyle ilk kez yapmak istediğin bir şey ne?', 'text'),

  ('Kim daha çok?', 'Kim "yoldayım" der ama daha evden çıkmamıştır?', 'who'),
  ('Kim daha çok?', 'Kim bir gün her şeyi bırakıp köye yerleşir?', 'who'),
  ('Kim daha çok?', 'Kim bir tartışmayı asla kaybetmez?', 'who'),
  ('Kim daha çok?', 'Kim okul kütüphanesindeki bütün kitapları bitirir?', 'who'),
  ('Kim daha çok?', 'Kim başka bir gezegene gitmek için hayatını adar?', 'who'),
  ('Kim daha çok?', 'Kim bir gün kendi adıyla anılan bir bilim kanunu bulur?', 'who'),
  ('Kim daha çok?', 'Kim merak edip kedi mamasının tadına bakar?', 'who')
) as v (category, text, kind)
where not exists (
  select 1 from public.question_bank q where q.group_id is null and q.text = v.text
);
