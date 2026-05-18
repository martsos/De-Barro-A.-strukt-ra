import { useState } from "react";
import { ConfigProvider, theme } from "antd";
import Bevetelezesform from "./Bevetelezesform.js";
import Kiadasform from "./Kiadasform.js";
import Mozgasform from "./Mozgasform.js";
import Tranzakciok from "./Tranzakciok.js";
import Dashboard from "./Dashboard.js";
import "./App.css";

const pages = ["dashboard", "kiadas", "mozgas", "bevet", "tortenelem"];

const pageLabels = {
  dashboard:  "🏠 Áttekintés",
  kiadas:     "⛽ Kiadás",
  mozgas:     "🔄 Mozgás",
  bevet:      "📥 Bevételezés",
  tortenelem: "📋 Előzmények",
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div style={{ minHeight: "100vh", background: "#141414" }}>

        <nav className="app-nav">
          <div className="app-nav-brand">
            <span className="app-nav-logo">⛽</span>
            <div>
              <span className="app-nav-title">De Barro</span>
              <span className="app-nav-sub">Üzemanyag-nyilvántartás</span>
            </div>
          </div>
          <div className="app-nav-items">
            {pages.map(page => (
              <button
                key={page}
                className={`app-nav-item${activePage === page ? " active" : ""}`}
                onClick={() => setActivePage(page)}
              >
                {pageLabels[page]}
              </button>
            ))}
          </div>
        </nav>

        <div className="app-content">
          {activePage === "dashboard"  && <Dashboard />}
          {activePage === "kiadas"     && <Kiadasform />}
          {activePage === "mozgas"     && <Mozgasform />}
          {activePage === "bevet"      && <Bevetelezesform />}
          {activePage === "tortenelem" && <Tranzakciok />}
        </div>

      </div>
    </ConfigProvider>
  );
}

export default App;
