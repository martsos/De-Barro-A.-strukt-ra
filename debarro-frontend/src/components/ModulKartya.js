import { useNavigate } from "react-router-dom";
import "./ModulKartya.css";

function ModulKartya({ icon, nev, leiras, utvonal, aktiv }) {
  const navigate = useNavigate();

  return (
    <div
      className={`modul-card ${aktiv ? "modul-card--aktiv" : "modul-card--inaktiv"}`}
      onClick={() => aktiv && navigate(utvonal)}
      title={!aktiv ? "Hamarosan elérhető" : nev}
    >
      <div className="modul-card-inner">
        <div className="modul-card-icon">{icon}</div>
        <div className="modul-card-nev">{nev}</div>
        <div className="modul-card-leiras">{leiras}</div>
        {!aktiv && <div className="modul-card-hamarosan">🔒 Hamarosan</div>}
      </div>
    </div>
  );
}

export default ModulKartya;
