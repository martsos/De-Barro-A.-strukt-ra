import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "../../App.css";
import "./UzemanyagLayout.css";

const navItems = [
  { label: "🏠 Áttekintés",  path: "/uzemanyag" },
  { label: "⛽ Kiadás",      path: "/uzemanyag/kiadas" },
  { label: "🔄 Mozgás",      path: "/uzemanyag/mozgas" },
  { label: "📥 Bevételezés", path: "/uzemanyag/bevet" },
  { label: "📋 Előzmények",  path: "/uzemanyag/elozmeny" },
];

function UzemanyagLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: "#141414" }}>
      <nav className="app-nav">
        <div className="app-nav-brand">
          <button className="ua-back-btn" onClick={() => navigate("/")}>
            ← Főoldal
          </button>
          <span className="app-nav-logo">⛽</span>
          <div>
            <span className="app-nav-title">De Barro</span>
            <span className="app-nav-sub">Üzemanyag-nyilvántartás</span>
          </div>
        </div>
        <div className="app-nav-items">
          {navItems.map(({ label, path }) => {
            const isActive =
              path === "/uzemanyag"
                ? location.pathname === "/uzemanyag" || location.pathname === "/uzemanyag/"
                : location.pathname.startsWith(path);
            return (
              <button
                key={path}
                className={`app-nav-item${isActive ? " active" : ""}`}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}

export default UzemanyagLayout;
