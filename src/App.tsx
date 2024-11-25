import { BrowserRouter, Routes, Route } from "react-router-dom";
import GameLobby from "./components/GameLobby";
import GameRoom from "./components/GameRoom";

function App() {
  return (
    <BrowserRouter
      basename={process.env.NODE_ENV === "production" ? "/no-thanks" : "/"}
    >
      <Routes>
        <Route path="/" element={<GameLobby />} />
        <Route path="/room/:code" element={<GameRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
