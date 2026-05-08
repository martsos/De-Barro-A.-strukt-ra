import { useState, useEffect } from "react";

function App() {
  const [tartalyok, setTartalyok] = useState([]);
  const [alkalmazottak, setAlkalmazottak] = useState([]);
  const [cegek, setCegek] = useState([]);
  const [form, setForm] = useState({
    datum: "",
    tartaly_szam: "",
    atvevo_nev: "",
    szallito_nev: "",
    kezdo_liter: "",
    bejovo_liter: "",
    zaro_liter: "",
    egysegar: "",
    szamla_szam: "",
  });
  const [eredmeny, setEredmeny] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/tartaly")
      .then((r) => r.json())
      .then(setTartalyok);
    fetch("http://localhost:8000/alkalmazott")
      .then((r) => r.json())
      .then(setAlkalmazottak);
    fetch("http://localhost:8000/cegek")
      .then((r) => r.json())
      .then(setCegek);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      kezdo_liter: parseFloat(form.kezdo_liter),
      bejovo_liter: parseFloat(form.bejovo_liter),
      zaro_liter: parseFloat(form.zaro_liter),
      egysegar: parseFloat(form.egysegar),
    };
    const res = await fetch("http://localhost:8000/keszlet-bevet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setEredmeny(data);
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Készlet Bevételezés</h2>

      <label>Dátum</label>
      <input type="date" name="datum" onChange={handleChange} style={input} />

      <label>Tartály</label>
      <select name="tartaly_szam" onChange={handleChange} style={input}>
        <option value="">-- válassz --</option>
        {tartalyok.map((t) => (
          <option key={t.tartaly_id} value={t.tartaly_szam}>
            {t.tartaly_szam} ({t.tartaly_tipus})
          </option>
        ))}
      </select>

      <label>Átvevő</label>
      <select name="atvevo_nev" onChange={handleChange} style={input}>
        <option value="">-- válassz --</option>
        {alkalmazottak.map((a) => (
          <option key={a.foglalkoztatott_id} value={a.foglalkoztatott_nev}>
            {a.foglalkoztatott_nev}
          </option>
        ))}
      </select>

      <label>Szállító</label>
      <select name="szallito_nev" onChange={handleChange} style={input}>
        <option value="">-- válassz --</option>
        {cegek.map((c) => (
          <option key={c.ceg_id} value={c.ceg_nev}>
            {c.ceg_nev}
          </option>
        ))}
      </select>

      <label>Kezdő liter</label>
      <input type="number" name="kezdo_liter" onChange={handleChange} style={input} />

      <label>Bejövő liter</label>
      <input type="number" name="bejovo_liter" onChange={handleChange} style={input} />

      <label>Záró liter</label>
      <input type="number" name="zaro_liter" onChange={handleChange} style={input} />

      <label>Egységár</label>
      <input type="number" name="egysegar" onChange={handleChange} style={input} />

      <label>Számla szám</label>
      <input type="text" name="szamla_szam" onChange={handleChange} style={input} />

      <button onClick={handleSubmit} style={btn}>Bevételezés rögzítése</button>

      {eredmeny && (
        <div style={{
          marginTop: 20,
          padding: 15,
          borderRadius: 8,
          background: eredmeny.ervenyes ? "#e6ffe6" : "#ffe6e6",
          border: `1px solid ${eredmeny.ervenyes ? "green" : "red"}`
        }}>
          <b>{eredmeny.ervenyes ? "✅ Sikeres rögzítés" : "❌ Hiba"}</b>
          <p>ID: {eredmeny.bevet_id}</p>
          {eredmeny.hiba_uzenet && <p>{eredmeny.hiba_uzenet}</p>}
        </div>
      )}
    </div>
  );
}

const input = {
  display: "block", width: "100%", marginBottom: 12,
  padding: 8, borderRadius: 4, border: "1px solid #ccc"
};

const btn = {
  width: "100%", padding: 10, background: "#2563eb",
  color: "white", border: "none", borderRadius: 4,
  cursor: "pointer", fontSize: 16
};

export default App;
