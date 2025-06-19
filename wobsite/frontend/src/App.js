import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DuetGraph from "./DuetGraph.js";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DuetGraph />} />
        <Route path="/:artist1/:artist2" element={<DuetGraph />} />
        <Route path="/:artist1" element={<DuetGraph />} />
        <Route path="/*" element={<DuetGraph />} />
        <Route path="*" element={<DuetGraph />} />
      </Routes>
    </Router>
  );
}
