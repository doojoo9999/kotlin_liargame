import React from "react";
import ReactDOM from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

import {initAnalytics} from "./analytics";
import App from "./App";
import "./styles.css";

const queryClient = new QueryClient();
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID ?? "G-LN9LN30S0S";

initAnalytics(measurementId);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/dnf">
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
