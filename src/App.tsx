import { BrowserRouter, Routes, Route } from "react-router-dom";
import GameLobby from "./components/GameLobby";

function App() {
  return (
    <BrowserRouter
      basename={process.env.NODE_ENV === "production" ? "/no-thanks" : "/"}
    >
      <Routes>
        <Route path="/" element={<GameLobby />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
