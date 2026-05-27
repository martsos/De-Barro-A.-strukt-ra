import ModulKartya from "../components/ModulKartya";
import "./ModulValaszto.css";

const modulok = [
  {
    icon: "⛽",
    nev: "Üzemanyag",
    leiras: "Kiadás, mozgás, bevételezés, tartályok",
    utvonal: "/uzemanyag",
    aktiv: true,
  },
  {
    icon: "👥",
    nev: "Humán",
    leiras: "Személyzet, munkaidő, bérszámfejtés",
    utvonal: "/hr",
    aktiv: true,
  },
  {
    icon: "💰",
    nev: "Pénzügy",
    leiras: "Számlák, költségek, kimutatások",
    utvonal: "/penzugy",
    aktiv: true,
  },
  {
    icon: "⚙️",
    nev: "Admin",
    leiras: "Rendszerbeállítások, jogosultságok",
    utvonal: "/admin",
    aktiv: true,
  },
];

function ModulValaszto() {
  return (
    <div className="modul-valaszto">
      <header className="modul-header">
        <div className="modul-header-brand">
          <span className="modul-header-logo">⛽</span>
          <div>
            <span className="modul-header-title">De Barro</span>
            <span className="modul-header-sub">Válassz modult</span>
          </div>
        </div>
        <div className="modul-header-user">👤 Admin</div>
      </header>

      <main className="modul-grid-wrapper">
        <div className="modul-grid">
          {modulok.map((m) => (
            <ModulKartya key={m.nev} {...m} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default ModulValaszto;
