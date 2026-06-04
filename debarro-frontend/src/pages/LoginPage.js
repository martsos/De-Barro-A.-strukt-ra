import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Input } from "antd";
import Lottie from "lottie-react";
import { API } from "../api";
import constructionAnimation from "../assets/construction3.json";
import "./LoginPage.css";

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
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail);
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: data.username,
          nev: data.nev,
          szerepkor: data.szerepkor,
          modul: data.modul,
          tier: data.tier,
        })
      );

      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <span className="login-brand-icon">🏗️</span>
          <h1 className="login-brand-title">De Barro Kft.</h1>
          <p className="login-brand-subtitle">Vállalatirányítási Rendszer</p>
        </div>
         <div className="login-lottie-wrap">
          <Lottie animationData={constructionAnimation} loop={true} />
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-card-title">Bejelentkezés</h2>
          </div>

          <div className="login-form">
            {error && (
              <Alert
                type="error"
                message={error}
                showIcon
                className="login-alert"
              />
            )}

            <div className="login-field">
              <label className="login-label">Felhasználónév</label>
              <Input
                size="large"
                placeholder="Felhasználónév"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onPressEnter={handleLogin}
              />
            </div>

            <div className="login-field">
              <label className="login-label">Jelszó</label>
              <Input.Password
                size="large"
                placeholder="Jelszó"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onPressEnter={handleLogin}
              />
            </div>

            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handleLogin}
              className="login-btn"
            >
              {!loading && "Belépés"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
