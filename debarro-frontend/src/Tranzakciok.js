import { useState, useEffect } from "react";
import { Table, Select, DatePicker, Tag, Typography, Tabs, Space } from "antd";
import dayjs from "dayjs";
import { API } from "./api";
import "./shared.css";
import "./Tranzakciok.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;

function ervenyesTag(val, hiba) {
  if (!val) return <Tag color="error">Hibás</Tag>;
  if (hiba)  return <Tag color="warning">Figyelmeztetés</Tag>;
  return <Tag color="success">OK</Tag>;
}

const kiadasColumns = [
  { title: "Dátum",       dataIndex: "datum",         key: "datum",        width: 105 },
  { title: "Tartály",     dataIndex: "tartaly_szam",  key: "tartaly_szam" },
  { title: "Kiadó",       dataIndex: "kiado_szemely", key: "kiado_szemely" },
  { title: "Gépkezelő",   dataIndex: "gepkezelo",     key: "gepkezelo" },
  { title: "Rendszám",    dataIndex: "rendszam",      key: "rendszam" },
  {
    title: "KM elő → akt", key: "km",
    render: (_, r) =>
      r.km_eloz != null ? `${r.km_eloz} → ${r.km_akt}` : (r.km_akt ?? "—"),
  },
  {
    title: "Üzemóra elő → akt", key: "uzemora",
    render: (_, r) =>
      r.gepuzemora_eloz != null
        ? `${r.gepuzemora_eloz} → ${r.gepuzemora_akt}`
        : (r.gepuzemora_akt ?? "—"),
  },
  { title: "Kiadott (L)", dataIndex: "kiadott_liter", key: "kiadott_liter" },
  {
    title: "Állapot", key: "allapot",
    render: (_, r) => ervenyesTag(r.ervenyes, r.hiba_uzenet),
  },
  { title: "Megjegyzés", dataIndex: "hiba_uzenet", key: "hiba_uzenet", ellipsis: true },
];

const bevetColumns = [
  { title: "Dátum",      dataIndex: "datum",        key: "datum",       width: 105 },
  { title: "Tartály",    dataIndex: "tartaly_szam", key: "tartaly_szam" },
  { title: "Átvevő",     dataIndex: "atvevo",       key: "atvevo" },
  { title: "Szállító",   dataIndex: "szallito",     key: "szallito" },
  { title: "Kezdő (L)",  dataIndex: "kezdo_liter",  key: "kezdo_liter" },
  { title: "Bejövő (L)", dataIndex: "bejovo_liter", key: "bejovo_liter" },
  { title: "Záró (L)",   dataIndex: "zaro_liter",   key: "zaro_liter" },
  { title: "Egységár",   dataIndex: "egysegar",     key: "egysegar" },
  { title: "Számla",     dataIndex: "szamla_szam",  key: "szamla_szam" },
  {
    title: "Állapot", key: "allapot",
    render: (_, r) => ervenyesTag(r.ervenyes, r.hiba_uzenet),
  },
  { title: "Megjegyzés", dataIndex: "hiba_uzenet", key: "hiba_uzenet", ellipsis: true },
];

const mozgasColumns = [
  { title: "Dátum",          dataIndex: "datum",            key: "datum",          width: 105 },
  { title: "Forrás tartály", dataIndex: "forras_tartaly",   key: "forras_tartaly" },
  { title: "Cél tartály",    dataIndex: "cel_tartaly",      key: "cel_tartaly" },
  { title: "Felvevő",        dataIndex: "felvevo",          key: "felvevo" },
  { title: "Anyag",          dataIndex: "anyag_megnevezes", key: "anyag_megnevezes" },
  { title: "Mozgatott (L)",  dataIndex: "mozgatott_liter",  key: "mozgatott_liter" },
  {
    title: "Állapot", key: "allapot",
    render: (_, r) => ervenyesTag(r.ervenyes, r.hiba_uzenet),
  },
  { title: "Megjegyzés", dataIndex: "hiba_uzenet", key: "hiba_uzenet", ellipsis: true },
];

function Tranzakciok() {
  const [tartalyok,   setTartalyok]   = useState([]);
  const [tartalyId,   setTartalyId]   = useState(null);
  const [dateRange,   setDateRange]   = useState([dayjs().subtract(30, "day"), dayjs()]);
  const [kiadasData,  setKiadasData]  = useState([]);
  const [bevetData,   setBevetData]   = useState([]);
  const [mozgasData,  setMozgasData]  = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    fetch(`${API}/tartaly`).then(r => r.json()).then(setTartalyok);
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (tartalyId !== null)  qs.set("tartaly_id", tartalyId);
    if (dateRange?.[0])      qs.set("datum_tol",  dateRange[0].format("YYYY-MM-DD"));
    if (dateRange?.[1])      qs.set("datum_ig",   dateRange[1].format("YYYY-MM-DD"));
    const q = qs.toString();

    setLoading(true);
    Promise.all([
      fetch(`${API}/tranzakciok/kiadas?${q}`).then(r => r.json()),
      fetch(`${API}/tranzakciok/bevet?${q}`).then(r  => r.json()),
      fetch(`${API}/tranzakciok/mozgas?${q}`).then(r => r.json()),
    ])
      .then(([k, b, m]) => {
        setKiadasData(k);
        setBevetData(b);
        setMozgasData(m);
      })
      .finally(() => setLoading(false));
  }, [tartalyId, dateRange]);

  const tabItems = [
    {
      key: "kiadas",
      label: `Kiadások (${kiadasData.length})`,
      children: (
        <Table
          dataSource={kiadasData}
          columns={kiadasColumns}
          rowKey="kiadas_id"
          loading={loading}
          size="small"
          scroll={{ x: true }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          rowClassName={r => (!r.ervenyes ? "row-hiba" : "")}
        />
      ),
    },
    {
      key: "bevet",
      label: `Bevételezések (${bevetData.length})`,
      children: (
        <Table
          dataSource={bevetData}
          columns={bevetColumns}
          rowKey="bevet_id"
          loading={loading}
          size="small"
          scroll={{ x: true }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          rowClassName={r => (!r.ervenyes ? "row-hiba" : "")}
        />
      ),
    },
    {
      key: "mozgas",
      label: `Mozgások (${mozgasData.length})`,
      children: (
        <Table
          dataSource={mozgasData}
          columns={mozgasColumns}
          rowKey="mozgas_id"
          loading={loading}
          size="small"
          scroll={{ x: true }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          rowClassName={r => (!r.ervenyes ? "row-hiba" : "")}
        />
      ),
    },
  ];

  return (
    <div className="db-border db-wide">
      <div className="db-shell">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="db-header">
          <div>
            <Text className="db-eyebrow">De Barro · Előzmények</Text>
            <div style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 20 }}>
              Tranzakció-előzmények
            </div>
          </div>
          <span className="db-badge">📋</span>
        </div>

        {/* ── FILTERS ────────────────────────────────────── */}
        <div className="trx-filters">
          <Text className="trx-filter-label">Szűrő</Text>
          <Space wrap>
            <Select
              placeholder="Összes tartály"
              allowClear
              style={{ width: 200 }}
              value={tartalyId}
              onChange={v => setTartalyId(v ?? null)}
            >
              {tartalyok.map(t => (
                <Select.Option key={t.tartaly_id} value={t.tartaly_id}>
                  {t.tartaly_szam}
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              value={dateRange}
              onChange={v => setDateRange(v ?? [null, null])}
              format="YYYY-MM-DD"
            />
          </Space>
        </div>

        {/* ── TABS + TABLES ──────────────────────────────── */}
        <div className="trx-body">
          <Tabs items={tabItems} className="trx-tabs" />
        </div>

      </div>
    </div>
  );
}

export default Tranzakciok;
