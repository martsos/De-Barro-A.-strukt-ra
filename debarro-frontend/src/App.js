import { useState } from "react";
import { ConfigProvider, theme, Button } from "antd";
import Bevetelezesform from "./Bevetelezesform.js";
import Kiadasform from "./Kiadasform.js";
import Mozgasform from "./Mozgasform.js";
import Tranzakciok from "./Tranzakciok.js";
import Dashboard from "./Dashboard.js";

const pages = ["dashboard", "kiadas", "mozgas", "bevet", "tortenelem"];

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const currentIndex = pages.indexOf(activePage);
  const balOldal = pages[(currentIndex - 1 + pages.length) % pages.length];
  const jobbOldal = pages[(currentIndex + 1) % pages.length];

  const pageLabels = {
    dashboard: "📊 Dashboard",
    kiadas: "⛽ Kiadás",
    mozgas: "🔄 Mozgás",
    bevet: "📥 Bevételezés",
    tortenelem: "📋 Előzmények",
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div style={{ minHeight: "100vh", background: "#141414", padding: "40px 10px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, maxWidth: 1200, margin: "0 auto" }}>

          {/* BAL GOMB */}
          <Button
            type="default"
            style={{ marginTop: 300, height: 150, width: 150, fontSize: 60 }}
            onClick={() => setActivePage(balOldal)}
          >
            <span style={{ fontSize: 14 }}>{pageLabels[balOldal]}</span>
          </Button>

          {/* FORM */}
          <div style={{ flex: 1 }}>
            {activePage === "dashboard" && <Dashboard />}
            {activePage === "kiadas" && <Kiadasform />}
            {activePage === "mozgas" && <Mozgasform />}
            {activePage === "bevet" && <Bevetelezesform />}
            {activePage === "tortenelem" && <Tranzakciok />}
          </div>

          {/* JOBB GOMB */}
          <Button
            type="default"
            style={{ marginTop: 300, height: 150, width: 150, fontSize: 60 }}
            onClick={() => setActivePage(jobbOldal)}
          >
            <span style={{ fontSize: 14 }}>{pageLabels[jobbOldal]}</span>
          </Button>

        </div>
      </div>
    </ConfigProvider>
  );
}

export default App;