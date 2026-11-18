import { createRoot } from "react-dom/client";
import AuthPage from "./pages/AuthPage";
import "./styles/index.css";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<AuthPage />);
}