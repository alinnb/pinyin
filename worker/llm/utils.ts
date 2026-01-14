import { jsonrepair } from "jsonrepair";

export function parseJson<T = any>(text: string): T | null {
  if (!text) return null;
  // 移除 Markdown 代码块
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      // 容错修复
      return JSON.parse(jsonrepair(cleaned));
    } catch (e) {
      console.error("JSON Parse Error:", text.slice(0, 50));
      return null;
    }
  }
}
