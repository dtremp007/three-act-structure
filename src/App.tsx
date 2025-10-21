import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import SketchOverview from "./components/SketchOverview";
import SketchDetail from "./components/SketchDetail";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<SketchOverview />} />
          <Route path="/sketch/:id" element={<SketchDetail />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}
