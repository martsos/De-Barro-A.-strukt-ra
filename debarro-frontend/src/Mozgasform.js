import { useState, useEffect } from "react";
import {
  Form, Select, DatePicker, InputNumber, Button, Alert,
  Typography, Progress, Divider,
} from "antd";
import dayjs from "dayjs";
import { API } from "./api";
import "./shared.css";
import "./Mozgasform.css";

const { Title, Text } = Typography;

function Mozgasform() {
  const [tartalyok,         setTartalyok]         = useState([]);
  const [alkalmazottak,     setAlkalmazottak]     = useState([]);
  const [forrasKeszlet,     setForrasKeszlet]     = useState(null);
  const [forrasMaxKapacitas,setForrasMaxKapacitas]= useState(null);
  const [forrasAnyag,       setForrasAnyag]       = useState(null);
  const [celKeszlet,        setCelKeszlet]        = useState(null);
  const [celMaxKapacitas,   setCelMaxKapacitas]   = useState(null);
  const [eredmeny,          setEredmeny]          = useState(null);
  const [loading,           setLoading]           = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch(`${API}/tartaly`).then(r => r.json()).then(setTartalyok);
    fetch(`${API}/alkalmazott`).then(r => r.json()).then(setAlkalmazottak);
  }, []);

  const getKeszlet = (tartaly_szam) =>
    fetch(`${API}/keszlet`)
      .then(r => r.json())
      .then(data => {
        const tartaly = tartalyok.find(t => t.tartaly_szam === tartaly_szam);
        if (!tartaly) return null;
        const keszlet = data.find(k => k.tartaly_id === tartaly.tartaly_id);
        return {
          aktualis: keszlet ? parseFloat(keszlet.aktualis_liter) : 0,
          max:      parseFloat(tartaly.befogado_kepesseg_l),
        };
      });

  const onForrasTaralyChange = (value) => {
    const tartaly = tartalyok.find(t => t.tartaly_szam === value);
    setForrasAnyag(tartaly?.anyag_megnevezes || null);
    getKeszlet(value).then(k => {
      if (k) {
        setForrasKeszlet(k.aktualis);
        setForrasMaxKapacitas(k.max);
      }
    });
  };

  const onCelTaralyChange = (value) => {
    getKeszlet(value).then(k => {
      if (k) {
        setCelKeszlet(k.aktualis);
        setCelMaxKapacitas(k.max);
      }
    });
  };

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      datum:               values.datum.format("YYYY-MM-DD"),
      felvevo_nev:         values.felvevo_nev,
      forras_tartaly_szam: values.forras_tartaly_szam,
      cel_tartaly_szam:    values.cel_tartaly_szam,
      anyag_megnevezes:    tartalyok.find(t => t.tartaly_szam === values.forras_tartaly_szam)?.anyag_megnevezes || "",
      mozgatott_liter:     values.mozgatott_liter,
    };

    const res  = await fetch(`${API}/keszlet-mozgas`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    setEredmeny(data);

    if (data.ervenyes) {
      form.resetFields();
      form.setFieldValue("datum", dayjs());
      setForrasKeszlet(null);
      setForrasMaxKapacitas(null);
      setForrasAnyag(null);
      setCelKeszlet(null);
      setCelMaxKapacitas(null);
    }
    setLoading(false);
  };

  const forrasPct = forrasKeszlet !== null && forrasMaxKapacitas
    ? Math.min(100, Math.round((forrasKeszlet / forrasMaxKapacitas) * 100))
    : null;
  const forrasColor = forrasPct === null  ? "#52c41a"
    : forrasPct < 10                      ? "#ff4d4f"
    : forrasPct < 30                      ? "#faad14"
    :                                       "#52c41a";

  const showForras = forrasKeszlet !== null;
  const showCel    = celKeszlet !== null || celMaxKapacitas !== null;

  return (
    <div className="db-border">
      <div className="db-shell">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="db-header">
          <div>
            <Text className="db-eyebrow">De Barro · Készlet-mozgás</Text>
            <Title level={3} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
              Készlet Mozgás
            </Title>
          </div>
          <span className="db-badge">🔄</span>
        </div>

        {/* ── DATE ───────────────────────────────────────── */}
        <div className="db-date-row">
          <Form form={form} layout="vertical" onFinish={onFinish} style={{ padding: 0 }}>
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
        <Form form={form} layout="vertical" onFinish={onFinish} className="db-form">

          {/* SECTION: FELVEVŐ */}
          <div className="db-section">Felvevő</div>
          <Form.Item name="felvevo_nev" rules={[{ required: true }]}>
            <Select placeholder="— válassz —">
              {alkalmazottak.map(a => (
                <Select.Option key={a.foglalkoztatott_id} value={a.foglalkoztatott_nev}>
                  {a.foglalkoztatott_nev}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* SECTION: FORRÁS TARTÁLY */}
          <div className="db-section">Forrás tartály</div>
          <Form.Item name="forras_tartaly_szam" rules={[{ required: true }]}
            style={{ marginBottom: showForras ? 10 : 16 }}>
            <Select placeholder="— válassz tartályt —" onChange={onForrasTaralyChange}>
              {tartalyok.map(t => (
                <Select.Option key={t.tartaly_id} value={t.tartaly_szam}>
                  {t.tartaly_szam} · {t.tartaly_tipus}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {showForras && (
            <div className="db-tank-bar">
              {forrasAnyag && (
                <div className="mf-anyag-row">
                  <Text className="db-tank-meta-label">Anyag</Text>
                  <Text className="mf-anyag-value">{forrasAnyag}</Text>
                </div>
              )}
              <div className="db-tank-meta">
                <Text className="db-tank-meta-label">Aktuális készlet</Text>
                <span>
                  <Text className="db-tank-meta-value" style={{ color: forrasColor }}>
                    {forrasKeszlet?.toLocaleString("hu-HU")} L
                  </Text>
                  <Text className="db-tank-meta-max">
                    {" "}/ {forrasMaxKapacitas?.toLocaleString("hu-HU")} L
                  </Text>
                </span>
              </div>
              <Progress
                percent={forrasPct}
                strokeColor={forrasColor}
                showInfo={false}
                size={["100%", 5]}
                style={{ margin: 0 }}
              />
            </div>
          )}

          {/* SECTION: CÉL TARTÁLY */}
          <div className="db-section" style={{ marginTop: showForras ? 22 : 0 }}>
            Cél tartály
          </div>
          <Form.Item name="cel_tartaly_szam" rules={[{ required: true }]}
            style={{ marginBottom: showCel ? 10 : 16 }}>
            <Select placeholder="— válassz tartályt —" onChange={onCelTaralyChange}>
              {tartalyok.map(t => (
                <Select.Option key={t.tartaly_id} value={t.tartaly_szam}>
                  {t.tartaly_szam} · {t.tartaly_tipus}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {showCel && (
            <div className="db-info-chip">
              <div className="db-info-stat">
                <Text className="db-chip-label">Aktuális</Text>
                <Text className="db-chip-value">
                  {celKeszlet != null ? Number(celKeszlet).toLocaleString("hu-HU") + " L" : "—"}
                </Text>
              </div>
              <div className="db-chip-divider" />
              <div className="db-info-stat">
                <Text className="db-chip-label">Maximum</Text>
                <Text className="db-chip-value">
                  {celMaxKapacitas != null ? Number(celMaxKapacitas).toLocaleString("hu-HU") + " L" : "—"}
                </Text>
              </div>
            </div>
          )}

          {/* FEATURED: MOZGATOTT LITER */}
          <Divider style={{ borderColor: "rgba(249,115,22,0.15)", margin: "20px 0 16px" }} />
          <div className="db-liter-wrap">
            <Text className="db-liter-label">Mozgatott mennyiség</Text>
            <Form.Item name="mozgatott_liter" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="0"
                addonAfter={<span className="db-liter-addon">L</span>}
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
              className="db-submit"
            >
              {loading ? "Rögzítés…" : "Mozgás rögzítése"}
            </Button>
          </Form.Item>

        </Form>

        {/* RESULT */}
        {eredmeny && (
          <div className="db-result">
            <Alert
              message={
                eredmeny.ervenyes && !eredmeny.hiba_uzenet ? "Sikeres rögzítés" :
                eredmeny.ervenyes &&  eredmeny.hiba_uzenet ? "Rögzítve — Figyelmeztetés" :
                "Hiba — Nem rögzítve"
              }
              description={
                <div>
                  <span>Mozgás azonosító: #{eredmeny.mozgas_id}</span>
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

export default Mozgasform;
