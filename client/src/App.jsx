import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Landing from "./pages/Landing";
import ThemeToggle from "./components/ThemeToggle";

export default function App() {
  const location = useLocation();
  const token = localStorage.getItem("token");

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}