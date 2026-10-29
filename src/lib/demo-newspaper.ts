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
  stats: { answers: 10, photos: 4, videos: 1 },
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
          media: [photo("m3", "deniz.svg")],
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
  ],
};
