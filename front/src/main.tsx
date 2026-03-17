import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SessionProvider } from "./auth/SessionProvider";
import { ThemeProvider } from "./theme/ThemeProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SessionProvider>
        <App />
      </SessionProvider>
    </ThemeProvider>
  </StrictMode>,
);
