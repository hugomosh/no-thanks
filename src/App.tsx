import { BrowserRouter, Routes, Route } from "react-router-dom";
import GameLobby from "./components/GameLobby";
import NoThanksGameUI from "./components/NoThanksGameUI";

function App() {
  return (
    <BrowserRouter basename={process.env.NODE_ENV === "production" ? "/no-thanks" : "/"}>
      <Routes>
        <Route path="/" element={<GameLobby />} />
        <Route path="/room/:roomId" element={<NoThanksGameUI />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
