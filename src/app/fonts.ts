import { Caveat, Fraunces, Nunito } from "next/font/google";

// Türkçe harfler (ğ, ş, ı, İ) "latin-ext" alt kümesinde.
export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

export const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
  display: "swap",
});

export const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-caveat",
  display: "swap",
});
