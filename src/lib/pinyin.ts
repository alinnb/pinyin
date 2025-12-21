import { pinyin } from "pinyin-pro";

export function stripTone(s: string) {
  const map: Record<string, string> = {
    ā: "a",
    á: "a",
    ǎ: "a",
    à: "a",
    ē: "e",
    é: "e",
    ě: "e",
    è: "e",
    ī: "i",
    í: "i",
    ǐ: "i",
    ì: "i",
    ō: "o",
    ó: "o",
    ǒ: "o",
    ò: "o",
    ū: "u",
    ú: "u",
    ǔ: "u",
    ù: "u",
    ǖ: "u",
    ǘ: "u",
    ǚ: "u",
    ǜ: "u",
    Ā: "A",
    Á: "A",
    Ǎ: "A",
    À: "A",
    Ē: "E",
    É: "E",
    Ǐ: "I",
    È: "E",
    Ō: "O",
    Ó: "O",
    Ǒ: "O",
    Ò: "O",
    Ū: "U",
    Ú: "U",
    Ǔ: "U",
    Ù: "U",
    Ǖ: "U",
    Ǘ: "U",
    Ǚ: "U",
    Ǜ: "U",
    ü: "u",
    Ü: "U",
  };
  return s.replace(
    /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉǏÈŌÓǑÒŪÚǓÙǕǗǙǛüÜ]/g,
    (ch) => map[ch] || ch
  );
}

export function normalizeInput(s: string) {
  return stripTone(s.toLowerCase().replace(/[1-5]$/g, ""));
}

export function getAcceptedPinyins(char: string) {
  const arr = pinyin(char, {
    toneType: "symbol",
    type: "array",
    multiple: true,
  }) as string[];
  const uniq = Array.from(new Set(arr));
  const withNormalized = uniq.map((t) => ({ raw: t, norm: normalizeInput(t) }));
  return withNormalized;
}

export function getPrimaryPinyin(char: string) {
  return pinyin(char, {
    toneType: "symbol",
    type: "string",
    multiple: false,
  }) as string;
}
