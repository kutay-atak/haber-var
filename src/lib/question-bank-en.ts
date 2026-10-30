// Hazır soru havuzunun (supabase/migrations/..._question_bank.sql) İngilizceleri.
// Anahtar Türkçe metin; İngilizce arayüzde havuz bu metinlerle gösterilir ve sayıya öyle kopyalanır.

export const CATEGORY_EN: Record<string, string> = {
  Isınma: "Warm-up",
  "Fotoğraf & Video": "Photo & Video",
  Hayat: "Life",
  Derin: "Deep",
  Nostalji: "Nostalgia",
  Eğlenceli: "Fun",
  Birlikte: "Together",
  Tavsiye: "Recommendations",
  "Kim daha çok?": "Most likely to…",
  Anket: "Polls",
};

export const QUESTION_EN: Record<string, string> = {
  "Bu ay seni en çok ne güldürdü?": "What made you laugh the most this month?",
  "Bu ay hangi küçük şey gününü güzelleştirdi?": "What little thing made your day this month?",
  "Şu sıralar en çok ne dinliyorsun? Bir şarkı, albüm ya da podcast öner.":
    "What are you listening to most these days? Recommend a song, album or podcast.",
  "Son zamanlarda yediğin en lezzetli şey neydi?": "What's the most delicious thing you've eaten lately?",
  "Bu aralar haftanın en sevdiğin anı hangisi?": "What's your favourite moment of the week these days?",
  "Bu ay kendine yaptığın bir iyilik neydi?": "What's something kind you did for yourself this month?",
  "Telefonundaki son fotoğrafı paylaş ve hikâyesini anlat.": "Share the last photo on your phone and tell us its story.",
  "Şu an pencerenden ne görüyorsun? Bir fotoğrafını çek.": "What can you see from your window right now? Take a photo.",
  "Bu ayın en güzel manzarası hangisiydi? Fotoğrafını paylaş.": "What was the most beautiful view of the month? Share a photo.",
  "Bize kısa bir video gönder: Bugün neler yapıyorsun?": "Send us a short video: what are you up to today?",
  "Masanın ya da çalışma köşenin şu anki hâlini göster.": "Show us what your desk or workspace looks like right now.",
  "Bu ay yediğin en güzel tabağın fotoğrafını paylaş.": "Share a photo of the best dish you had this month.",
  "Yakınlarda keşfettiğin güzel bir köşenin fotoğrafını paylaş.": "Share a photo of a lovely spot you discovered nearby.",
  "Bu ay hayatında neler değişti? Büyük küçük fark etmez.": "What changed in your life this month? Big or small.",
  "Şu an üzerinde çalıştığın bir proje ya da hedef var mı?": "Is there a project or goal you're working on right now?",
  "Bu ay seni zorlayan bir şey oldu mu? Nasıl başa çıktın?": "Did anything challenge you this month? How did you cope?",
  "Önümüzdeki ay neyi dört gözle bekliyorsun?": "What are you looking forward to next month?",
  "Bu ay öğrendiğin en ilginç şey neydi?": "What's the most interesting thing you learned this month?",
  "Son zamanlarda okuduğun ya da izlediğin, aklından çıkmayan bir şey var mı?":
    "Is there something you read or watched recently that you can't stop thinking about?",
  "Şu an hayatında en çok neye minnettarsın?": "What are you most grateful for in your life right now?",
  "Beş yıl önceki sana bir tavsiye verebilseydin ne derdin?": "If you could give advice to yourself five years ago, what would you say?",
  "Seni sen yapan küçük bir alışkanlığın ne?": "What's a small habit that makes you, you?",
  "Son zamanlarda fikrini değiştirdiğin bir konu oldu mu?": "Have you changed your mind about something recently?",
  "Mutlu hissettiğin anlarda genellikle ne yapıyor oluyorsun?": "When you feel happy, what are you usually doing?",
  "Hayatında iz bırakan biri ve ondan öğrendiğin şey ne?": "Who has left a mark on your life, and what did you learn from them?",
  "Daha fazla vaktin olsaydı onu neye ayırırdın?": "If you had more time, what would you spend it on?",
  "Çocukken en sevdiğin yemek neydi? Hâlâ seviyor musun?": "What was your favourite food as a child? Do you still love it?",
  "Birlikte yaşadığımız en komik anı hangisi?": "What's the funniest memory we share?",
  "Okul yıllarından aklında kalan bir anıyı paylaş.": "Share a memory from your school days.",
  "Çocukluğunda en çok hangi oyunu oynardın?": "What game did you play the most as a child?",
  "Eski bir fotoğrafını paylaş ve o günü anlat.": "Share an old photo of yourself and tell us about that day.",
  "İlk kez gittiğin konser, maç ya da festival hangisiydi?": "What was the first concert, match or festival you went to?",
  "Bir gün boyunca istediğin meslekte çalışabilseydin hangisini seçerdin?":
    "If you could do any job for a day, which would you choose?",
  "Bir süper gücün olsaydı ne olurdu ve onu en çok ne için kullanırdın?":
    "If you had a superpower, what would it be and what would you use it for most?",
  "Hayatın film olsaydı başrolde kim oynamalıydı?": "If your life were a film, who should play you?",
  "Issız bir adaya sadece üç şey götürebilseydin neleri alırdın?": "If you could take only three things to a desert island, what would they be?",
  "Asla vazgeçemeyeceğin suçlu zevkin ne?": "What's the guilty pleasure you could never give up?",
  'Son zamanlarda kendini en çok "yaşlandım" diye hissettiğin an hangisiydi?':
    'When did you last really feel "I\'m getting old"?',
  "Bir hayvan olsaydın hangisi olurdun, neden?": "If you were an animal, which one would you be, and why?",
  "Bir sonraki buluşmamızda ne yapmak isterdin?": "What would you like to do the next time we meet?",
  "Gruptan birine bu ay teşekkür etmek istediğin bir şey var mı?": "Is there something you'd like to thank someone in the group for this month?",
  "Hep birlikte tatile çıksak nereye gitmeliyiz?": "If we all went on holiday together, where should we go?",
  "Gruba bu ay önermek istediğin bir film, dizi ya da kitap var mı?":
    "Is there a film, series or book you'd recommend to the group this month?",
  "Birbirimize bir meydan okuma öner: Gelecek ay ne deneyelim?": "Suggest a challenge for all of us: what should we try next month?",
  "Gruptakilere bu ay sormak istediğin bir soru ne?": "What's a question you'd like to ask everyone in the group this month?",
  "Son zamanlarda aldığın en iyi tavsiye neydi?": "What's the best advice you've received lately?",
  "Hayatını kolaylaştıran bir uygulama, alet ya da püf noktası öner.": "Recommend an app, gadget or trick that makes your life easier.",
  "Yaşadığın şehirde mutlaka gidilmesi gereken bir yer söyle.": "Name a must-visit place in the city where you live.",
  "Herkesin bir kez denemesi gereken bir tarif paylaş.": "Share a recipe everyone should try at least once.",
  "Bu ay sana iyi gelen bir şeyi bize de öner.": "Recommend something that did you good this month.",

  // Anketler ve "kim daha çok?" soruları
  "Kim en çok geç kalır?": "Who is always running late?",
  "Kim en iyi yemek yapar?": "Who's the best cook?",
  "Kim bir gün ünlü olur?": "Who's most likely to become famous?",
  "Kim en çok sesli mesaj atar?": "Who sends the most voice messages?",
  "Kim ıssız bir adada en uzun hayatta kalır?": "Who would survive longest on a desert island?",
  "Kim en kötü şakaları yapar?": "Who tells the worst jokes?",
  "Kim telefonunu en sık kaybeder?": "Who loses their phone most often?",
  "Kim bir gün dünya turuna çıkar?": "Who's most likely to travel the world?",
  "Tatil: deniz mi, dağ mı?": "Holiday: beach or mountains?",
  "Sabah insanı mısın, gece kuşu mu?": "Morning person or night owl?",
  "Bir sonraki buluşmamız nerede olsun?": "Where should we meet next time?",
  "Kahve mi, çay mı?": "Coffee or tea?",
  "Bu ay modun nasıldı?": "What was your mood like this month?",
  "Hafta sonu planın ne?": "What are your weekend plans?",
};


/** Hazır anket seçeneklerinin İngilizceleri. */
export const OPTION_EN: Record<string, string> = {
  Deniz: "The beach",
  Dağ: "The mountains",
  "İkisi de": "Both",
  "Evde kalırım": "I'd stay home",
  "Sabah insanı": "Morning person",
  "Gece kuşu": "Night owl",
  "Duruma göre": "Depends",
  "Birinin evinde": "At someone's place",
  "Bir restoranda": "At a restaurant",
  Doğada: "Outdoors",
  "Başka bir şehirde": "In another city",
  Kahve: "Coffee",
  Çay: "Tea",
  Hiçbiri: "Neither",
  "Harika 😄": "Great 😄",
  "İdare eder 🙂": "Okay 🙂",
  "Yorgun 😴": "Tired 😴",
  "Karışık 🌀": "Mixed 🌀",
  "Dışarıda gezmek": "Going out",
  "Evde dinlenmek": "Resting at home",
  "Arkadaşlarla buluşmak": "Seeing friends",
  "Bir şeyler üretmek": "Making something",
};

/** Hazır bir soruyu (metin, kategori, seçenekler) İngilizceye çevirir; grubun kendi soruları olduğu gibi kalır. */
export function translateBankQuestion<Q extends { text: string; category?: string; options: string[] | null }>(q: Q): Q {
  return {
    ...q,
    text: QUESTION_EN[q.text] ?? q.text,
    ...(q.category !== undefined ? { category: CATEGORY_EN[q.category] ?? q.category } : {}),
    options: q.options ? q.options.map((o) => OPTION_EN[o] ?? o) : null,
  };
}
