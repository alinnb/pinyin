import { useEffect } from "react";
import { Card, CardContent } from "../ui/card";

export type Status = "pending" | "correct" | "wrong";

interface PracticeEngineProps {
  chars: string[];
  cursor: number;
  buffer: string;
  statuses: Status[];
  answers: Record<number, string>;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement> | KeyboardEvent) => void;
  onConfirm: () => void;
}

export function PracticeEngine({
  chars,
  cursor,
  buffer,
  statuses,
  answers,
  onKeyDown,
}: PracticeEngineProps) {
  // Global key listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input/select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      // Forward to parent handler
      onKeyDown(e);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cursor, chars.length, onKeyDown]);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-8 text-3xl leading-none min-h-[70px] p-4 px-2">
          {chars.map((ch, idx) => {
            const isActive = idx === cursor;
            const status = statuses[idx] || "pending";
            const color =
              status === "correct"
                ? "text-green-600 dark:text-green-400"
                : status === "wrong"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-900 dark:text-gray-100";
            // Merge logic for pinyin display
            const showBuffer = isActive && buffer;
            const showAnswer = !showBuffer && answers[idx];
            const pinyinText = showBuffer
              ? buffer
              : showAnswer
              ? answers[idx]
              : null;
            const pinyinColor = showBuffer
              ? "text-gray-500 dark:text-gray-400"
              : statuses[idx] === "wrong"
              ? "text-red-600 dark:text-red-400"
              : "text-gray-700 dark:text-gray-300";

            const statusAnimation = status === "correct" ? "animate-correct" :
                                   status === "wrong" ? "animate-wrong" :
                                   isActive ? "animate-active" : "";

            return (
              <div
                key={idx}
                className={`relative px-2 py-2 rounded ${color} transition-all duration-300 ${
                  isActive ? "bg-blue-50 dark:bg-blue-900/20" : ""
                } ${statusAnimation}`}
                style={{
                  transform: status === "correct" || status === "wrong" ? "scale(1.1)" : "scale(1)",
                }}
              >
                <span>{ch}</span>
                {pinyinText && (
                  <span
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-sm font-mono whitespace-nowrap ${pinyinColor} transition-all duration-200 ${
                      showBuffer ? "animate-fade-in" : ""
                    }`}
                  >
                    {pinyinText}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-1 left-2 right-2 h-0.5 bg-blue-400 dark:bg-blue-500 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
