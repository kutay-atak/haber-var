-- Haber Var · hazır soru havuzu
-- Yöneticiler yeni sayı hazırlarken bu sorulardan seçebilir.
-- Kendi sorularını eklemek istersen aynı formatta yeni satırlar ekleyebilirsin.

insert into public.question_bank (category, text) values
  ('Isınma', 'Bu ay seni en çok ne güldürdü?'),
  ('Isınma', 'Bu ay hangi küçük şey gününü güzelleştirdi?'),
  ('Isınma', 'Şu sıralar en çok ne dinliyorsun? Bir şarkı, albüm ya da podcast öner.'),
  ('Isınma', 'Son zamanlarda yediğin en lezzetli şey neydi?'),
  ('Isınma', 'Bu aralar haftanın en sevdiğin anı hangisi?'),
  ('Isınma', 'Bu ay kendine yaptığın bir iyilik neydi?'),

  ('Fotoğraf & Video', 'Telefonundaki son fotoğrafı paylaş ve hikâyesini anlat.'),
  ('Fotoğraf & Video', 'Şu an pencerenden ne görüyorsun? Bir fotoğrafını çek.'),
  ('Fotoğraf & Video', 'Bu ayın en güzel manzarası hangisiydi? Fotoğrafını paylaş.'),
  ('Fotoğraf & Video', 'Bize kısa bir video gönder: Bugün neler yapıyorsun?'),
  ('Fotoğraf & Video', 'Masanın ya da çalışma köşenin şu anki hâlini göster.'),
  ('Fotoğraf & Video', 'Bu ay yediğin en güzel tabağın fotoğrafını paylaş.'),
  ('Fotoğraf & Video', 'Yakınlarda keşfettiğin güzel bir köşenin fotoğrafını paylaş.'),

  ('Hayat', 'Bu ay hayatında neler değişti? Büyük küçük fark etmez.'),
  ('Hayat', 'Şu an üzerinde çalıştığın bir proje ya da hedef var mı?'),
  ('Hayat', 'Bu ay seni zorlayan bir şey oldu mu? Nasıl başa çıktın?'),
  ('Hayat', 'Önümüzdeki ay neyi dört gözle bekliyorsun?'),
  ('Hayat', 'Bu ay öğrendiğin en ilginç şey neydi?'),
  ('Hayat', 'Son zamanlarda okuduğun ya da izlediğin, aklından çıkmayan bir şey var mı?'),

  ('Derin', 'Şu an hayatında en çok neye minnettarsın?'),
  ('Derin', 'Beş yıl önceki sana bir tavsiye verebilseydin ne derdin?'),
  ('Derin', 'Seni sen yapan küçük bir alışkanlığın ne?'),
  ('Derin', 'Son zamanlarda fikrini değiştirdiğin bir konu oldu mu?'),
  ('Derin', 'Mutlu hissettiğin anlarda genellikle ne yapıyor oluyorsun?'),
  ('Derin', 'Hayatında iz bırakan biri ve ondan öğrendiğin şey ne?'),
  ('Derin', 'Daha fazla vaktin olsaydı onu neye ayırırdın?'),

  ('Nostalji', 'Çocukken en sevdiğin yemek neydi? Hâlâ seviyor musun?'),
  ('Nostalji', 'Birlikte yaşadığımız en komik anı hangisi?'),
  ('Nostalji', 'Okul yıllarından aklında kalan bir anıyı paylaş.'),
  ('Nostalji', 'Çocukluğunda en çok hangi oyunu oynardın?'),
  ('Nostalji', 'Eski bir fotoğrafını paylaş ve o günü anlat.'),
  ('Nostalji', 'İlk kez gittiğin konser, maç ya da festival hangisiydi?'),

  ('Eğlenceli', 'Bir gün boyunca istediğin meslekte çalışabilseydin hangisini seçerdin?'),
  ('Eğlenceli', 'Bir süper gücün olsaydı ne olurdu ve onu en çok ne için kullanırdın?'),
  ('Eğlenceli', 'Hayatın film olsaydı başrolde kim oynamalıydı?'),
  ('Eğlenceli', 'Issız bir adaya sadece üç şey götürebilseydin neleri alırdın?'),
  ('Eğlenceli', 'Asla vazgeçemeyeceğin suçlu zevkin ne?'),
  ('Eğlenceli', 'Son zamanlarda kendini en çok "yaşlandım" diye hissettiğin an hangisiydi?'),
  ('Eğlenceli', 'Bir hayvan olsaydın hangisi olurdun, neden?'),

  ('Birlikte', 'Bir sonraki buluşmamızda ne yapmak isterdin?'),
  ('Birlikte', 'Gruptan birine bu ay teşekkür etmek istediğin bir şey var mı?'),
  ('Birlikte', 'Hep birlikte tatile çıksak nereye gitmeliyiz?'),
  ('Birlikte', 'Gruba bu ay önermek istediğin bir film, dizi ya da kitap var mı?'),
  ('Birlikte', 'Birbirimize bir meydan okuma öner: Gelecek ay ne deneyelim?'),
  ('Birlikte', 'Gruptakilere bu ay sormak istediğin bir soru ne?'),

  ('Tavsiye', 'Son zamanlarda aldığın en iyi tavsiye neydi?'),
  ('Tavsiye', 'Hayatını kolaylaştıran bir uygulama, alet ya da püf noktası öner.'),
  ('Tavsiye', 'Yaşadığın şehirde mutlaka gidilmesi gereken bir yer söyle.'),
  ('Tavsiye', 'Herkesin bir kez denemesi gereken bir tarif paylaş.'),
  ('Tavsiye', 'Bu ay sana iyi gelen bir şeyi bize de öner.');
