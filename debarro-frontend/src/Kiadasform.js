import { useState, useEffect } from "react";
import { Form, Select, DatePicker, InputNumber, Input, Button, Card, Alert, Typography } from "antd";
import dayjs from "dayjs";

const { Title } = Typography;

function Kiadasform() {
  const [tartalyok, setTartalyok] = useState([]);
  const [alkalmazottak, setAlkalmazottak] = useState([]);
  const [jarművek, setJarművek] = useState([]);
  const [aktualisKeszlet, setAktualisKeszlet] = useState(null);
  const [eredmeny, setEredmeny] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [jarmuvekAllapot, setJarmuvekAllapot] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/tartaly").then(r => r.json()).then(setTartalyok);
    fetch("http://localhost:8000/alkalmazott").then(r => r.json()).then(setAlkalmazottak);
    fetch("http://localhost:8000/jarmu").then(r => r.json()).then(setJarművek);
    fetch("http://localhost:8000/jarmuvek-allapot").then(r => r.json()).then(setJarmuvekAllapot);  // ÚJ
  }, []);

  const onTaralyChange = (value) => {
    fetch("http://localhost:8000/keszlet")
      .then(r => r.json())
      .then(data => {
        const tartaly = tartalyok.find(t => t.tartaly_szam === value);
        if (tartaly) {
          const keszlet = data.find(k => k.tartaly_id === tartaly.tartaly_id);
          setAktualisKeszlet(keszlet ? keszlet.aktualis_liter : 0);
        }
      });
  };

   const onJarmuChange = (value) => {
    console.log("Választott rendszám:", value);
    console.log("jarművek:", jarművek);
    console.log("jarmuvekAllapot:", jarmuvekAllapot);
    const jarmu = jarművek.find(j => j.rendszam === value);
    console.log("Megtalált jármű:", jarmu);
    if (jarmu) {
      const allapot = jarmuvekAllapot.find(j => j.eszkoz_sk === jarmu.eszkoz_sk);
      console.log("Megtalált állapot:", allapot);
      if (allapot) {
        form.setFieldValue("km_eloz", allapot.aktualis_km);
        form.setFieldValue("gepuzemora_eloz", allapot.aktualis_uzemora);
      }
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      datum: values.datum.format("YYYY-MM-DD"),
      kiado_szemely_nev: values.kiado_szemely_nev,
      gepkezelo_nev: values.gepkezelo_nev,
      tartaly_szam: values.tartaly_szam,
      rendszam: values.rendszam,
      gepuzemora_eloz: values.gepuzemora_eloz || null,
      gepuzemora_akt: values.gepuzemora_akt || null,
      km_eloz: values.km_eloz || null,
      km_akt: values.km_akt || null,
      pisztoly_oraallas: values.pisztoly_oraallas || null,
      kiadott_liter: values.kiadott_liter,
    };

    const res = await fetch("http://localhost:8000/keszlet-kiadas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setEredmeny(data);

    if (data.ervenyes) {
      onTaralyChange(values.tartaly_szam);
      fetch("http://localhost:8000/jarmuvek-allapot")
        .then(r => r.json())
        .then(ujAllapot => {
          setJarmuvekAllapot(ujAllapot);
          const jarmu = jarművek.find(j => j.rendszam === values.rendszam);
          if (jarmu) {
            const allapot = ujAllapot.find(j => j.eszkoz_sk === jarmu.eszkoz_sk);
            if (allapot) {
              form.setFieldValue("km_eloz", allapot.aktualis_km);
              form.setFieldValue("gepuzemora_eloz", allapot.aktualis_uzemora);
            }
          }
        });
    }
    setLoading(false);
  };

  return (
    <Card style={{ maxWidth: 560, margin: "0 auto" }}>
      <Title level={3}>⛽ Készlet Kiadás</Title>

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

        <Form.Item label="Kiadó személy" name="kiado_szemely_nev" rules={[{ required: true }]}>
          <Select placeholder="-- válassz --">
            {alkalmazottak.map(a => (
              <Select.Option key={a.foglalkoztatott_id} value={a.foglalkoztatott_nev}>
                {a.foglalkoztatott_nev}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Gépkezelő" name="gepkezelo_nev" rules={[{ required: true }]}>
          <Select placeholder="-- válassz --">
            {alkalmazottak.map(a => (
              <Select.Option key={a.foglalkoztatott_id} value={a.foglalkoztatott_nev}>
                {a.foglalkoztatott_nev}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={`Tartály - Aktuális készlet: ${aktualisKeszlet !== null ? aktualisKeszlet + ' L' : '---'}`}
          name="tartaly_szam"
          rules={[{ required: true }]}
        >
          <Select placeholder="-- válassz --" onChange={onTaralyChange}>
            {tartalyok.map(t => (
              <Select.Option key={t.tartaly_id} value={t.tartaly_szam}>
                {t.tartaly_szam} ({t.tartaly_tipus})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Jármű rendszám" name="rendszam" rules={[{ required: true }]}>
          <Select placeholder="-- válassz --" onChange={onJarmuChange}>
            {jarművek.map(j => (
              <Select.Option key={j.eszkoz_sk} value={j.rendszam}>
                {j.rendszam} - {j.megnevezes}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Gépüzemóra előző" name="gepuzemora_eloz">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item label="Gépüzemóra aktuális" name="gepuzemora_akt">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item label="KM előző" name="km_eloz">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item label="KM aktuális" name="km_akt">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item label="Pisztoly óraállás" name="pisztoly_oraallas">
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item label="Kiadott liter" name="kiadott_liter" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Kiadás rögzítése
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
              <p>Kiadás ID: {eredmeny.kiadas_id}</p>
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

export default Kiadasform;