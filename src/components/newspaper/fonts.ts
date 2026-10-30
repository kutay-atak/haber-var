import {
  Anton,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  Courier_Prime,
  Dancing_Script,
  DM_Sans,
  DM_Serif_Display,
  EB_Garamond,
  Fredoka,
  Grenze_Gotisch,
  Inter,
  Libre_Franklin,
  Lora,
  Newsreader,
  Patrick_Hand,
  Playfair_Display,
  Rubik,
  Shrikhand,
  Special_Elite,
} from "next/font/google";

// Sadece gazete sayfalarında kullanılan yazı tipleri. Önceden yüklenmezler;
// tarayıcı bir yazı tipini ancak seçilen tasarım onu kullanıyorsa indirir.
// Fraunces, Nunito ve Caveat zaten uygulamanın genelinde yüklü (src/app/fonts.ts).
// Not: next/font ayarların her çağrıda açıkça yazılmasını istiyor.

const playfair = Playfair_Display({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-playfair" });
const newsreader = Newsreader({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--font-newsreader" });
const dmSerif = DM_Serif_Display({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, weight: "400", style: ["normal", "italic"], variable: "--font-dmserif" });
const patrickHand = Patrick_Hand({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, weight: "400", variable: "--font-patrick" });
const dancing = Dancing_Script({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-dancing" });
const lora = Lora({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--font-lora" });
const cormorant = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, style: ["normal", "italic"], variable: "--font-cormorant" });
const garamond = EB_Garamond({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-garamond" });
const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-bricolage" });
const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-dmsans" });
const specialElite = Special_Elite({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, weight: "400", variable: "--font-specialelite" });
const courier = Courier_Prime({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, weight: ["400", "700"], variable: "--font-courier" });
const anton = Anton({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, weight: "400", variable: "--font-anton" });
const franklin = Libre_Franklin({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-franklin" });
const shrikhand = Shrikhand({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, weight: "400", variable: "--font-shrikhand" });
const rubik = Rubik({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-rubik" });
const fredoka = Fredoka({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-fredoka" });
// Eski gazete yazısıyla gazete adı (tasarım stüdyosu → "Gazetenin adının yazısı: Eski gazete")
const oldpaper = Grenze_Gotisch({ subsets: ["latin", "latin-ext"], display: "swap", preload: false, variable: "--font-oldpaper" });

export const newspaperFonts = [
  playfair,
  newsreader,
  dmSerif,
  patrickHand,
  dancing,
  lora,
  cormorant,
  garamond,
  inter,
  bricolage,
  dmSans,
  specialElite,
  courier,
  anton,
  franklin,
  shrikhand,
  rubik,
  fredoka,
  oldpaper,
]
  .map((f) => f.variable)
  .join(" ");
