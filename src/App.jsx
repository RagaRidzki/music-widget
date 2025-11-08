import { BrowserRouter, Routes, Route } from "react-router-dom";
import Create from "./pages/Create";
import Widget from "./pages/Widget";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Create />} />
        <Route path="/:slug" element={<Widget />} />
      </Routes>
    </BrowserRouter>
  );
}
