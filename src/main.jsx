import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { ComputerPreview } from "./ComputerPreview.jsx";
import "./styles.css";

const search = new URLSearchParams(window.location.search);
const rootView = search.get("preview") === "computer3d" ? <ComputerPreview /> : <App />;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {rootView}
  </React.StrictMode>,
);
