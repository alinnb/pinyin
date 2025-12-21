import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "sonner";
import PracticePage from "./pages/Practice";
import ConvertPage from "./pages/Convert";
import MistakesPage from "./pages/Mistakes";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 antialiased">
        <header className="border-b bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="font-bold text-blue-600 text-xl">拼音大闯关</div>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link to="/" className="hover:text-blue-600 transition-colors">
                练习
              </Link>
              <Link to="/convert" className="hover:text-blue-600 transition-colors">
                转换工具
              </Link>
              <Link to="/mistakes" className="hover:text-blue-600 transition-colors">
                错题本
              </Link>
            </nav>
          </div>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<PracticePage />} />
            <Route path="/convert" element={<ConvertPage />} />
            <Route path="/mistakes" element={<MistakesPage />} />
          </Routes>
        </main>

        <Toaster position="top-center" richColors />
      </div>
    </BrowserRouter>
  );
}

export default App;