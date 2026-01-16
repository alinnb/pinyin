import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "sonner";
import { Moon, Sun } from "lucide-react";
import PracticePage from "./pages/Practice";
import ConvertPage from "./pages/Convert";
import MistakesPage from "./pages/Mistakes";
import StatsPage from "./pages/Stats";
import { initTheme, toggleTheme, getTheme } from "./lib/theme";
import { Button } from "./components/ui/button";

function App() {
  useEffect(() => {
    initTheme();
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const currentTheme = getTheme();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased transition-colors duration-300">
        <header className="border-b bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="font-bold text-blue-600 dark:text-blue-400 text-xl">拼音大冒险</div>
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  练习
                </Link>
                <Link to="/convert" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  转换工具
                </Link>
                <Link to="/mistakes" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  错题本
                </Link>
                <Link to="/stats" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  统计
                </Link>
              </nav>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleThemeToggle}
                className="h-8 w-8 p-0"
                title={currentTheme === "light" ? "切换到暗色模式" : "切换到亮色模式"}
              >
                {currentTheme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<PracticePage />} />
            <Route path="/convert" element={<ConvertPage />} />
            <Route path="/mistakes" element={<MistakesPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </main>

        <Toaster position="top-center" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;