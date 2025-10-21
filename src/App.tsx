import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "sonner";
import SketchOverview from "./components/SketchOverview";
import SketchDetail from "./components/SketchDetail";
import PropsList from "./components/PropsList";
import PropDetail from "./components/PropDetail";
import TeamsList from "./components/TeamsList";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex gap-6 items-center">
              <Link
                to="/"
                className="text-lg font-semibold text-gray-900 hover:text-blue-600"
              >Sketches</Link>
              <Link
                to="/teams"
                className="text-lg font-semibold text-gray-900 hover:text-blue-600"
              >Teams</Link>
              <Link
                to="/props"
                className="text-lg font-semibold text-gray-900 hover:text-blue-600"
              >Props</Link>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<SketchOverview />} />
          <Route path="/sketch/:id" element={<SketchDetail />} />
          <Route path="/teams" element={<TeamsList />} />
          <Route path="/props" element={<PropsList />} />
          <Route path="/prop/:id" element={<PropDetail />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}
