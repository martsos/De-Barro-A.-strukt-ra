import { useState, useEffect } from "react";
import {
  Form, Select, DatePicker, InputNumber, Input, Button, Alert,
  Typography, Row, Col, Progress, Divider,
} from "antd";
import dayjs from "dayjs";
import { API } from "./api";
import "./shared.css";
import "./Bevetelezesform.css";

const { Title, Text } = Typography;

function Bevetelezesform() {
  const [tartalyok,       setTartalyok]       = useState([]);
  const [alkalmazottak,   setAlkalmazottak]   = useState([]);
  const [cegek,           setCegek]           = useState([]);
  const [aktualisKeszlet, setAktualisKeszlet] = useState(null);
  const [maxKapacitas,    setMaxKapacitas]    = useState(null);
  const [eredmeny,        setEredmeny]        = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch(`${API}/tartaly`).then(r => r.json()).then(setTartalyok);
    fetch(`${API}/alkalmazott`).then(r => r.json()).then(setAlkalmazottak);
    fetch(`${API}/cegek`).then(r => r.json()).then(setCegek);
  }, []);

  const onTaralyChange = (value) => {
    fetch(`${API}/keszlet`)
      .then(r => r.json())
      .then(data => {
        const tartaly = tartalyok.find(t => t.tartaly_szam === value);
        if (tartaly) {
          const keszlet  = data.find(k => k.tartaly_id === tartaly.tartaly_id);
          const aktualis = keszlet ? parseFloat(keszlet.aktualis_liter) : 0;
          setAktualisKeszlet(aktualis);
          setMaxKapacitas(parseFloat(tartaly.befogado_kepesseg_l));
          form.setFieldValue("kezdo_liter", aktualis);
        }
      });
  };

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      datum:        values.datum.format("YYYY-MM-DD"),
      tartaly_szam: values.tartaly_szam,
      atvevo_nev:   values.atvevo_nev,
      szallito_nev: values.szallito_nev,
      kezdo_liter:  values.kezdo_liter,
      bejovo_liter: values.bejovo_liter,
      zaro_liter:   values.zaro_liter,
      egysegar:     values.egysegar    || null,
      szamla_szam:  values.szamla_szam || null,
    };

    const res  = await fetch(`${API}/keszlet-bevet`, {
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
      setMaxKapacitas(null);
    }
    setLoading(false);
  };

  const tankPct = aktualisKeszlet !== null && maxKapacitas
    ? Math.min(100, Math.round((aktualisKeszlet / maxKapacitas) * 100))
    : null;
  const tankColor = tankPct === null  ? "#52c41a"
    : tankPct < 10                    ? "#ff4d4f"
    : tankPct < 30                    ? "#faad14"
    :                                   "#52c41a";

  return (
    <div className="db-border">
      <div className="db-shell">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="db-header">
          <div>
            <Text className="db-eyebrow">De Barro · Bevételezés</Text>
            <Title level={3} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
              Készlet Bevételezés
            </Title>
          </div>
          <span className="db-badge">📥</span>
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

          {/* SECTION: SZEMÉLYEK */}
          <div className="db-section">Személyek</div>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Átvevő" name="atvevo_nev" rules={[{ required: true }]}>
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
              <Form.Item label="Szállító" name="szallito_nev" rules={[{ required: true }]}>
                <Select placeholder="— válassz —">
                  {cegek.map(c => (
                    <Select.Option key={c.ceg_id} value={c.ceg_nev}>
                      {c.ceg_nev}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* SECTION: TARTÁLY */}
          <div className="db-section">Tartály</div>
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
            <div className="db-tank-bar">
              <div className="db-tank-meta">
                <Text className="db-tank-meta-label">Aktuális készlet</Text>
                <span>
                  <Text className="db-tank-meta-value" style={{ color: tankColor }}>
                    {aktualisKeszlet?.toLocaleString("hu-HU")} L
                  </Text>
                  <Text className="db-tank-meta-max">
                    {" "}/ {maxKapacitas?.toLocaleString("hu-HU")} L
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

          {/* SECTION: MÉRŐADATOK */}
          <div className="db-section" style={{ marginTop: tankPct !== null ? 22 : 0 }}>
            Mérőadatok
          </div>
          <Row gutter={12}>
            <Col span={11}>
              <Form.Item label="Kezdő liter" name="kezdo_liter" rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={2}>
              <div className="db-arrow">→</div>
            </Col>
            <Col span={11}>
              <Form.Item label="Záró liter" name="zaro_liter" rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          {/* SECTION: SZÁMLA */}
          <div className="db-section">Számla</div>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Egységár" name="egysegar" className="bv-egysegar">
                <InputNumber style={{ width: "100%" }} min={0} addonAfter="Ft/L" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Számla szám" name="szamla_szam">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* FEATURED: BEJÖVŐ LITER */}
          <Divider style={{ borderColor: "rgba(249,115,22,0.15)", margin: "20px 0 16px" }} />
          <div className="db-liter-wrap">
            <Text className="db-liter-label">Bejövő mennyiség</Text>
            <Form.Item name="bejovo_liter" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
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
              {loading ? "Rögzítés…" : "Bevételezés rögzítése"}
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
                  <span>Bevételezés azonosító: #{eredmeny.bevet_id}</span>
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

export default Bevetelezesform;
