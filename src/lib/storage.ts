export type MistakeEntry = {
  char: string;
  wrong: string;
  correct: string;
  count: number;
};

const KEY = "pinyin_mistakes";

export function loadMistakes(): MistakeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

export function saveMistakes(list: MistakeEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function addMistake(char: string, wrong: string, correct: string) {
  const list = loadMistakes();
  const idx = list.findIndex((m) => m.char === char && m.correct === correct);
  if (idx >= 0) {
    list[idx].count += 1;
    list[idx].wrong = wrong;
  } else {
    list.push({ char, wrong, correct, count: 1 });
  }
  saveMistakes(list);
}

export function clearMistakes() {
  saveMistakes([]);
}
