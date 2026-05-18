import { useState, useEffect } from "react";
import {
  Form, Select, DatePicker, InputNumber, Button, Alert,
  Typography, Row, Col, Progress, Divider,
} from "antd";
import dayjs from "dayjs";
import { API } from "./api";
import "./Kiadasform.css";

const { Title, Text } = Typography;

function Kiadasform() {
  const [tartalyok,        setTartalyok]        = useState([]);
  const [alkalmazottak,    setAlkalmazottak]    = useState([]);
  const [jarművek,         setJarművek]         = useState([]);
  const [jarmuvekAllapot,  setJarmuvekAllapot]  = useState([]);
  const [aktualisKeszlet,  setAktualisKeszlet]  = useState(null);
  const [tartalyKapacitas, setTartalyKapacitas] = useState(null);
  const [vehicleInfo,      setVehicleInfo]      = useState(null);
  const [eredmeny,         setEredmeny]         = useState(null);
  const [loading,          setLoading]          = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch(`${API}/tartaly`).then(r => r.json()).then(setTartalyok);
    fetch(`${API}/alkalmazott`).then(r => r.json()).then(setAlkalmazottak);
    fetch(`${API}/jarmu`).then(r => r.json()).then(setJarművek);
    fetch(`${API}/jarmuvek-allapot`).then(r => r.json()).then(setJarmuvekAllapot);
  }, []);

  const onTaralyChange = (value) => {
    const tartaly = tartalyok.find(t => t.tartaly_szam === value);
    if (tartaly) setTartalyKapacitas(parseFloat(tartaly.befogado_kepesseg_l));
    fetch(`${API}/keszlet`)
      .then(r => r.json())
      .then(data => {
        const keszlet = data.find(k => k.tartaly_id === tartaly?.tartaly_id);
        setAktualisKeszlet(keszlet ? parseFloat(keszlet.aktualis_liter) : 0);
      });
  };

  const onJarmuChange = (value) => {
    const jarmu = jarművek.find(j => j.rendszam === value);
    if (!jarmu) return;
    const allapot = jarmuvekAllapot.find(j => j.eszkoz_sk === jarmu.eszkoz_sk);
    if (allapot) {
      form.setFieldValue("km_eloz", allapot.aktualis_km);
      form.setFieldValue("gepuzemora_eloz", allapot.aktualis_uzemora);
      setVehicleInfo({ km: allapot.aktualis_km, uzemora: allapot.aktualis_uzemora });
    } else {
      setVehicleInfo(null);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      datum:             values.datum.format("YYYY-MM-DD"),
      kiado_szemely_nev: values.kiado_szemely_nev,
      gepkezelo_nev:     values.gepkezelo_nev,
      tartaly_szam:      values.tartaly_szam,
      rendszam:          values.rendszam,
      gepuzemora_eloz:   values.gepuzemora_eloz  || null,
      gepuzemora_akt:    values.gepuzemora_akt    || null,
      km_eloz:           values.km_eloz           || null,
      km_akt:            values.km_akt             || null,
      pisztoly_oraallas: values.pisztoly_oraallas  || null,
      kiadott_liter:     values.kiadott_liter,
    };

    const res  = await fetch(`${API}/keszlet-kiadas`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    setEredmeny(data);

    if (data.ervenyes) {
      form.resetFields();
      form.setFieldValue("datum", dayjs());
      setAktualisKeszlet(null);
      setTartalyKapacitas(null);
      setVehicleInfo(null);
      fetch(`${API}/jarmuvek-allapot`).then(r => r.json()).then(setJarmuvekAllapot);
    }
    setLoading(false);
  };

  // Tank fill level
  const tankPct = aktualisKeszlet !== null && tartalyKapacitas
    ? Math.min(100, Math.round((aktualisKeszlet / tartalyKapacitas) * 100))
    : null;
  const tankColor = tankPct === null  ? "#52c41a"
    : tankPct < 10                    ? "#ff4d4f"
    : tankPct < 30                    ? "#faad14"
    :                                   "#52c41a";

  return (
    <div className="kd-border">
      <div className="kd-shell">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="kd-header">
          <div>
            <Text className="kd-eyebrow">De Barro · Üzemanyag-kiadás</Text>
            <Title level={3} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
              Készlet Kiadás
            </Title>
          </div>
          <span className="kd-badge">⛽</span>
        </div>

        {/* ── DATE ───────────────────────────────────────── */}
        <div className="kd-date-row">
          <Form form={form} layout="vertical" onFinish={onFinish} className="kd-form"
            style={{ padding: 0 }}>
            <Form.Item name="datum" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
              <DatePicker
                style={{ width: "100%", height: 40 }}
                defaultValue={dayjs()}
                format="YYYY. MMMM D. (dddd)"
                placeholder="Dátum kiválasztása"
              />
            </Form.Item>
          </Form>
        </div>

        {/* ── MAIN FORM ──────────────────────────────────── */}
        {/*
          We need one Form that wraps everything, including the DatePicker above.
          The approach: render the entire Form here, but split the visual sections.
          Since JSX renders sequentially we achieve the layout via the structure below.
        */}
        <Form form={form} layout="vertical" onFinish={onFinish} className="kd-form">

          {/* Hidden duplicate — datum is declared above in its own Form; this is the real one */}
          {/* Actually: we cannot have two Forms. Instead, we inline everything in one Form. */}

          {/* SECTION: SZEMÉLYEK */}
          <div className="kd-section">Személyek</div>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Kiadó személy" name="kiado_szemely_nev" rules={[{ required: true }]}>
                <Select placeholder="— válassz —">
                  {alkalmazottak.map(a => (
                    <Select.Option key={a.foglalkoztatott_id} value={a.foglalkoztatott_nev}>
                      {a.foglalkoztatott_nev}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Gépkezelő" name="gepkezelo_nev" rules={[{ required: true }]}>
                <Select placeholder="— válassz —">
                  {alkalmazottak.map(a => (
                    <Select.Option key={a.foglalkoztatott_id} value={a.foglalkoztatott_nev}>
                      {a.foglalkoztatott_nev}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* SECTION: TARTÁLY */}
          <div className="kd-section">Tartály</div>
          <Form.Item name="tartaly_szam" rules={[{ required: true }]}
            style={{ marginBottom: tankPct !== null ? 10 : 16 }}>
            <Select placeholder="— válassz tartályt —" onChange={onTaralyChange}>
              {tartalyok.map(t => (
                <Select.Option key={t.tartaly_id} value={t.tartaly_szam}>
                  {t.tartaly_szam} · {t.tartaly_tipus}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {tankPct !== null && (
            <div className="kd-tank-bar">
              <div className="kd-tank-meta">
                <Text className="kd-tank-meta-label">Aktuális készlet</Text>
                <span>
                  <Text className="kd-tank-meta-value" style={{ color: tankColor }}>
                    {aktualisKeszlet?.toLocaleString("hu-HU")} L
                  </Text>
                  <Text className="kd-tank-meta-max">
                    {" "}/ {tartalyKapacitas?.toLocaleString("hu-HU")} L
                  </Text>
                </span>
              </div>
              <Progress
                percent={tankPct}
                strokeColor={tankColor}
                showInfo={false}
                size={["100%", 5]}
                style={{ margin: 0 }}
              />
            </div>
          )}

          {/* SECTION: JÁRMŰ */}
          <div className="kd-section" style={{ marginTop: tankPct !== null ? 22 : 0 }}>
            Jármű
          </div>
          <Form.Item name="rendszam" rules={[{ required: true }]}
            style={{ marginBottom: vehicleInfo ? 10 : 16 }}>
            <Select placeholder="— válassz járművet —" onChange={onJarmuChange}>
              {jarművek.map(j => (
                <Select.Option key={j.eszkoz_sk} value={j.rendszam}>
                  {j.rendszam} — {j.megnevezes}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {vehicleInfo && (
            <div className="kd-vehicle-chip">
              <div className="kd-vehicle-stat">
                <Text className="kd-chip-label">Utolsó KM</Text>
                <Text className="kd-chip-value">
                  {vehicleInfo.km != null ? Number(vehicleInfo.km).toLocaleString("hu-HU") : "—"}
                </Text>
              </div>
              <div className="kd-chip-divider" />
              <div className="kd-vehicle-stat">
                <Text className="kd-chip-label">Üzemóra</Text>
                <Text className="kd-chip-value">
                  {vehicleInfo.uzemora != null ? Number(vehicleInfo.uzemora).toLocaleString("hu-HU") : "—"}
                </Text>
              </div>
            </div>
          )}

          {/* SECTION: MÉRŐADATOK */}
          <div className="kd-section" style={{ marginTop: vehicleInfo ? 22 : 0 }}>
            Mérőadatok
          </div>
          <Row gutter={12}>
            <Col span={11}>
              <Form.Item label="KM előző" name="km_eloz">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={2}>
              <div className="kd-arrow">→</div>
            </Col>
            <Col span={11}>
              <Form.Item label="KM aktuális" name="km_akt">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={11}>
              <Form.Item label="Üzemóra előző" name="gepuzemora_eloz">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={2}>
              <div className="kd-arrow">→</div>
            </Col>
            <Col span={11}>
              <Form.Item label="Üzemóra aktuális" name="gepuzemora_akt">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Pisztoly óraállás" name="pisztoly_oraallas">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          {/* FEATURED: KIADOTT LITER */}
          <Divider style={{ borderColor: "rgba(249,115,22,0.15)", margin: "20px 0 16px" }} />
          <div className="kd-liter-wrap">
            <Text className="kd-liter-label">Kiadott mennyiség</Text>
            <Form.Item name="kiadott_liter" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="0"
                addonAfter={<span className="kd-liter-addon">L</span>}
              />
            </Form.Item>
          </div>

          {/* SUBMIT */}
          <Form.Item style={{ marginTop: 20, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="kd-submit"
            >
              {loading ? "Rögzítés…" : "Kiadás rögzítése"}
            </Button>
          </Form.Item>

        </Form>

        {/* RESULT */}
        {eredmeny && (
          <div className="kd-result">
            <Alert
              message={
                eredmeny.ervenyes && !eredmeny.hiba_uzenet ? "Sikeres rögzítés" :
                eredmeny.ervenyes &&  eredmeny.hiba_uzenet ? "Rögzítve — Figyelmeztetés" :
                "Hiba — Nem rögzítve"
              }
              description={
                <div>
                  <span>Kiadás azonosító: #{eredmeny.kiadas_id}</span>
                  {eredmeny.hiba_uzenet && (
                    <p style={{ margin: "4px 0 0", fontSize: 12 }}>{eredmeny.hiba_uzenet}</p>
                  )}
                </div>
              }
              type={
                eredmeny.ervenyes && !eredmeny.hiba_uzenet ? "success" :
                eredmeny.ervenyes &&  eredmeny.hiba_uzenet ? "warning" :
                "error"
              }
              showIcon
            />
          </div>
        )}

      </div>
    </div>
  );
}

export default Kiadasform;
