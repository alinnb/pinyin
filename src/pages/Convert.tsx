import { useState } from "react";
import { Copy, RefreshCw, Type, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";

export default function ConvertPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [toneType, setToneType] = useState<"symbol" | "num" | "none">("none");
  const [multiple, setMultiple] = useState(false);
  const [separator, setSeparator] = useState(" ");

  const handleConvert = async () => {
    if (!text.trim()) {
      setError("请输入中文文本");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch("/api/pinyin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          options: {
            toneType,
            multiple,
            separator,
            type: "string",
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.code === 0) {
        setResult(data.data.pinyin);
      } else {
        setError(data.error || data.message || "转换失败");
      }
    } catch (err: any) {
      setError(err.message || "请求发生错误");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success("已复制到剪贴板");
    }
  };

  const clearAll = () => {
    setText("");
    setResult("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            中文转拼音工具
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            快速、准确的汉字注音服务，支持多音字、声调定制
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-t-4 border-t-blue-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  输入文本
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="在此输入需要转换的中文..."
                  className="min-h-[150px] text-lg resize-y"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={clearAll} disabled={!text}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空
                </Button>
                <Button onClick={handleConvert} disabled={loading || !text}>
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      转换中...
                    </>
                  ) : (
                    "开始转换"
                  )}
                </Button>
              </CardFooter>
            </Card>

            {(result || error) && (
              <Card
                className={`shadow-md ${
                  error
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span>{error ? "错误信息" : "转换结果"}</span>
                    {!error && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="h-8"
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        复制结果
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`p-4 rounded-md ${
                      error ? "text-red-700" : "text-green-800 bg-white/50"
                    } whitespace-pre-wrap font-mono text-lg leading-relaxed`}
                  >
                    {error || result}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings2 className="w-4 h-4" />
                  配置选项
                </CardTitle>
                <CardDescription>自定义拼音输出格式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>声调类型</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={toneType === "none" ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setToneType("none")}
                    >
                      无声调 (zhong)
                    </Button>
                    <Button
                      variant={toneType === "symbol" ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setToneType("symbol")}
                    >
                      带声调 (zhōng)
                    </Button>
                    <Button
                      variant={toneType === "num" ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setToneType("num")}
                    >
                      数字声调 (zhong1)
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label>多音字模式</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="multiple"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      checked={multiple}
                      onChange={(e) => setMultiple(e.target.checked)}
                    />
                    <label
                      htmlFor="multiple"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      启用多音字识别
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    注意：多音字识别可能不完全准确
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="separator">分隔符</Label>
                  <Input
                    id="separator"
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    className="text-center font-mono"
                    maxLength={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    拼音之间的连接符号（默认为空格）
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
