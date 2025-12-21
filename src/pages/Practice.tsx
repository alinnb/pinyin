import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import QwertyKeyboard from "../components/keyboard/QwertyKeyboard";
import { addMistake, loadMistakes } from "../lib/storage";
import {
  normalizeInput,
  getAcceptedPinyins,
  getPrimaryPinyin,
} from "../lib/pinyin";
import { PracticeEngine } from "../components/practice/PracticeEngine";
import type { Status } from "../components/practice/PracticeEngine";

export type ContentType =
  | "poem"
  | "tongue"
  | "sentence"
  | "idiom"
  | "mistake"
  | "classical"
  | "random";

export default function PracticePage() {
  const [text, setText] = useState<string>("小桥流水人家");
  const [cursor, setCursor] = useState<number>(0);
  const [buffer, setBuffer] = useState<string>("");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [accuracy, setAccuracy] = useState<number>(100);
  const [ctype, setCtype] = useState<ContentType>("sentence");
  const [loadingGen, setLoadingGen] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);
  const ignoreNextFetch = useRef(false);
  const autoConfirmTimer = useRef<number | null>(null);

  const chars = useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    let hasUrlText = false;
    let urlType: ContentType | null = null;
    try {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get("text");
      const typeParam = sp.get("type");
      if (t && t.length > 0) {
        setText(t);
        hasUrlText = true;
      }
      if (
        typeParam &&
        [
          "poem",
          "tongue",
          "sentence",
          "idiom",
          "mistake",
          "classical",
          "random",
        ].includes(typeParam)
      ) {
        urlType = typeParam as ContentType;
      }
    } catch {}

    try {
      if (urlType) {
        setCtype(urlType);
      } else {
        const saved = localStorage.getItem("pinyin_ctype") as ContentType;
        if (
          saved &&
          [
            "poem",
            "tongue",
            "sentence",
            "idiom",
            "mistake",
            "classical",
            "random",
          ].includes(saved)
        ) {
          setCtype(saved);
        }
      }
    } catch {}

    if (hasUrlText) {
      ignoreNextFetch.current = true;
    }

    setIsReady(true);
    return () => {
      if (autoConfirmTimer.current) {
        clearTimeout(autoConfirmTimer.current);
      }
    };
  }, []);

  const isChinese = (char: string) => {
    return /\p{Script=Han}/u.test(char);
  };

  const findNextCursor = (current: number, chars: string[]) => {
    let next = current + 1;
    while (next < chars.length && !isChinese(chars[next])) {
      next++;
    }
    return next;
  };

  const resetGame = (newText: string) => {
    let first = 0;
    const charsArray = Array.from(newText);
    while (first < charsArray.length && !isChinese(charsArray[first])) {
      first++;
    }

    setStatuses(Array(charsArray.length).fill("pending"));
    setAnswers({});
    setCursor(first);
    setBuffer("");
    setAccuracy(100);
  };

  useEffect(() => {
    resetGame(text);
  }, [text]);

  useEffect(() => {
    const totalChinese = chars.filter((c) => isChinese(c)).length;
    if (totalChinese === 0) {
      setAccuracy(100);
      return;
    }

    let done = 0;
    let correct = 0;

    statuses.forEach((s, idx) => {
      if (isChinese(chars[idx]) && s !== "pending") {
        done++;
        if (s === "correct") correct++;
      }
    });

    if (done > 0) setAccuracy(Math.round((correct / done) * 100));
  }, [statuses, chars]);

  const handleKey = (
    e: React.KeyboardEvent<HTMLDivElement> | KeyboardEvent
  ) => {
    if (cursor >= chars.length) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        refreshContent();
      }
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (autoConfirmTimer.current) {
        clearTimeout(autoConfirmTimer.current);
        autoConfirmTimer.current = null;
      }
      confirmBuffer();
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      if (autoConfirmTimer.current) {
        clearTimeout(autoConfirmTimer.current);
        autoConfirmTimer.current = null;
      }
      setBuffer((prev) => prev.slice(0, -1));
      return;
    }
    if (/^[a-zA-Z1-5]$/.test(e.key)) {
      e.preventDefault();
      if (autoConfirmTimer.current) {
        clearTimeout(autoConfirmTimer.current);
        autoConfirmTimer.current = null;
      }
      let nextBuffer = (buffer + e.key).toLowerCase();
      if (nextBuffer.length > 6) {
        nextBuffer = "";
      }
      setBuffer(nextBuffer);
      checkAutoConfirm(nextBuffer);
    }
  };

  const checkAutoConfirm = (currentBuffer: string) => {
    if (cursor >= chars.length) return;
    const c = chars[cursor];
    if (!isChinese(c)) return;

    const accepted = getAcceptedPinyins(c);
    const ok = accepted.some((x) => x.norm === normalizeInput(currentBuffer));

    if (ok) {
      if (autoConfirmTimer.current) clearTimeout(autoConfirmTimer.current);
      autoConfirmTimer.current = window.setTimeout(() => {
        confirmBuffer(currentBuffer);
      }, 300);
    }
  };

  const confirmBuffer = (inputBuffer?: string) => {
    if (autoConfirmTimer.current) {
      clearTimeout(autoConfirmTimer.current);
      autoConfirmTimer.current = null;
    }
    if (cursor >= chars.length) return;

    const buf = inputBuffer !== undefined ? inputBuffer : buffer;
    const c = chars[cursor];
    const accepted = getAcceptedPinyins(c);
    const ok = accepted.some((x) => x.norm === normalizeInput(buf));
    const nextStatuses = [...statuses];
    nextStatuses[cursor] = ok ? "correct" : "wrong";
    setStatuses(nextStatuses);
    if (ok) {
      const final = getPrimaryPinyin(c);
      setAnswers((prev) => ({ ...prev, [cursor]: final }));
      setBuffer("");
      moveNext();
    } else {
      const final = getPrimaryPinyin(c);
      setAnswers((prev) => ({ ...prev, [cursor]: final }));
      setBuffer("");
      const anyNav = navigator as any;
      if (anyNav && typeof anyNav.vibrate === "function") {
        try {
          anyNav.vibrate(100);
        } catch {}
      }
      addMistake(c, buf, final);
      moveNext();
    }
  };

  const moveNext = () => {
    const next = findNextCursor(cursor, chars);
    if (next <= chars.length) {
      setCursor(next);
      if (next === chars.length) {
        toast.success("练习完成，按空格刷新");
      }
    }
  };

  const refreshContent = async (typeOverride?: ContentType) => {
    const targetType = typeOverride || ctype;
    setLoadingGen(true);
    try {
      let mistakes: string[] = [];
      if (targetType === "mistake") {
        const list = loadMistakes();
        mistakes = list
          .sort((a, b) => b.count - a.count)
          .map((m) => m.char)
          .slice(0, 10);
      }
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: targetType, mistakes }),
      });
      const data = await response.json();
      setText(data.content);
      
      // Force reset if text is same, otherwise useEffect[text] will handle it
      if (data.content === text) {
        resetGame(data.content);
      }

      if (typeof window !== "undefined" && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        if (url.searchParams.has("text")) {
          url.searchParams.delete("text");
          window.history.replaceState({}, "", url.toString());
        }
      }
    } finally {
      setLoadingGen(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem("pinyin_ctype", ctype);
    if (ignoreNextFetch.current) {
      ignoreNextFetch.current = false;
      return;
    }
    refreshContent(ctype);
  }, [ctype, isReady]);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3">
          <h1 className="text-xl font-bold shrink-0">练习</h1>

          <div className="flex items-center gap-3 flex-1 justify-end w-full sm:w-auto">
            <select
              key={isReady ? "ready" : "loading"}
              className="h-8 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-32"
              value={ctype}
              onChange={(e) => setCtype(e.target.value as ContentType)}
              onKeyDown={(e) => {
                if (
                  /^[a-zA-Z1-5]$/.test(e.key) &&
                  !e.ctrlKey &&
                  !e.altKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                  e.currentTarget.blur();
                  handleKey(
                    e as unknown as React.KeyboardEvent<HTMLDivElement>
                  );
                }
              }}
            >
              <option value="random">随机推荐</option>
              <option value="poem">唐诗宋词</option>
              <option value="tongue">绕口令</option>
              <option value="sentence">童话短句</option>
              <option value="idiom">常用成语</option>
              <option value="classical">古文(小学)</option>
              <option value="mistake">错题练习</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshContent()}
              disabled={loadingGen}
              className="h-8"
            >
              {loadingGen ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                "刷新"
              )}
            </Button>

            <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />

            <div className="text-sm whitespace-nowrap">
              准确率{" "}
              <span className="font-mono font-bold text-base text-blue-600">
                {accuracy}%
              </span>
            </div>
          </div>
        </div>

        <PracticeEngine
          chars={chars}
          cursor={cursor}
          buffer={buffer}
          statuses={statuses}
          answers={answers}
          onKeyDown={handleKey}
          onConfirm={confirmBuffer}
        />

        <QwertyKeyboard />
      </div>
    </div>
  );
}
