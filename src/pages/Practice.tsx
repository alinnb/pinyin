import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import QwertyKeyboard from "../components/keyboard/QwertyKeyboard";
import {
  addMistake,
  loadMistakes,
  addSession,
  loadSessions,
} from "../lib/storage";
import {
  normalizeInput,
  getAcceptedPinyins,
  getPrimaryPinyin,
} from "../lib/pinyin";
import { PracticeEngine } from "../components/practice/PracticeEngine";
import type { Status } from "../components/practice/PracticeEngine";

// Use string to support dynamic volumes
export type ContentType = string;

interface Volume {
  id: string;
  name: string;
}

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
  const [durationMin, setDurationMin] = useState<number>(10);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [lessonTitle, setLessonTitle] = useState<string>("");
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [lastSummary, setLastSummary] = useState<{
    typed: number;
    correct: number;
    wrong: number;
    accuracy: number;
    durationSec: number;
  } | null>(null);
  const [sessionHistory, setSessionHistory] = useState<
    {
      id: string;
      startAt: number;
      endAt: number;
      durationSec: number;
      typed: number;
      correct: number;
      wrong: number;
      accuracy: number;
    }[]
  >([]);
  const [currentArticleInfo, setCurrentArticleInfo] = useState<{
    articleId: number;
    lineIndex: number;
    totalLines: number;
  } | null>(null);
  const currentArticleInfoRef = useRef<{
    articleId: number;
    lineIndex: number;
    totalLines: number;
  } | null>(null);

  useEffect(() => {
    currentArticleInfoRef.current = currentArticleInfo;
  }, [currentArticleInfo]);

  const ignoreNextFetch = useRef(false);
  const contentQueue = useRef<
    {
      text: string;
      title?: string;
      articleId?: number;
      lineIndex?: number;
      totalLines?: number;
    }[]
  >([]);
  const typeRef = useRef(ctype);
  const timerRef = useRef<number | null>(null);
  const startAtRef = useRef<number | null>(null);
  const endedRef = useRef<boolean>(false);
  const typedRef = useRef<number>(0);
  const correctRef = useRef<number>(0);
  const wrongRef = useRef<number>(0);

  const chars = useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    // Fetch available volumes
    fetch("/api/volumes")
      .then((res) => res.json())
      .then((data: Volume[]) => {
        setVolumes(data);
      })
      .catch(() => {
        // Fallback or ignore
      });
  }, []);

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
      if (typeParam) {
        urlType = typeParam as ContentType;
      }
    } catch {}

    try {
      if (urlType) {
        setCtype(urlType);
      } else {
        const saved = localStorage.getItem("pinyin_ctype") as ContentType;
        if (saved) {
          setCtype(saved);
        }
      }
    } catch {}

    if (hasUrlText) {
      ignoreNextFetch.current = true;
    }

    setIsReady(true);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
      if (e.key === " ") {
        e.preventDefault();
        refreshContent();
      }
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      // Require at least 1 char for Space to prevent accidental skips
      if (buffer.length === 0) {
        return;
      }
      confirmBuffer();
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      setBuffer((prev) => prev.slice(0, -1));
      return;
    }
    if (/^[a-zA-Z1-5]$/.test(e.key)) {
      e.preventDefault();
      let nextBuffer = (buffer + e.key).toLowerCase();
      if (nextBuffer.length > 6) {
        nextBuffer = "";
      }
      setBuffer(nextBuffer);
    }
  };
  const handleKeyWithSession = (
    e: React.KeyboardEvent<HTMLDivElement> | KeyboardEvent
  ) => {
    if (sessionActive && remainingSec <= 0) return;
    handleKey(e);
  };

  const confirmBuffer = (inputBuffer?: string) => {
    if (cursor >= chars.length) return;

    const buf = inputBuffer !== undefined ? inputBuffer : buffer;
    const c = chars[cursor];
    const accepted = getAcceptedPinyins(c);
    const ok = accepted.some((x) => x.norm === normalizeInput(buf));
    const nextStatuses = [...statuses];
    nextStatuses[cursor] = ok ? "correct" : "wrong";
    setStatuses(nextStatuses);
    if (sessionActive && isChinese(c)) {
      typedRef.current += 1;
      if (ok) correctRef.current += 1;
      else wrongRef.current += 1;
    }
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
        const isTextbook = ![
          "random",
          "poem",
          "tongue",
          "sentence",
          "idiom",
          "classical",
          "mistake",
        ].includes(ctype);

        if (isTextbook) {
          setTimeout(() => {
            const info = currentArticleInfoRef.current;
            if (info) {
              refreshContent(undefined, true, {
                articleId: info.articleId,
                lineIndex: info.lineIndex,
              });
            } else {
              refreshContent();
            }
          }, 500);
        } else {
          toast.success("练习完成，按空格刷新");
        }
      }
    }
  };

  const fetchContent = async (
    targetType: ContentType,
    nextFrom?: { articleId: number; lineIndex: number }
  ): Promise<
    {
      text: string;
      title?: string;
      articleId?: number;
      lineIndex?: number;
      totalLines?: number;
    }[]
  > => {
    let mistakes: string[] = [];
    if (targetType === "mistake") {
      const list = loadMistakes();
      mistakes = list
        .sort((a, b) => b.count - a.count)
        .map((m) => m.char)
        .slice(0, 10);
    }

    const body: any = { type: targetType, mistakes };
    if (nextFrom) {
      body.articleId = nextFrom.articleId;
      body.lineIndex = nextFrom.lineIndex;
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("Fetch failed");
    }
    const data = await response.json();
    if (data.article) {
      return data.article.content.map((c: string) => ({
        text: c,
        title: data.article.title,
        articleId: data.article.id,
        lineIndex: data.article.lineIndex,
        totalLines: data.article.totalLines,
      }));
    }
    return [{ text: data.content }];
  };

  const preloadContent = async () => {
    // Disable preload for textbook mode to ensure correct sequencing
    const isTextbook = ![
      "random",
      "poem",
      "tongue",
      "sentence",
      "idiom",
      "classical",
      "mistake",
    ].includes(typeRef.current);

    if (isTextbook) return;

    if (contentQueue.current.length < 3) {
      try {
        const typeToFetch = typeRef.current;
        const nextTexts = await fetchContent(typeToFetch);
        if (typeRef.current !== typeToFetch) return;
        contentQueue.current.push(...nextTexts);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const refreshContent = async (
    typeOverride?: ContentType,
    skipQueue: boolean = false,
    nextFrom?: { articleId: number; lineIndex: number }
  ) => {
    const targetType = typeOverride || ctype;

    if (nextFrom) {
      skipQueue = true;
    }

    if (!skipQueue && contentQueue.current.length > 0) {
      const nextItem = contentQueue.current.shift();
      if (nextItem) {
        setText(nextItem.text);
        setLessonTitle(nextItem.title || "");
        if (
          nextItem.articleId !== undefined &&
          nextItem.lineIndex !== undefined &&
          nextItem.totalLines !== undefined
        ) {
          setCurrentArticleInfo({
            articleId: nextItem.articleId,
            lineIndex: nextItem.lineIndex,
            totalLines: nextItem.totalLines,
          });
        } else {
          setCurrentArticleInfo(null);
        }

        if (nextItem.text === text) {
          resetGame(nextItem.text);
        }
        if (
          typeof window !== "undefined" &&
          window.history &&
          window.history.replaceState
        ) {
          const url = new URL(window.location.href);
          if (url.searchParams.has("text")) {
            url.searchParams.delete("text");
            window.history.replaceState({}, "", url.toString());
          }
        }
        preloadContent();
        return;
      }
    }

    if (skipQueue) {
      contentQueue.current = [];
    }

    setLoadingGen(true);
    try {
      const contents = await fetchContent(targetType, nextFrom);
      const first = contents[0];
      if (contents.length > 1) {
        contentQueue.current.push(...contents.slice(1));
      }

      setText(first.text);
      setLessonTitle(first.title || "");
      if (
        first.articleId !== undefined &&
        first.lineIndex !== undefined &&
        first.totalLines !== undefined
      ) {
        setCurrentArticleInfo({
          articleId: first.articleId,
          lineIndex: first.lineIndex,
          totalLines: first.totalLines,
        });
      } else {
        setCurrentArticleInfo(null);
      }

      // Force reset if text is same, otherwise useEffect[text] will handle it
      if (first.text === text) {
        resetGame(first.text);
      }

      if (
        typeof window !== "undefined" &&
        window.history &&
        window.history.replaceState
      ) {
        const url = new URL(window.location.href);
        if (url.searchParams.has("text")) {
          url.searchParams.delete("text");
          window.history.replaceState({}, "", url.toString());
        }
      }
      preloadContent();
    } catch (e) {
      console.error(e);
      toast.error("生成失败，请重试");
    } finally {
      setLoadingGen(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem("pinyin_ctype", ctype);
    typeRef.current = ctype;

    // Clear queue when type changes
    contentQueue.current = [];

    if (ignoreNextFetch.current) {
      ignoreNextFetch.current = false;
      setTimeout(() => preloadContent(), 1000);
      return;
    }
    refreshContent(ctype);
    setTimeout(() => preloadContent(), 1000);
  }, [ctype, isReady]);

  useEffect(() => {
    try {
      const list = loadSessions()
        .slice()
        .sort((a, b) => b.endAt - a.endAt);
      const uniq = Array.from(
        new Map(list.map((s) => [s.id, s])).values()
      ).slice(0, 10);
      setSessionHistory(uniq);
    } catch {}
  }, []);

  const startSession = () => {
    if (sessionActive) return;
    resetGame(text);
    setLastSummary(null);
    setSessionActive(true);
    endedRef.current = false;
    typedRef.current = 0;
    correctRef.current = 0;
    wrongRef.current = 0;
    const total = durationMin === 0 ? 10 : durationMin * 60;
    setRemainingSec(total);
    startAtRef.current = Date.now();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setInterval(() => {
      setRemainingSec((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          endSession();
          return 0;
        }
        return next;
      });
    }, 1000);
  };

  const endSession = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setSessionActive(false);
    const endAt = Date.now();
    const durationSec = Math.max(
      0,
      startAtRef.current
        ? Math.round((endAt - startAtRef.current) / 1000)
        : durationMin * 60
    );
    let typed = 0;
    let correct = 0;
    let wrong = 0;
    if (typedRef.current > 0) {
      typed = typedRef.current;
      correct = correctRef.current;
      wrong = wrongRef.current;
    } else {
      statuses.forEach((s, idx) => {
        if (isChinese(chars[idx]) && s !== "pending") {
          typed++;
          if (s === "correct") correct++;
          if (s === "wrong") wrong++;
        }
      });
    }
    const acc = typed > 0 ? Math.round((correct / typed) * 100) : 100;
    setLastSummary({
      typed,
      correct,
      wrong,
      accuracy: acc,
      durationSec,
    });

    if (typed > 0) {
      const stat = {
        id: `${endAt}`,
        startAt: startAtRef.current || endAt - durationSec * 1000,
        endAt,
        durationSec,
        typed,
        correct,
        wrong,
        accuracy: acc,
      };
      addSession(stat);
      try {
        const list = loadSessions()
          .slice()
          .sort((a, b) => b.endAt - a.endAt);
        const uniq = Array.from(
          new Map(list.map((s) => [s.id, s])).values()
        ).slice(0, 10);
        setSessionHistory(uniq);
      } catch {}
    }

    toast.success("时间到");
  };

  const resetSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSessionActive(false);
    setRemainingSec(0);
    setLastSummary(null);
    resetGame(text);
  };

  const formatMMSS = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = s.toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 shrink-0">
            <h1 className="text-xl font-bold">练习</h1>
            {lessonTitle && (
              <div className="text-base text-blue-600 font-medium px-2 py-0.5 bg-blue-50 rounded">
                {lessonTitle}
              </div>
            )}
          </div>

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
              disabled={sessionActive}
            >
              <optgroup label="教材">
                {volumes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="其他">
                <option value="random">随机推荐</option>
                <option value="poem">唐诗宋词</option>
                <option value="tongue">绕口令</option>
                <option value="sentence">课文短句</option>
                <option value="idiom">常用成语</option>
                <option value="classical">古文(小学)</option>
                <option value="mistake">错题练习</option>
              </optgroup>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshContent(undefined, true)}
              disabled={loadingGen || sessionActive}
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

            <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <select
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-24"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                disabled={sessionActive}
              >
                <option value={0}>10秒(测试)</option>
                <option value={1}>1分钟</option>
                <option value={3}>3分钟</option>
                <option value={5}>5分钟</option>
                <option value={10}>10分钟</option>
                <option value={15}>15分钟</option>
                <option value={20}>20分钟</option>
                <option value={30}>30分钟</option>
              </select>
              {!sessionActive ? (
                <Button size="sm" className="h-8" onClick={startSession}>
                  开始
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8"
                  onClick={endSession}
                >
                  结束
                </Button>
              )}
              <div className="font-mono text-sm w-16 text-center">
                {sessionActive ? formatMMSS(remainingSec) : "未开始"}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={resetSession}
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        <PracticeEngine
          chars={chars}
          cursor={cursor}
          buffer={buffer}
          statuses={statuses}
          answers={answers}
          onKeyDown={handleKeyWithSession}
          onConfirm={confirmBuffer}
        />

        <div className="flex justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs shadow-sm font-mono">
              Space
            </span>
            <span>确认/下一个</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs shadow-sm font-mono">
              Backspace
            </span>
            <span>删除</span>
          </div>
        </div>

        <QwertyKeyboard />

        {!sessionActive && lastSummary && (
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-sm font-medium mb-2">本次统计</div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>时长 {Math.round(lastSummary.durationSec / 60)} 分钟</div>
              <div>输入 {lastSummary.typed}</div>
              <div>
                速度{" "}
                {Math.round(
                  (lastSummary.typed * 60) /
                    Math.max(lastSummary.durationSec, 1)
                )}
                /分
              </div>
              <div className="text-green-700">正确 {lastSummary.correct}</div>
              <div className="text-red-700">错误 {lastSummary.wrong}</div>
              <div>
                准确率{" "}
                <span className="font-mono font-bold text-base text-blue-600">
                  {lastSummary.accuracy}%
                </span>
              </div>
            </div>
          </div>
        )}

        {sessionHistory.length > 0 && (
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-sm font-medium mb-2">最近会话</div>
            <div className="space-y-2">
              {sessionHistory.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {new Date(s.endAt).toLocaleString()}
                    </span>
                    <span>{Math.round(s.durationSec / 60)} 分钟</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>输入 {s.typed}</span>
                    <span>
                      速{" "}
                      {Math.round((s.typed * 60) / Math.max(s.durationSec, 1))}
                      /分
                    </span>
                    <span className="text-green-700">正 {s.correct}</span>
                    <span className="text-red-700">误 {s.wrong}</span>
                    <span className="font-mono">{s.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
