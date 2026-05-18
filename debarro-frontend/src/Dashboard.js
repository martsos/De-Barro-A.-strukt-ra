import { useState, useEffect } from "react";
import { Card, Progress, Row, Col, Typography, Spin, Tag } from "antd";
import { API } from "./api";

const { Title, Text } = Typography;

function Dashboard() {
  const [tanks, setTanks] = useState([]);
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

  if (loading) {
    return <Spin size="large" style={{ display: "block", margin: "80px auto" }} />;
  }

  return (
    <Card style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Title level={3}>Készlet áttekintés</Title>
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
              <Card
                title={tank.tartaly_szam}
                extra={<Tag>{tank.tartaly_tipus}</Tag>}
                size="small"
              >
                <Text type="secondary">{tank.anyag_megnevezes}</Text>
                <Progress
                  percent={pct}
                  strokeColor={szin}
                  style={{ marginTop: 8, marginBottom: 4 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text strong>{aktualis.toLocaleString("hu-HU")} L</Text>
                  <Text type="secondary">max: {kapacitas.toLocaleString("hu-HU")} L</Text>
                </div>
                {tank.utolso_mozgas && (
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Utolsó mozgás: {tank.utolso_mozgas}
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}

export default Dashboard;