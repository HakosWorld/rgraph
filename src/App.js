import React from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import { HashRouter, Routes, Route } from "react-router-dom";


function App() {
    return (
<HashRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/" element={<LoginPage />} /> {/* Default route */}
  </Routes>
</HashRouter>
    );
}

export default App;