import { useState, useEffect, useCallback } from "react";
import {
  Table, Tabs, Tag, Button, Modal, Form, Input,
  Select, InputNumber, Typography, Space, Switch, Tooltip,
} from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { API } from "./api";
import "./shared.css";
import "./Torzsadatok.css";

const { Text } = Typography;

const ESZKOZ_KATEGORIAK = ["KAMION", "MUNKAGEP", "SZEMÉLYAUTÓ", "PÓTKOCSI", "EGYÉB"];
const EROFORRAS_FAJTAK  = ["DIESEL", "BENZIN", "ELEKTROMOS", "EGYÉB"];

function allapotTag(val) {
  return val === "AKTÍV"
    ? <Tag color="success">AKTÍV</Tag>
    : <Tag style={{ color: "#555", borderColor: "#2a2a2a", background: "transparent" }}>INAKTÍV</Tag>;
}

// ─── entity config ─────────────────────────────────────────────
// maps entity name → { idKey, postUrl }
const ENTITY = {
  alkalmazott: { idKey: "foglalkoztatott_id", url: "/alkalmazott" },
  jarmu:       { idKey: "eszkoz_sk",          url: "/jarmu" },
  tartaly:     { idKey: "tartaly_id",         url: "/tartaly" },
  ceg:         { idKey: "ceg_id",             url: "/ceg" },
  lokacio:     { idKey: "lokacio_id",         url: "/lokacio" },
  fogyoanyag:  { idKey: "anyag_id",           url: "/fogyoanyag" },
};

function Torzsadatok() {
  const [alkalmazottak, setAlkalmazottak] = useState([]);
  const [jarművek,      setJarművek]      = useState([]);
  const [tartalyok,     setTartalyok]     = useState([]);
  const [cegek,         setCegek]         = useState([]);
  const [lokaciok,      setLokaciok]      = useState([]);
  const [fogyoanyagok,  setFogyoanyagok]  = useState([]);

  const [showInaktiv, setShowInaktiv] = useState(false);

  // modal: null | { type, mode: 'add'|'edit', record }
  const [modal,    setModal]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [toggling, setToggling] = useState(null); // { entity, id }
  const [form] = Form.useForm();

  const load = useCallback(() => {
    fetch(`${API}/torzsadat/alkalmazott`).then(r => r.json()).then(setAlkalmazottak).catch(() => {});
    fetch(`${API}/torzsadat/jarmu`).then(r => r.json()).then(setJarművek).catch(() => {});
    fetch(`${API}/torzsadat/tartaly`).then(r => r.json()).then(setTartalyok).catch(() => {});
    fetch(`${API}/torzsadat/ceg`).then(r => r.json()).then(setCegek).catch(() => {});
    fetch(`${API}/torzsadat/lokacio`).then(r => r.json()).then(setLokaciok).catch(() => {});
    fetch(`${API}/torzsadat/fogyoanyag`).then(r => r.json()).then(setFogyoanyagok).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── toggle active / inactive ──────────────────────────────────
  async function toggleAllapot(entity, id, current) {
    const ujAllapot = current === "AKTÍV" ? "INAKTÍV" : "AKTÍV";
    setToggling({ entity, id });
    await fetch(`${API}${ENTITY[entity].url}/${id}/allapot`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allapot: ujAllapot }),
    });
    setToggling(null);
    load();
  }

  // ── open add modal ────────────────────────────────────────────
  function openAdd(type) {
    form.resetFields();
    setModal({ type, mode: "add", record: null });
  }

  // ── open edit modal pre-filled with record ────────────────────
  function openEdit(type, record) {
    // direct field-to-form mapping (GET returns the same names the form uses)
    const fieldMap = {
      alkalmazott: ["foglalkoztatott_nev", "foglalkoztatas_tipusa", "foglalkoztato_nev", "munkaora"],
      jarmu:       ["eszkoz_kategoria", "rendszam", "eszkoz_id", "megnevezes", "gyartmany",
                    "tipus", "eroforras_fajta", "debarro_csoportositas", "alvazszam",
                    "uzembentarto_nev", "tulajdonos_nev"],
      tartaly:     ["tartaly_szam", "tartaly_tipus", "befogado_kepesseg_l",
                    "anyag_megnevezes", "lokacio_nev", "egyeb_alapadatok"],
      ceg:         ["ceg_nev", "tulajdonos_neve", "kapcsolattarto", "ceg_egyeb"],
      lokacio:     ["lokacio_nev", "helyrajzi_szam", "hosszusagi_fok", "szelessegi_fok"],
      fogyoanyag:  ["anyag_megnevezes", "anyag_kategoria", "tulajdonos_nev"],
    };
    const vals = {};
    for (const f of fieldMap[type]) {
      vals[f] = record[f] ?? undefined;
    }
    form.setFieldsValue(vals);
    setModal({ type, mode: "edit", record });
  }

  // ── save (add or edit) ────────────────────────────────────────
  async function onSave() {
    let values;
    try { values = await form.validateFields(); }
    catch { return; }

    const { type, mode, record } = modal;
    const cfg = ENTITY[type];
    const url = mode === "add"
      ? `${API}${cfg.url}`
      : `${API}${cfg.url}/${record[cfg.idKey]}`;
    const method = mode === "add" ? "POST" : "PATCH";

    setSaving(true);
    try {
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        Modal.error({ title: "Hiba", content: err.detail || "Ismeretlen hiba" });
      } else {
        setModal(null);
        load();
      }
    } finally {
      setSaving(false);
    }
  }

  const vis = (arr) => showInaktiv ? arr : arr.filter(r => r.allapot === "AKTÍV");

  // ── action column shared builder ──────────────────────────────
  function actionCol(entity) {
    const { idKey } = ENTITY[entity];
    return {
      title: "", key: "akcio", width: 110, fixed: "right",
      render: (_, r) => {
        const busy = toggling?.entity === entity && toggling?.id === r[idKey];
        return (
          <Space size={4}>
            <Tooltip title="Szerkesztés">
              <Button
                size="small"
                icon={<EditOutlined />}
                className="trz-btn-edit"
                onClick={() => openEdit(entity, r)}
              />
            </Tooltip>
            <Tooltip title={r.allapot === "AKTÍV" ? "Inaktiválás" : "Aktiválás"}>
              <Button
                size="small"
                loading={busy}
                className={r.allapot === "AKTÍV" ? "trz-btn-deactivate" : "trz-btn-activate"}
                onClick={() => toggleAllapot(entity, r[idKey], r.allapot)}
              >
                {r.allapot === "AKTÍV" ? "Inaktív" : "Aktív"}
              </Button>
            </Tooltip>
          </Space>
        );
      },
    };
  }

  // ── COLUMN DEFINITIONS — every schema column ──────────────────

  const alkalmazottCols = [
    { title: "ID",            dataIndex: "foglalkoztatott_id",   key: "id",    width: 55 },
    { title: "Név",           dataIndex: "foglalkoztatott_nev",   key: "nev",   width: 180 },
    { title: "Típus",         dataIndex: "foglalkoztatas_tipusa", key: "tipus", width: 140, render: v => v || "—" },
    { title: "Foglalkoztató", dataIndex: "foglalkoztato_nev",    key: "fogl",  width: 160, render: v => v || "—" },
    { title: "Munkaóra",      dataIndex: "munkaora",             key: "moh",   width: 90,  render: v => v ?? "—" },
    { title: "Állapot",       dataIndex: "allapot",              key: "all",   width: 90,  render: allapotTag },
    actionCol("alkalmazott"),
  ];

  const jarmuCols = [
    { title: "SK",            dataIndex: "eszkoz_sk",            key: "sk",   width: 55 },
    { title: "Rendszám",      dataIndex: "rendszam",             key: "rsz",  width: 100, render: v => v || "—" },
    { title: "Eszköz ID",     dataIndex: "eszkoz_id",            key: "eid",  width: 100, render: v => v || "—" },
    { title: "Kategória",     dataIndex: "eszkoz_kategoria",     key: "kat",  width: 110 },
    { title: "D.csop.",       dataIndex: "debarro_csoportositas", key: "dcso", width: 110, render: v => v || "—" },
    { title: "Megnevezés",    dataIndex: "megnevezes",           key: "megn", width: 160, render: v => v || "—" },
    { title: "Gyártmány",     dataIndex: "gyartmany",            key: "gyar", width: 100, render: v => v || "—" },
    { title: "Típus",         dataIndex: "tipus",                key: "tip",  width: 100, render: v => v || "—" },
    { title: "Üzemanyag",     dataIndex: "eroforras_fajta",      key: "er",   width: 100, render: v => v || "—" },
    { title: "Alvázszám",     dataIndex: "alvazszam",            key: "alv",  width: 120, render: v => v || "—" },
    { title: "Üzembentartó",  dataIndex: "uzembentarto_nev",     key: "uzb",  width: 150, render: v => v || "—" },
    { title: "Tulajdonos",    dataIndex: "tulajdonos_nev",       key: "tul",  width: 150, render: v => v || "—" },
    { title: "Állapot",       dataIndex: "allapot",              key: "all",  width: 90,  render: allapotTag },
    actionCol("jarmu"),
  ];

  const tartalyCols = [
    { title: "ID",            dataIndex: "tartaly_id",           key: "id",   width: 55 },
    { title: "Tartályszám",   dataIndex: "tartaly_szam",         key: "szam", width: 120 },
    { title: "Típus",         dataIndex: "tartaly_tipus",        key: "tip",  width: 80 },
    { title: "Kapacitás (L)", dataIndex: "befogado_kepesseg_l",  key: "kap",  width: 110 },
    { title: "Anyag",         dataIndex: "anyag_megnevezes",     key: "anyag",width: 140, render: v => v || "—" },
    { title: "Lokáció",       dataIndex: "lokacio_nev",          key: "lok",  width: 140, render: v => v || "—" },
    { title: "Egyéb adatok",  dataIndex: "egyeb_alapadatok",     key: "egyeb",width: 180, render: v => v || "—", ellipsis: true },
    { title: "Állapot",       dataIndex: "allapot",              key: "all",  width: 90,  render: allapotTag },
    actionCol("tartaly"),
  ];

  const cegCols = [
    { title: "ID",             dataIndex: "ceg_id",        key: "id",   width: 55 },
    { title: "Cég neve",       dataIndex: "ceg_nev",       key: "nev",  width: 200 },
    { title: "Tulajdonos",     dataIndex: "tulajdonos_neve",key: "tul",  width: 160 },
    { title: "Kapcsolattartó", dataIndex: "kapcsolattarto", key: "kap",  width: 150, render: v => v || "—" },
    { title: "Egyéb",          dataIndex: "ceg_egyeb",      key: "egyeb",width: 180, render: v => v || "—", ellipsis: true },
    { title: "Állapot",        dataIndex: "allapot",        key: "all",  width: 90,  render: allapotTag },
    actionCol("ceg"),
  ];

  const lokacioCols = [
    { title: "ID",             dataIndex: "lokacio_id",    key: "id",   width: 55 },
    { title: "Lokáció neve",   dataIndex: "lokacio_nev",   key: "nev",  width: 180 },
    { title: "Helyrajzi szám", dataIndex: "helyrajzi_szam",key: "hely", width: 130, render: v => v || "—" },
    { title: "Hosszúsági fok", dataIndex: "hosszusagi_fok",key: "h",    width: 120, render: v => v ?? "—" },
    { title: "Szélességi fok", dataIndex: "szelessegi_fok",key: "sz",   width: 120, render: v => v ?? "—" },
    { title: "Állapot",        dataIndex: "allapot",       key: "all",  width: 90,  render: allapotTag },
    actionCol("lokacio"),
  ];

  const fogyoanyagCols = [
    { title: "ID",          dataIndex: "anyag_id",          key: "id",   width: 55 },
    { title: "Megnevezés",  dataIndex: "anyag_megnevezes",  key: "megn", width: 200 },
    { title: "Kategória",   dataIndex: "anyag_kategoria",   key: "kat",  width: 140 },
    { title: "Tulajdonos",  dataIndex: "tulajdonos_nev",    key: "tul",  width: 160, render: v => v || "—" },
    { title: "Állapot",     dataIndex: "allapot",           key: "all",  width: 90,  render: allapotTag },
    actionCol("fogyoanyag"),
  ];

  // ── TAB BUILDER ───────────────────────────────────────────────
  function makeTab(label, data, cols, entity, rowKey) {
    return {
      key: entity,
      label,
      children: (
        <div className="trz-tab-content">
          <div className="trz-tab-toolbar">
            <Text className="trz-count-label">{vis(data).length} bejegyzés</Text>
            <Button
              icon={<PlusOutlined />}
              className="trz-add-btn"
              onClick={() => openAdd(entity)}
            >
              Új felvétel
            </Button>
          </div>
          <Table
            dataSource={vis(data)}
            columns={cols}
            rowKey={rowKey}
            size="small"
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            rowClassName={r => r.allapot === "INAKTÍV" ? "row-inaktiv" : ""}
          />
        </div>
      ),
    };
  }

  const tabItems = [
    makeTab("👷 Alkalmazottak", alkalmazottak, alkalmazottCols, "alkalmazott", "foglalkoztatott_id"),
    makeTab("🚛 Járművek",      jarművek,      jarmuCols,       "jarmu",       "eszkoz_sk"),
    makeTab("🛢️ Tartályok",    tartalyok,     tartalyCols,     "tartaly",     "tartaly_id"),
    makeTab("🏢 Cégek",         cegek,         cegCols,         "ceg",         "ceg_id"),
    makeTab("📍 Lokációk",      lokaciok,      lokacioCols,     "lokacio",     "lokacio_id"),
    makeTab("🔧 Fogyóanyagok",  fogyoanyagok,  fogyoanyagCols,  "fogyoanyag",  "anyag_id"),
  ];

  // ── MODAL FORM FIELDS — every schema column per entity ────────
  function modalFields() {
    const aktCegek    = cegek.filter(c => c.allapot === "AKTÍV");
    const aktAnyagok  = fogyoanyagok.filter(f => f.allapot === "AKTÍV");
    const aktLokaciok = lokaciok.filter(l => l.allapot === "AKTÍV");

    switch (modal?.type) {

      case "alkalmazott": return (
        <>
          <Form.Item name="foglalkoztatott_nev" label="Teljes név"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Input placeholder="Kovács János" />
          </Form.Item>
          <Form.Item name="foglalkoztatas_tipusa" label="Foglalkoztatás típusa">
            <Input placeholder="pl. ALKALMAZOTT, ALVÁLLALKOZÓ" />
          </Form.Item>
          <Form.Item name="foglalkoztato_nev" label="Foglalkoztató cég">
            <Select allowClear showSearch placeholder="Válassz céget (opcionális)">
              {aktCegek.map(c => (
                <Select.Option key={c.ceg_id} value={c.ceg_nev}>{c.ceg_nev}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="munkaora" label="Munkaóra keret">
            <InputNumber min={0} style={{ width: "100%" }} placeholder="pl. 2080" />
          </Form.Item>
        </>
      );

      case "jarmu": return (
        <>
          <Form.Item name="eszkoz_kategoria" label="Kategória"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Select placeholder="Válassz kategóriát">
              {ESZKOZ_KATEGORIAK.map(k => <Select.Option key={k} value={k}>{k}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="rendszam" label="Rendszám">
            <Input placeholder="ABC-123" />
          </Form.Item>
          <Form.Item name="eszkoz_id" label="Belső eszköz ID">
            <Input placeholder="pl. GEP-001" />
          </Form.Item>
          <Form.Item name="megnevezes" label="Megnevezés">
            <Input placeholder="Szabad szöveges leírás" />
          </Form.Item>
          <Form.Item name="debarro_csoportositas" label="De Barro csoportosítás">
            <Input placeholder="pl. SAJÁT, BÉRELT" />
          </Form.Item>
          <Form.Item name="gyartmany" label="Gyártmány">
            <Input placeholder="pl. Volvo, Caterpillar" />
          </Form.Item>
          <Form.Item name="tipus" label="Típus / modell">
            <Input placeholder="pl. FH16, 320D" />
          </Form.Item>
          <Form.Item name="eroforras_fajta" label="Üzemanyag típusa">
            <Select allowClear placeholder="Válassz">
              {EROFORRAS_FAJTAK.map(k => <Select.Option key={k} value={k}>{k}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="alvazszam" label="Alvázszám (VIN)">
            <Input />
          </Form.Item>
          <Form.Item name="uzembentarto_nev" label="Üzembentartó cég">
            <Select allowClear showSearch placeholder="Opcionális">
              {aktCegek.map(c => <Select.Option key={c.ceg_id} value={c.ceg_nev}>{c.ceg_nev}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="tulajdonos_nev" label="Tulajdonos cég">
            <Select allowClear showSearch placeholder="Opcionális">
              {aktCegek.map(c => <Select.Option key={c.ceg_id} value={c.ceg_nev}>{c.ceg_nev}</Select.Option>)}
            </Select>
          </Form.Item>
        </>
      );

      case "tartaly": return (
        <>
          <Form.Item name="tartaly_szam" label="Tartályszám"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Input placeholder="pl. T-001" />
          </Form.Item>
          <Form.Item name="tartaly_tipus" label="Típus"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Select placeholder="Válassz típust">
              {["FIX", "MOBIL", "KANNA"].map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="befogado_kepesseg_l" label="Befogadóképesség (L)"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <InputNumber min={1} style={{ width: "100%" }} placeholder="pl. 5000" />
          </Form.Item>
          <Form.Item name="anyag_megnevezes" label="Anyag (fogyóanyag)"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Select showSearch placeholder="Válassz anyagot">
              {aktAnyagok.map(f => (
                <Select.Option key={f.anyag_id} value={f.anyag_megnevezes}>{f.anyag_megnevezes}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="lokacio_nev" label="Lokáció"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Select showSearch placeholder="Válassz lokációt">
              {aktLokaciok.map(l => (
                <Select.Option key={l.lokacio_id} value={l.lokacio_nev}>{l.lokacio_nev}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="egyeb_alapadatok" label="Egyéb alapadatok">
            <Input.TextArea rows={2} placeholder="Megjegyzések, speciális adatok..." />
          </Form.Item>
        </>
      );

      case "ceg": return (
        <>
          <Form.Item name="ceg_nev" label="Cég neve"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Input placeholder="pl. De Barro Kft." />
          </Form.Item>
          <Form.Item name="tulajdonos_neve" label="Tulajdonos neve"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Input placeholder="Természetes személy neve" />
          </Form.Item>
          <Form.Item name="kapcsolattarto" label="Kapcsolattartó">
            <Input placeholder="Név / telefonszám / email" />
          </Form.Item>
          <Form.Item name="ceg_egyeb" label="Egyéb megjegyzés">
            <Input placeholder="Szállító, alvállalkozó, stb." />
          </Form.Item>
        </>
      );

      case "lokacio": return (
        <>
          <Form.Item name="lokacio_nev" label="Lokáció neve"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Input placeholder="pl. Főtelep, Északi bázis" />
          </Form.Item>
          <Form.Item name="helyrajzi_szam" label="Helyrajzi szám">
            <Input placeholder="pl. 1234/5" />
          </Form.Item>
          <Form.Item name="hosszusagi_fok" label="Hosszúsági fok (GPS)">
            <InputNumber style={{ width: "100%" }} step={0.0000001}
              placeholder="pl. 18.9253200" />
          </Form.Item>
          <Form.Item name="szelessegi_fok" label="Szélességi fok (GPS)">
            <InputNumber style={{ width: "100%" }} step={0.0000001}
              placeholder="pl. 47.4979900" />
          </Form.Item>
        </>
      );

      case "fogyoanyag": return (
        <>
          <Form.Item name="anyag_megnevezes" label="Megnevezés"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Input placeholder="pl. Gázolaj B7, AdBlue" />
          </Form.Item>
          <Form.Item name="anyag_kategoria" label="Kategória"
            rules={[{ required: true, message: "Kötelező mező" }]}>
            <Input placeholder="pl. ÜZEMANYAG, KENŐANYAG, ADALÉK" />
          </Form.Item>
          <Form.Item name="tulajdonos_nev" label="Tulajdonos cég">
            <Select allowClear showSearch placeholder="Opcionális">
              {aktCegek.map(c => (
                <Select.Option key={c.ceg_id} value={c.ceg_nev}>{c.ceg_nev}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </>
      );

      default: return null;
    }
  }

  const modalTitles = {
    alkalmazott: { add: "Új Alkalmazott felvétele", edit: "Alkalmazott szerkesztése" },
    jarmu:       { add: "Új Jármű / Munkagép felvétele", edit: "Jármű szerkesztése" },
    tartaly:     { add: "Új Tartály felvétele", edit: "Tartály szerkesztése" },
    ceg:         { add: "Új Cég felvétele", edit: "Cég szerkesztése" },
    lokacio:     { add: "Új Lokáció felvétele", edit: "Lokáció szerkesztése" },
    fogyoanyag:  { add: "Új Fogyóanyag felvétele", edit: "Fogyóanyag szerkesztése" },
  };

  // ── RENDER ────────────────────────────────────────────────────
  return (
    <div className="db-border db-wide">
      <div className="db-shell">

        <div className="db-header">
          <div>
            <Text className="db-eyebrow">De Barro · Törzsadatok</Text>
            <div style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 20 }}>
              Törzsadat-kezelés
            </div>
          </div>
          <span className="db-badge">📁</span>
        </div>

        {/* ── global inaktív filter ── */}
        <div className="trz-global-filter">
          <Switch
            size="small"
            checked={showInaktiv}
            onChange={setShowInaktiv}
            style={{ background: showInaktiv ? "#f97316" : undefined }}
          />
          <Text className="trz-filter-label">Inaktív bejegyzések megjelenítése</Text>
        </div>

        <div className="trz-body">
          <Tabs items={tabItems} className="trz-tabs" />
        </div>

      </div>

      <Modal
        open={modal !== null}
        title={
          <span className="trz-modal-title">
            {modal ? modalTitles[modal.type]?.[modal.mode] : ""}
          </span>
        }
        onCancel={() => setModal(null)}
        onOk={onSave}
        okText={modal?.mode === "edit" ? "Mentés" : "Hozzáadás"}
        cancelText="Mégse"
        okButtonProps={{ loading: saving, className: "trz-modal-ok" }}
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="trz-modal-form">
          {modalFields()}
        </Form>
      </Modal>
    </div>
  );
}

export default Torzsadatok;