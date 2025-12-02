import React from "react";
import ReactDOM from "react-dom/client";
import {StelliveThemeProvider} from "@stellive/ui";
import {initAnalytics} from "./analytics";
import App from "./App";
import "./styles.css";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID ?? "G-LN9LN30S0S";

initAnalytics(measurementId);

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
