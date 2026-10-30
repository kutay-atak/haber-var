import type { Locale } from "@/lib/i18n";
import type { NewsMedia, NewsPerson, NewspaperData } from "@/lib/newspaper";

// /sablonlar sayfasındaki örnek gazete. Görseller public/demo klasöründe.

const ayse: NewsPerson = { id: "ayse", name: "Ayşe Yılmaz", avatarUrl: null };
const mehmet: NewsPerson = { id: "mehmet", name: "Mehmet Kaya", avatarUrl: null };
const zeynep: NewsPerson = { id: "zeynep", name: "Zeynep Arslan", avatarUrl: null };
const can: NewsPerson = { id: "can", name: "Can Demir", avatarUrl: null };

const photo = (id: string, file: string): NewsMedia => ({
  id,
  kind: "image",
  src: `/demo/${file}`,
  width: 1200,
  height: 900,
});

export const DEMO_NEWSPAPER: NewspaperData = {
  groupName: "Kuzenler Şubesi",
  issueNumber: 7,
  issueTitle: "Sonbahar sayısı",
  publishedAt: "2026-10-25T17:00:00.000Z",
  contributors: [ayse, mehmet, zeynep, can],
  stats: { answers: 10, photos: 4, videos: 1, audios: 1, votes: 8 },
  questions: [
    {
      id: "q1",
      text: "Bu ay seni en çok ne güldürdü?",
      answers: [
        {
          id: "a1",
          author: ayse,
          body: "Komşunun kedisi balkonumu kendi evi sandı. Geçen gün eve geldim, koltuğumda uyuyordu ve bana \"sen kimsin\" der gibi baktı.\n\nArtık ondan kira almayı düşünüyorum. Ödemeyi mırlayarak yapıyor.",
          media: [photo("m1", "kedi.svg")],
        },
        {
          id: "a2",
          author: mehmet,
          body: "Annem WhatsApp'ta sesli mesajı keşfetti. Artık her sabah 4 dakikalık hava durumu raporları alıyorum. Dün \"İzmir'de hava güzel, sizde nasıl?\" diye sordu. Aynı şehirde yaşıyoruz.",
          media: [],
        },
        {
          id: "a3",
          author: zeynep,
          body: "İngilizlerin özür dileme yarışı. Biri ayağıma bastı, ikimiz de \"sorry\" dedik. Sonra ikimiz de bir kez daha \"sorry\" dedik. Dört tur sürdü, berabere bitti.",
          media: [],
        },
      ],
    },
    {
      id: "q2",
      text: "Şu an pencerenden ne görüyorsun? Bir fotoğrafını çek.",
      answers: [
        {
          id: "a4",
          author: can,
          body: "Karşı apartmanın çatısında bir martı ailesi yaşıyor. Ankara'da ne aradıklarını bilmiyorum, onlar da bilmiyor gibi.",
          media: [photo("m2", "manzara.svg")],
        },
        {
          id: "a5",
          author: mehmet,
          body: "Kordon'da akşamüstü. Hepinizi bekliyoruz, çaylar benden.",
          media: [photo("m3", "deniz.svg"), { id: "m6", kind: "audio", src: null, width: null, height: null, duration: 38 }],
        },
      ],
    },
    {
      id: "q3",
      text: "Bize kısa bir video gönder: Bugün neler yapıyorsun?",
      answers: [
        {
          id: "a6",
          author: ayse,
          body: "Annemin tarifiyle mercimek çorbası denemesi. Sonuç: renk tuttu, tat hâlâ tartışmalı 😅",
          media: [{ id: "m4", kind: "video", src: null, poster: "/demo/video-kapak.svg", width: 1200, height: 900 }],
        },
        {
          id: "a7",
          author: can,
          body: "Bugün ilk kez 10 kilometre koştum! Video çekecek hâlim kalmadı, onun yerine bu kahveyi kabul edin.",
          media: [photo("m5", "kahve.svg")],
        },
      ],
    },
    {
      id: "q4",
      text: "Bir sonraki buluşmamızda ne yapmak isterdin?",
      answers: [
        {
          id: "a8",
          author: zeynep,
          body: "Bayramda hep birlikte Bozcaada'ya gidelim. Ben bisikletleri kiralarım, Can rotayı çizer, Mehmet balık pişirir, Ayşe de fotoğrafları çeker. İş bölümü tamam.",
          media: [],
        },
        {
          id: "a9",
          author: mehmet,
          body: "Zeynep'e katılıyorum ama balık işini Can'a devrediyorum. Geçen sefer olanları hepimiz hatırlıyoruz.",
          media: [],
        },
        {
          id: "a10",
          author: ayse,
          body: "Bozcaada olur! Bu sefer fotoğraf makinesi değil, sadece kendimi getireceğim. Söz.",
          media: [],
        },
      ],
    },
    {
      id: "q5",
      text: "Bir sonraki buluşmamız nerede olsun?",
      kind: "poll",
      askedBy: zeynep,
      answers: [],
      vote: {
        kind: "poll",
        total: 4,
        options: [
          { label: "Birinin evinde", votes: 1, voters: [can] },
          { label: "Bir restoranda", votes: 0, voters: [] },
          { label: "Doğada", votes: 2, voters: [ayse, zeynep] },
          { label: "Başka bir şehirde", votes: 1, voters: [mehmet] },
        ],
      },
    },
    {
      id: "q6",
      text: "Kim en çok geç kalır?",
      kind: "who",
      answers: [],
      vote: {
        kind: "who",
        total: 4,
        options: [
          { label: can.name, votes: 2, voters: [], person: can },
          { label: mehmet.name, votes: 1, voters: [], person: mehmet },
          { label: ayse.name, votes: 1, voters: [], person: ayse },
        ],
      },
    },
  ],
};

// İngilizce arayüz için aynı örnek sayı.
const EN_TEXT: Record<string, string> = {
  q1: "What made you laugh the most this month?",
  a1: "The neighbour's cat has decided my balcony is its home. The other day I came back and it was asleep on my sofa, looking at me as if to say \"who are you?\"\n\nI'm thinking of charging it rent. It pays in purrs.",
  a2: "My mum has discovered voice messages on WhatsApp. Now I get a 4-minute weather report every morning. Yesterday she asked \"The weather's lovely in İzmir, how is it where you are?\" We live in the same city.",
  a3: "The great British apology contest. Someone stepped on my foot and we both said \"sorry\". Then we both said \"sorry\" again. It went on for four rounds and ended in a draw.",
  q2: "What can you see from your window right now? Take a photo.",
  a4: "A family of seagulls lives on the roof across the street. I have no idea what they're doing in Ankara, and neither do they, by the look of it.",
  a5: "Early evening on the Kordon. We're waiting for you all, the tea's on me.",
  q3: "Send us a short video: what are you up to today?",
  a6: "Attempting lentil soup with my mum's recipe. Verdict: the colour is right, the taste is still up for debate 😅",
  a7: "I ran 10 kilometres for the first time today! I had no energy left to film a video, so please accept this coffee instead.",
  q4: "What would you like to do the next time we meet?",
  a8: "Let's all go to Bozcaada for the holiday. I'll rent the bikes, Can plans the route, Mehmet cooks the fish and Ayşe takes the photos. Jobs sorted.",
  a9: "I'm with Zeynep, but I'm handing the fish over to Can. We all remember what happened last time.",
  a10: "Bozcaada it is! This time I'm not bringing a camera, just myself. Promise.",
  q5: "Where should we meet next time?",
  q6: "Who is always running late?",
};

const POLL_EN: Record<string, string[]> = {
  q5: ["At someone's place", "At a restaurant", "Outdoors", "In another city"],
};

export const DEMO_NEWSPAPER_EN: NewspaperData = {
  ...DEMO_NEWSPAPER,
  groupName: "The Cousins Club",
  issueTitle: "The autumn issue",
  questions: DEMO_NEWSPAPER.questions.map((q) => ({
    ...q,
    text: EN_TEXT[q.id] ?? q.text,
    answers: q.answers.map((a) => ({ ...a, body: EN_TEXT[a.id] ?? a.body })),
    vote:
      q.vote && POLL_EN[q.id]
        ? { ...q.vote, options: q.vote.options.map((o, i) => ({ ...o, label: POLL_EN[q.id][i] ?? o.label })) }
        : q.vote,
  })),
};

export function demoNewspaper(locale: Locale): NewspaperData {
  return locale === "en" ? DEMO_NEWSPAPER_EN : DEMO_NEWSPAPER;
}
