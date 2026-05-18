import { useState, useEffect } from "react";
import { Form, Select, DatePicker, InputNumber, Input, Button, Card, Alert, Typography } from "antd";
import dayjs from "dayjs";
import { API } from "./api";

const { Title } = Typography;

function Mozgasform() {
  const [tartalyok,      setTartalyok]      = useState([]);
  const [alkalmazottak,  setAlkalmazottak]  = useState([]);
  const [forrasKeszlet,  setForrasKeszlet]  = useState(null);
  const [celKeszlet,     setCelKeszlet]     = useState(null);
  const [celMaxKapacitas,setCelMaxKapacitas]= useState(null);
  const [eredmeny,       setEredmeny]       = useState(null);
  const [loading,        setLoading]        = useState(false);
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
        return { aktualis: keszlet ? keszlet.aktualis_liter : 0, max: tartaly.befogado_kepesseg_l };
      });

  const onForrasTaralyChange = (value) => {
    getKeszlet(value).then(k => { if (k) setForrasKeszlet(k.aktualis); });
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
      setCelKeszlet(null);
      setCelMaxKapacitas(null);
    }
    setLoading(false);
  };

  return (
    <Card style={{ maxWidth: 560, margin: "0 auto" }}>
      <Title level={3}>🔄 Készlet Mozgás</Title>

      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ datum: dayjs() }}>

        <Form.Item label="Dátum" name="datum" rules={[{ required: true }]}>
          <DatePicker style={{ width: "100%" }} defaultValue={dayjs()} />
        </Form.Item>

        <Form.Item label="Felvevő" name="felvevo_nev" rules={[{ required: true }]}>
          <Select placeholder="-- válassz --">
            {alkalmazottak.map(a => (
              <Select.Option key={a.foglalkoztatott_id} value={a.foglalkoztatott_nev}>
                {a.foglalkoztatott_nev}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={`Forrás tartály — Aktuális készlet: ${forrasKeszlet !== null ? forrasKeszlet + " L" : "---"}`}
          name="forras_tartaly_szam"
          rules={[{ required: true }]}
        >
          <Select placeholder="-- válassz --" onChange={onForrasTaralyChange}>
            {tartalyok.map(t => (
              <Select.Option key={t.tartaly_id} value={t.tartaly_szam}>
                {t.tartaly_szam} ({t.tartaly_tipus})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={`Cél tartály — Aktuális: ${celKeszlet !== null ? celKeszlet + " L" : "---"} / Max: ${celMaxKapacitas !== null ? celMaxKapacitas + " L" : "---"}`}
          name="cel_tartaly_szam"
          rules={[{ required: true }]}
        >
          <Select placeholder="-- válassz --" onChange={onCelTaralyChange}>
            {tartalyok.map(t => (
              <Select.Option key={t.tartaly_id} value={t.tartaly_szam}>
                {t.tartaly_szam} ({t.tartaly_tipus})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Anyag">
          <Input
            value={tartalyok.find(t => t.tartaly_szam === form.getFieldValue("forras_tartaly_szam"))?.anyag_megnevezes || "---"}
            disabled
          />
        </Form.Item>

        <Form.Item label="Mozgatott liter" name="mozgatott_liter" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Mozgás rögzítése
          </Button>
        </Form.Item>

      </Form>

      {eredmeny && (
        <Alert
          message={
            eredmeny.ervenyes && !eredmeny.hiba_uzenet ? "✅ Sikeres rögzítés" :
            eredmeny.ervenyes &&  eredmeny.hiba_uzenet ? "⚠️ Rögzítve — Figyelmeztetés" :
            "❌ Hiba — Nem rögzítve"
          }
          description={
            <div>
              <p>Mozgás ID: {eredmeny.mozgas_id}</p>
              {eredmeny.hiba_uzenet && <p>{eredmeny.hiba_uzenet}</p>}
            </div>
          }
          type={
            eredmeny.ervenyes && !eredmeny.hiba_uzenet ? "success" :
            eredmeny.ervenyes &&  eredmeny.hiba_uzenet ? "warning" :
            "error"
          }
          showIcon
        />
      )}
    </Card>
  );
}

export default Mozgasform;
