// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router";
import { HomePage } from "./pages/HomePage";
import { RoomPage } from "./pages/RoomPage";
import { Sandbox } from "./pages/Sandbox";
import { JoinPage } from "./pages/JoinPage";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="" element={<HomePage />} />
        <Route path="/join/:roomCode?" element={<JoinPage />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/room/:roomCode" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
