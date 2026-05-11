import { useState, useEffect } from "react";
import { Form, Select, DatePicker, InputNumber, Input, Button, Card, Alert, Typography } from "antd";
import dayjs from "dayjs";

const { Title } = Typography;

function Bevetelezesform() {
  const [tartalyok, setTartalyok] = useState([]);
  const [alkalmazottak, setAlkalmazottak] = useState([]);
  const [cegek, setCegek] = useState([]);
  const [aktualisKeszlet, setAktualisKeszlet] = useState(null);
  const [maxKapacitas, setMaxKapacitas] = useState(null);  // ÚJ
  const [eredmeny, setEredmeny] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch("http://localhost:8000/tartaly").then(r => r.json()).then(setTartalyok);
    fetch("http://localhost:8000/alkalmazott").then(r => r.json()).then(setAlkalmazottak);
    fetch("http://localhost:8000/cegek").then(r => r.json()).then(setCegek);
  }, []);

  const onTaralyChange = (value) => {
    fetch("http://localhost:8000/keszlet")
      .then(r => r.json())
      .then(data => {
        const tartaly = tartalyok.find(t => t.tartaly_szam === value);
        if (tartaly) {
          const keszlet = data.find(k => k.tartaly_id === tartaly.tartaly_id);
          const aktualis = keszlet ? keszlet.aktualis_liter : 0;
          setAktualisKeszlet(aktualis);
          setMaxKapacitas(tartaly.befogado_kepesseg_l);  // ÚJ
          form.setFieldValue("kezdo_liter", aktualis);
        }
      });
  };

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      datum: values.datum.format("YYYY-MM-DD"),
      tartaly_szam: values.tartaly_szam,
      atvevo_nev: values.atvevo_nev,
      szallito_nev: values.szallito_nev,
      kezdo_liter: values.kezdo_liter,
      bejovo_liter: values.bejovo_liter,
      zaro_liter: values.zaro_liter,
      egysegar: values.egysegar,
      szamla_szam: values.szamla_szam,
    };

    const res = await fetch("http://localhost:8000/keszlet-bevet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setEredmeny(data);

    if (data.ervenyes) {
      onTaralyChange(values.tartaly_szam);
    }
    setLoading(false);
  };

  return (
    <Card style={{ maxWidth: 560, margin: "0 auto" }}>
          <Title level={3}>⛽ Készlet Bevételezés</Title>

          {aktualisKeszlet !== null && (
            <Alert
              message={`Aktuális készlet: ${aktualisKeszlet} L`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form form={form} layout="vertical" onFinish={onFinish}>

            <Form.Item label="Dátum" name="datum" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} defaultValue={dayjs()} />
            </Form.Item>

            <Form.Item label="Tartály" name="tartaly_szam" rules={[{ required: true }]}>
              <Select placeholder="-- válassz --" onChange={onTaralyChange}>
                {tartalyok.map(t => (
                  <Select.Option key={t.tartaly_id} value={t.tartaly_szam}>
                    {t.tartaly_szam} ({t.tartaly_tipus})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Átvevő" name="atvevo_nev" rules={[{ required: true }]}>
              <Select placeholder="-- válassz --">
                {alkalmazottak.map(a => (
                  <Select.Option key={a.foglalkoztatott_id} value={a.foglalkoztatott_nev}>
                    {a.foglalkoztatott_nev}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Szállító" name="szallito_nev" rules={[{ required: true }]}>
              <Select placeholder="-- válassz --">
                {cegek.map(c => (
                  <Select.Option key={c.ceg_id} value={c.ceg_nev}>
                    {c.ceg_nev}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item 
            label={`Kezdő liter - Aktuális készlet: ${aktualisKeszlet !== null ? aktualisKeszlet + ' L' : '---'}`} 
            name="kezdo_liter" 
            rules={[{ required: true }]}
              >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            <Form.Item label="Bejövő liter" name="bejovo_liter" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            <Form.Item 
            label={`Záró liter - Maximum űrtartalom: ${maxKapacitas !== null ? maxKapacitas + ' L' : '---'}`}
            name="zaro_liter" 
            rules={[{ required: true }]}
              >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            <Form.Item label="Egységár" name="egysegar">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>

            <Form.Item label="Számla szám" name="szamla_szam">
              <Input />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Bevételezés rögzítése
              </Button>
            </Form.Item>

          </Form>

          {eredmeny && (
            <Alert
              message={
              eredmeny.ervenyes && !eredmeny.hiba_uzenet ? "✅ Sikeres rögzítés" :
              eredmeny.ervenyes && eredmeny.hiba_uzenet ? "⚠️ Rögzítve - Figyelmeztetés" :
              "❌ Hiba - Nem rögzítve"
            }
              description={
            <div>
            <p>Bevételezés ID: {eredmeny.bevet_id}</p>
            {eredmeny.hiba_uzenet && <p>{eredmeny.hiba_uzenet}</p>}
            </div>
            }
              type={
              eredmeny.ervenyes && !eredmeny.hiba_uzenet ? "success" :
              eredmeny.ervenyes && eredmeny.hiba_uzenet ? "warning" :
                "error"
            }
              showIcon
            />
        )}
        </Card>
  );
}

export default Bevetelezesform;
