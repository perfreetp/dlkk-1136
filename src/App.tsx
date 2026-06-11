import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LobbyPage from "@/pages/LobbyPage";
import MonitorPage from "@/pages/MonitorPage";
import IdentifyPage from "@/pages/IdentifyPage";
import MapPage from "@/pages/MapPage";
import DisposePage from "@/pages/DisposePage";
import ReviewPage from "@/pages/ReviewPage";
import GrowthPage from "@/pages/GrowthPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/monitor" element={<MonitorPage />} />
        <Route path="/identify" element={<IdentifyPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/dispose" element={<DisposePage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/growth" element={<GrowthPage />} />
      </Routes>
    </Router>
  );
}
