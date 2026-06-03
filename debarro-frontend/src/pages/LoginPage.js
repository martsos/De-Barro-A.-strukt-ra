import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../api";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.detail);
        return;
      }
      
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify({
        username: data.username,
        nev: data.nev,
        szerepkor: data.szerepkor,
        modul: data.modul,
        tier: data.tier
      }));
      
      navigate("/");
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        
        <div className="login-header">
          <span>🏗️</span>
          <h2>De Barro</h2>
          <p>Vállaltirányítási rendszer</p>
        </div>

        {error && (
          <div className="login-error">{error}</div>
        )}

        <input
          type="text"
          placeholder="Felhasználónév"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        
        <input
          type="password"
          placeholder="Jelszó"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Bejelentkezés..." : "Belépés"}
        </button>

      </div>
    </div>
  );
}

export default LoginPage;