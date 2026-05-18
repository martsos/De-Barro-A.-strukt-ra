import { useState, useEffect } from "react";
import { Progress, Row, Col, Typography, Spin } from "antd";
import { API } from "./api";
import "./shared.css";
import "./Dashboard.css";

const { Text } = Typography;

function Dashboard() {
  const [tanks,   setTanks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/tartaly`).then(r => r.json()),
      fetch(`${API}/keszlet`).then(r => r.json()),
    ]).then(([tartalyok, keszlet]) => {
      setTanks(
        tartalyok.map(t => {
          const k = keszlet.find(k => k.tartaly_id === t.tartaly_id);
          return {
            ...t,
            aktualis_liter: k ? parseFloat(k.aktualis_liter) : 0,
            utolso_mozgas:  k ? k.utolso_mozgas : null,
          };
        })
      );
      setLoading(false);
    });
  }, []);

  const totalKeszlet = tanks.reduce((s, t) => s + t.aktualis_liter, 0);
  const totalKapacitas = tanks.reduce((s, t) => s + parseFloat(t.befogado_kepesseg_l), 0);
  const totalPct = totalKapacitas > 0
    ? Math.min(100, Math.round((totalKeszlet / totalKapacitas) * 100))
    : 0;

  return (
    <div className="db-border db-wide">
      <div className="db-shell">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="db-header">
          <div>
            <Text className="db-eyebrow">De Barro · Üzemanyag-nyilvántartás</Text>
            <div style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 20 }}>
              Készlet Áttekintés
            </div>
          </div>
          <span className="db-badge">🏠</span>
        </div>

        {/* ── SUMMARY STRIP ──────────────────────────────── */}
        {!loading && (
          <div className="dash-summary">
            <div className="dash-summary-stat">
              <Text className="dash-summary-label">Összes készlet</Text>
              <Text className="dash-summary-value">
                {totalKeszlet.toLocaleString("hu-HU")} L
              </Text>
            </div>
            <div className="dash-summary-stat">
              <Text className="dash-summary-label">Összes kapacitás</Text>
              <Text className="dash-summary-value">
                {totalKapacitas.toLocaleString("hu-HU")} L
              </Text>
            </div>
            <div className="dash-summary-stat">
              <Text className="dash-summary-label">Töltöttség</Text>
              <Text className="dash-summary-value" style={{
                color: totalPct < 10 ? "#ff4d4f" : totalPct < 30 ? "#faad14" : "#52c41a"
              }}>
                {totalPct}%
              </Text>
            </div>
            <div className="dash-summary-stat">
              <Text className="dash-summary-label">Tartályok</Text>
              <Text className="dash-summary-value">{tanks.length}</Text>
            </div>
          </div>
        )}

        {/* ── TANK GRID ──────────────────────────────────── */}
        <div className="dash-body">
          {loading ? (
            <Spin size="large" style={{ display: "block", margin: "60px auto" }} />
          ) : (
            <Row gutter={[16, 16]}>
              {tanks.map(tank => {
                const kapacitas = parseFloat(tank.befogado_kepesseg_l);
                const aktualis  = tank.aktualis_liter;
                const pct  = kapacitas > 0
                  ? Math.min(100, Math.round((aktualis / kapacitas) * 100))
                  : 0;
                const szin = pct < 10 ? "#ff4d4f" : pct < 30 ? "#faad14" : "#52c41a";

                return (
                  <Col xs={24} sm={12} lg={8} key={tank.tartaly_id}>
                    <div className="dash-tank-card">
                      <div className="dash-tank-inner">

                        {/* Card header */}
                        <div className="dash-card-head">
                          <span className="dash-tank-name">{tank.tartaly_szam}</span>
                          <span className="dash-tank-type">{tank.tartaly_tipus}</span>
                        </div>

                        {/* Material */}
                        <Text className="dash-anyag">{tank.anyag_megnevezes}</Text>

                        {/* Percentage */}
                        <div className="dash-pct-row">
                          <span className="dash-pct-number" style={{ color: szin }}>
                            {pct}%
                          </span>
                        </div>

                        {/* Progress bar */}
                        <Progress
                          percent={pct}
                          strokeColor={szin}
                          showInfo={false}
                          size={["100%", 6]}
                          style={{ margin: 0 }}
                        />

                        {/* Stats row */}
                        <div className="dash-stats">
                          <div className="dash-stat-col">
                            <Text className="dash-stat-value" style={{ color: szin }}>
                              {aktualis.toLocaleString("hu-HU")} L
                            </Text>
                            <Text className="dash-stat-label">aktuális</Text>
                          </div>
                          <div className="dash-stat-col" style={{ textAlign: "right" }}>
                            <Text className="dash-stat-value">
                              {kapacitas.toLocaleString("hu-HU")} L
                            </Text>
                            <Text className="dash-stat-label">kapacitás</Text>
                          </div>
                        </div>

                        {/* Last movement */}
                        {tank.utolso_mozgas && (
                          <Text className="dash-last-move">
                            Utolsó: {tank.utolso_mozgas}
                          </Text>
                        )}

                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
