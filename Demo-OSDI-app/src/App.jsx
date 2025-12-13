// App.jsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DiseasePage from "./pages/DiseasePage";
import TestPage from "./pages/TestPage";

export default function App() { // ✅ Función componente
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/disease" element={<DiseasePage />} />
      <Route path="/test" element={<TestPage />} />
    </Routes>
  );
}
