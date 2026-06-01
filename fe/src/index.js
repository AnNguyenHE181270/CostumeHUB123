// index.js (hoặc main.jsx)
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/AuthContext"; // <-- BẮT BUỘC PHẢI CÓ

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
      <BrowserRouter>
        <AuthProvider> {/* <-- BẮT BUỘC PHẢI BỌC Ở ĐÂY */}
          <App />
        </AuthProvider>
      </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();