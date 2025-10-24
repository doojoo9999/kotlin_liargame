import React from "react";
import ReactDOM from "react-dom/client";
import {StelliveThemeProvider} from "@stellive/ui";
import App from "./App";
import "./styles.css";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StelliveThemeProvider
      theme="dark"
      attachToDocument
      reducedMotion={prefersReducedMotion}
    >
      <App />
    </StelliveThemeProvider>
  </React.StrictMode>
);
