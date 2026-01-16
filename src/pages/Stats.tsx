import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { TrendingUp, Clock, Target, Award, FileText } from "lucide-react";
import { loadSessions, loadMistakes, type SessionStat, type MistakeEntry } from "../lib/storage";

type TimeStats = {
  totalSessions: number;
  totalMinutes: number;
  totalCharacters: number;
  totalCorrect: number;
  totalWrong: number;
  avgAccuracy: number;
  avgSpeed: number;
  bestAccuracy: number;
  bestSpeed: number;
  totalMistakes: number;
};

type RecentTrend = {
  date: string;
  accuracy: number;
  speed: number;
  characters: number;
};

export default function StatsPage() {
  const [sessions, setSessions] = useState<SessionStat[]>([]);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("week");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    setSessions(loadSessions());
    setMistakes(loadMistakes());
  }, []);

  const timeStats = useMemo<TimeStats>(() => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        totalCharacters: 0,
        totalCorrect: 0,
        totalWrong: 0,
        avgAccuracy: 0,
        avgSpeed: 0,
        bestAccuracy: 0,
        bestSpeed: 0,
        totalMistakes: mistakes.length,
      };
    }

    const filteredSessions = filterSessionsByPeriod(sessions, selectedPeriod);

    const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.durationSec / 60, 0);
    const totalCharacters = filteredSessions.reduce((sum, s) => sum + s.typed, 0);
    const totalCorrect = filteredSessions.reduce((sum, s) => sum + s.correct, 0);
    const totalWrong = filteredSessions.reduce((sum, s) => sum + s.wrong, 0);

    const avgAccuracy = totalCharacters > 0
      ? Math.round((totalCorrect / totalCharacters) * 100)
      : 0;
    const avgSpeed = totalMinutes > 0
      ? Math.round(totalCharacters / totalMinutes)
      : 0;

    const bestAccuracy = Math.max(...filteredSessions.map(s => s.accuracy));
    const bestSpeed = Math.max(...filteredSessions.map(s =>
      Math.round(s.typed / (s.durationSec / 60))
    ));

    return {
      totalSessions: filteredSessions.length,
      totalMinutes: Math.round(totalMinutes),
      totalCharacters,
      totalCorrect,
      totalWrong,
      avgAccuracy,
      avgSpeed,
      bestAccuracy,
      bestSpeed,
      totalMistakes: mistakes.length,
    };
  }, [sessions, selectedPeriod, mistakes]);

  const recentTrends = useMemo<RecentTrend[]>(() => {
    const filteredSessions = filterSessionsByPeriod(sessions, selectedPeriod);

    const dateMap = new Map<string, { totalTyped: number; totalCorrect: number; totalDuration: number }>();

    filteredSessions.forEach(session => {
      const date = new Date(session.endAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      const existing = dateMap.get(date) || { totalTyped: 0, totalCorrect: 0, totalDuration: 0 };
      dateMap.set(date, {
        totalTyped: existing.totalTyped + session.typed,
        totalCorrect: existing.totalCorrect + session.correct,
        totalDuration: existing.totalDuration + session.durationSec,
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, stats]) => ({
        date,
        accuracy: Math.round((stats.totalCorrect / stats.totalTyped) * 100),
        speed: Math.round(stats.totalTyped / (stats.totalDuration / 60)),
        characters: stats.totalTyped,
      }))
      .slice(-7); // 最后7条记录
  }, [sessions, selectedPeriod]);

  const topMistakes = useMemo<MistakeEntry[]>(() => {
    return [...mistakes]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [mistakes]);

  const mistakePattern = useMemo<{ char: string; count: number; wrongTypes: string[] }[]>(() => {
    const patternMap = new Map<string, { count: number; wrongTypes: Set<string> }>();

    mistakes.forEach(m => {
      const existing = patternMap.get(m.char) || { count: 0, wrongTypes: new Set<string>() };
      patternMap.set(m.char, {
        count: existing.count + m.count,
        wrongTypes: new Set([...existing.wrongTypes, m.wrong]),
      });
    });

    return Array.from(patternMap.entries())
      .map(([char, data]) => ({
        char,
        count: data.count,
        wrongTypes: Array.from(data.wrongTypes),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [mistakes]);

  function filterSessionsByPeriod(sessionList: SessionStat[], period: "week" | "month" | "all"): SessionStat[] {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return sessionList.filter(session => {
      if (period === "all") return true;

      const sessionAge = now - session.endAt;
      if (period === "week") return sessionAge <= 7 * dayMs;
      if (period === "month") return sessionAge <= 30 * dayMs;
      return true;
    });
  }

  const handleClearAll = () => {
    if (confirm("确定要清除所有学习数据吗？此操作不可恢复。")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleGenerateReport = () => {
    setShowReport(true);
  };

  const reportContent = useMemo(() => {
    if (sessions.length === 0) return null;

    const periodText = selectedPeriod === "week" ? "本周" : selectedPeriod === "month" ? "本月" : "全部";

    let report = `# 学习报告 (${periodText})\n\n`;
    report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

    // 概览
    report += `## 概览\n\n`;
    report += `- 总练习时长: ${timeStats.totalMinutes} 分钟\n`;
    report += `- 练习会话: ${timeStats.totalSessions} 次\n`;
    report += `- 总输入字符: ${timeStats.totalCharacters} 字\n`;
    report += `- 平均准确率: ${timeStats.avgAccuracy}%\n`;
    report += `- 平均速度: ${timeStats.avgSpeed} 字/分\n`;
    report += `- 最佳准确率: ${timeStats.bestAccuracy}%\n`;
    report += `- 最佳速度: ${timeStats.bestSpeed} 字/分\n\n`;

    // 详细表现
    report += `## 详细表现\n\n`;
    report += `- 正确字符: ${timeStats.totalCorrect}\n`;
    report += `- 错误字符: ${timeStats.totalWrong}\n`;
    if (timeStats.totalCharacters > 0) {
      report += `- 错误率: ${Math.round((timeStats.totalWrong / timeStats.totalCharacters) * 100)}%\n`;
    }
    report += `- 错题总数: ${timeStats.totalMistakes}\n\n`;

    // 错题分析
    if (mistakePattern.length > 0) {
      report += `## 错题分析\n\n`;
      mistakePattern.slice(0, 5).forEach((pattern, index) => {
        const correctPinyin = mistakes.find(m => m.char === pattern.char)?.correct || "未知";
        report += `${index + 1}. **${pattern.char}** (${correctPinyin})\n`;
        report += `   - 错误次数: ${pattern.count}\n`;
        report += `   - 常误输入: ${pattern.wrongTypes.slice(0, 2).join(", ")}\n`;
      });
      report += `\n`;
    }

    // 最近趋势
    if (recentTrends.length > 0) {
      report += `## 最近趋势\n\n`;
      recentTrends.forEach(trend => {
        const accuracyLevel = trend.accuracy >= 90 ? "优秀" : trend.accuracy >= 70 ? "良好" : "需要提高";
        report += `- **${trend.date}**: 准确率 ${trend.accuracy}% (${accuracyLevel}), 速度 ${trend.speed} 字/分, 输入 ${trend.characters} 字\n`;
      });
      report += `\n`;
    }

    // 建议
    report += `## 学习建议\n\n`;
    if (timeStats.avgAccuracy >= 90) {
      report += `🎉 准确率表现优秀！建议保持当前的学习节奏。\n\n`;
    } else if (timeStats.avgAccuracy >= 70) {
      report += `👍 准确率良好，建议重点关注错题本的易错字。\n\n`;
    } else {
      report += `💡 建议放慢打字速度，注意音节和声调的准确性，可以多使用错题练习功能。\n\n`;
    }

    if (mistakePattern.length > 0) {
      report += `建议优先练习以下易错字：`;
      mistakePattern.slice(0, 5).forEach(pattern => {
        report += ` ${pattern.char}`;
      });
      report += `\n\n`;
    }

    if (timeStats.avgSpeed < 20) {
      report += `💪 打字速度有待提升，建议通过更多练习提高熟练度。\n\n`;
    }

    report += `---\n`;
    report += `*报告由拼音大冒险自动生成*`;

    return report;
  }, [sessions, selectedPeriod, timeStats, mistakePattern, recentTrends, mistakes]);

  const handleCopyReport = () => {
    if (reportContent) {
      navigator.clipboard.writeText(reportContent);
      alert("学习报告已复制到剪贴板");
    }
  };

  const handleDownloadReport = () => {
    if (reportContent) {
      const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `拼音学习报告_${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 标题 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">学习统计</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">查看您的学习进度和成就</p>
          </div>

          <div className="flex items-center gap-2">
            {(["week", "month", "all"] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period === "week" ? "本周" : period === "month" ? "本月" : "全部"}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateReport}
              disabled={sessions.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              生成报告
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-600 dark:border-l-blue-400">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">总练习时长</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {timeStats.totalMinutes} <span className="text-sm font-normal">分钟</span>
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-600 dark:border-l-green-400">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">平均准确率</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {timeStats.avgAccuracy}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 dark:border-l-purple-400">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">平均速度</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {timeStats.avgSpeed} <span className="text-sm font-normal">字/分</span>
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-600 dark:border-l-amber-400">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">练习会话</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {timeStats.totalSessions} <span className="text-sm font-normal">次</span>
                  </p>
                </div>
                <Award className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细统计 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">学习表现</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">总输入字符</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{timeStats.totalCharacters}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">正确字符</span>
                <span className="font-mono font-bold text-green-600 dark:text-green-400">{timeStats.totalCorrect}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">错误字符</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">{timeStats.totalWrong}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">最佳准确率</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{timeStats.bestAccuracy}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">最佳速度</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{timeStats.bestSpeed} 字/分</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">错题统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">错题总数</span>
                <span className="font-mono font-bold text-red-600 dark:text-red-400">{timeStats.totalMistakes}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">错题字符</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                  {mistakes.length > 0 ? mistakes.filter((m, i, arr) => arr.findIndex(nm => nm.char === m.char) === i).length : 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">最高错误次数</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  {topMistakes.length > 0 ? topMistakes[0].count : 0}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">需要复习</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {topMistakes.filter(m => m.count >= 3).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 错题模式分析 */}
        {mistakePattern.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">错题模式分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mistakePattern.map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pattern.char}</div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">错误 {pattern.count} 次</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          常错为: {pattern.wrongTypes.slice(0, 3).join(", ")}
                          {pattern.wrongTypes.length > 3 && "..."}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {mistakes.find(m => m.char === pattern.char)?.correct || "未知"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 最近趋势 */}
        {recentTrends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">最近趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{trend.date}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">输入 {trend.characters} 字</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">准确率</span>
                        <span className={`font-mono font-bold ${trend.accuracy >= 90 ? 'text-green-600 dark:text-green-400' : trend.accuracy >= 70 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {trend.accuracy}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">速度</span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {trend.speed} 字/分
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 数据管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">数据管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">所有学习数据都保存在本地浏览器中</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">清除浏览器数据会导致学习记录丢失</p>
              </div>
              <Button
                variant="destructive"
                onClick={handleClearAll}
                className="shrink-0"
              >
                清除所有数据
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 学习报告模态框 */}
        {showReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">学习报告</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReport(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
                  {reportContent || "暂无数据生成报告"}
                </pre>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyReport}
                  disabled={!reportContent}
                >
                  复制报告
                </Button>
                <Button
                  onClick={handleDownloadReport}
                  disabled={!reportContent}
                >
                  下载报告
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}