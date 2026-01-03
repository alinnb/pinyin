import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { clearMistakes, loadMistakes, removeMistake } from "../lib/storage";
import type { MistakeEntry } from "../lib/storage";

export default function MistakesPage() {
  const [list, setList] = useState<MistakeEntry[]>([]);

  useEffect(() => {
    setList(loadMistakes());
  }, []);

  const handleClear = () => {
    clearMistakes();
    setList([]);
  };

  const handleDelete = (char: string, correct: string) => {
    removeMistake(char, correct);
    setList(loadMistakes());
  };

  const practiceFromMistakes = () => {
    const uniqChars = Array.from(new Set(list.map((m) => m.char)));
    const text = uniqChars.join("");
    window.location.href = `/?text=${encodeURIComponent(text)}&type=mistake`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">错题本</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={practiceFromMistakes}
              disabled={list.length === 0}
            >
              针对错题生成练习
            </Button>
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={list.length === 0}
            >
              一键清除
            </Button>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>错误记录</CardTitle>
          </CardHeader>
          <CardContent>
            {list.length === 0 ? (
              <div className="text-gray-500">暂无错题记录</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {list.map((m, i) => (
                  <div
                    key={i}
                    className="rounded-md border p-3 bg-white relative group"
                  >
                    <div className="text-2xl font-bold">{m.char}</div>
                    <div className="mt-1 text-sm flex flex-col xl:flex-row gap-1 xl:gap-2">
                      <span className="text-red-600">错: {m.wrong}</span>
                      <span className="text-green-600">对: {m.correct}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      次数: {m.count}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(m.char, m.correct)}
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter />
        </Card>
      </div>
    </div>
  );
}
