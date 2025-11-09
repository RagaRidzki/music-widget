// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Create from "./pages/Create";
import Widget from "./pages/Widget";
import Embed from "./pages/Embed.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/create" element={<Create />} />
        <Route path="/:slug" element={<Widget />} />
        <Route path="/embed/:slug" element={<Embed />} />
        <Route path="*" element={<Create />} />
      </Routes>
    </BrowserRouter>
  );
}

