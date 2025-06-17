import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DuetGraph from "./components/DuetGraph";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DuetGraph />} />
        <Route path="/:artist1/:artist2" element={<DuetGraph />} />
      </Routes>
    </Router>
  );
}
