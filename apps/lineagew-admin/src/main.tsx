import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {initAnalytics} from "./analytics";
import App from "./App";

import "./styles.css";

const basename = import.meta.env.VITE_APP_BASE ?? "/linw";

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID ?? "G-LN9LN30S0S";

initAnalytics(measurementId);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
