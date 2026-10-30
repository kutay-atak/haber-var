// Türkçe heceleme. Dar gazete sütunlarında iki yana yaslı metin boşluklu durmasın diye
// uzun kelimelere görünmez "yumuşak tire" (U+00AD) eklenir; tarayıcı onu sadece satır
// sonuna denk gelirse tire olarak gösterir. Kural: hece sınırı, bir ünlüden hemen önceki
// ünsüzün önüne düşer (ka-pı, bay-ram, Türk-çe); iki ünlü yan yanaysa araya (sa-at).

const VOWELS = new Set("aeıioöuüâîûAEIİOÖUÜÂÎÛ");
const SHY = "­";

function hyphenateWord(word: string): string {
  const chars = [...word];
  const breaks = new Set<number>();
  let seenVowel = false;
  chars.forEach((c, i) => {
    if (!VOWELS.has(c)) return;
    if (seenVowel) {
      const at = VOWELS.has(chars[i - 1]) ? i : i - 1;
      // Satır başında ya da sonunda tek harf kalmasın.
      if (at >= 2 && chars.length - at >= 3) breaks.add(at);
    }
    seenVowel = true;
  });
  return chars.map((c, i) => (breaks.has(i) ? SHY + c : c)).join("");
}

/** Metindeki 6 harf ve daha uzun kelimelere hece sınırlarında yumuşak tire ekler. */
export function hyphenateTr(text: string): string {
  return text.replace(/\p{L}{6,}/gu, hyphenateWord);
}
