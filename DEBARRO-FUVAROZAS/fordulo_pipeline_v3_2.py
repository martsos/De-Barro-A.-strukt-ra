"""
FORDULO_PIPELINE v3.0
=====================
GPS területi érintések alapján forduló-ciklus elemző + MySQL integráció.

Input:
  - iFleet napi GPS export (legfrissebb fájl auto-detektálva)
  - Szállítás lekövető xlsm (terv adatok)

Output:
  - MySQL: fact_fordulo tábla feltöltése
  - Konzol riport

Fájlstruktúra (config.py-ban állítható):
  GPS mappa:   Y:/Fuvarozás/2026/Forduló számlálás/Napi riportok/
  Terv fájl:   Y:/Fuvarozás/2026/Forduló számlálás/Napi terv-tény diszp naplo/...xlsm
  GPS minta:   ifleet-bovitett-riport-Útdíjas-YYYYMMDD-YYYYMMDD.xlsx

Szükséges csomagok:
  pip install pandas openpyxl mysql-connector-python python-dotenv

Futtatás:
  python fordulo_pipeline_v3.py
  python fordulo_pipeline_v3.py --datum 2026-05-20   # konkrét napra
  python fordulo_pipeline_v3.py --dry-run             # DB írás nélkül
"""

import argparse
import re
import warnings
from datetime import date, datetime, timedelta
from pathlib import Path

import mysql.connector
import pandas as pd
from dotenv import load_dotenv
import os

warnings.filterwarnings('ignore')
load_dotenv("validate.env")

# ============================================================
#  KONFIGURÁCIÓ
# ============================================================

GPS_MAPPA   = Path(r"\\10.1.1.50\NaS\Fuvarozás\2026\Forduló számlálás\Napi riportok")
TERV_FAJL   = Path(r"\\10.1.1.50\NaS\Fuvarozás\2026\Forduló számlálás\Napi terv-tény diszp naplo")

# GPS fájlnév minta: ifleet-bovitett-riport-Útdíjas-20260520-20260520.xlsx
GPS_MINTA   = re.compile(r"ifleet-bovitett-riport.*?-(\d{8})-(\d{8})\.xlsx$", re.IGNORECASE)

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "debarro_uzemanyag"),
    "charset":  "utf8mb4",
}

# ---------------------------------------------------------------
#  ZÓNA DEFINÍCIÓK (iFleet geofence nevek)
# ---------------------------------------------------------------

TELEPHELY_ZONAK = [
    'Sziget ctp',
    'Szigetszentmiklós CTP',
    'Sziget mt.',
    'Vecsés 24PM038',
]

FELRAKO_ZONAK = [
    'Lasser',
    'Tb - Bánya',
    'Tb bánya',
]

LERAKO_ZONAK = {
    'Gubacsi':        ['Gubacsi'],
    'Érd':            ['Érd - CTP', 'Érd CTP - 25PM009'],
    'M1 billentő':    ['M1 billentõ', 'MÁNY BILLENTÕ'],
    'Bicske-Csabdi':  ['Bicske - Csabdi munkaterület', 'Bicske - Csabdi munkaterület 2'],
}


# ============================================================
#  SEGÉDFÜGGVÉNYEK
# ============================================================

def fmt(ts):
    return ts.strftime('%H:%M') if pd.notna(ts) else '–'

def perc(t1, t2):
    if t1 is None or t2 is None: return None
    if pd.isna(t1) or pd.isna(t2): return None
    return round((t2 - t1).total_seconds() / 60, 1)

def ido_str(percek):
    if percek is None: return '–'
    p = int(percek)
    h, m = p // 60, p % 60
    return f"{h}ó {m}p" if h > 0 else f"{m}p"

def rendszam_tisztit(nyers: str) -> str:
    """'AOBJ-672 (debarro_mobil100)' → 'AOBJ-672'"""
    return nyers.split('(')[0].strip() if '(' in str(nyers) else str(nyers).strip()


# ============================================================
#  GPS FÁJL KERESÉS – legfrissebb fájl auto-detektálás
# ============================================================

def legfrissebb_gps_fajl(mappa: Path, datum: date = None) -> Path | None:
    """
    Megkeresi a legfrissebb GPS export fájlt.
    Ha datum meg van adva, azt a napot keresi.
    Ha nincs, a legtávolabbi end-date-ű fájlt veszi.
    """
    if not mappa.exists():
        print(f"  ⚠ GPS mappa nem található: {mappa}")
        return None

    talalatok = []
    for f in mappa.iterdir():
        m = GPS_MINTA.match(f.name)
        if m:
            start_str, end_str = m.group(1), m.group(2)
            end_date = datetime.strptime(end_str, "%Y%m%d").date()
            if datum:
                start_date = datetime.strptime(start_str, "%Y%m%d").date()
                if start_date <= datum <= end_date:
                    talalatok.append((end_date, f))
            else:
                talalatok.append((end_date, f))

    if not talalatok:
        return None
    talalatok.sort(key=lambda x: x[0], reverse=True)
    return talalatok[0][1]


# ============================================================
#  TERV BEOLVASÁS – xlsm-ből dinamikusan
# ============================================================

def terv_fajl_keresese(mappa: Path) -> Path | None:
    """Megkeresi az xlsm fájlt a terv mappában."""
    if mappa.is_file():
        return mappa
    if mappa.is_dir():
        xlsm_fajlok = list(mappa.glob("*.xlsm")) + list(mappa.glob("*.xlsx"))
        if xlsm_fajlok:
            return xlsm_fajlok[0]
    return None

def load_terv(terv_path: Path, datum: date = None) -> dict:
    """
    Beolvassa a szállítás lekövető xlsm-t és visszaadja a TERV dict-et.
    
    Struktúra: rendszám → lista of {lerakó, anyag, terv_db, kolléga, honnan, hova}
    
    Az xlsm oszlopai:
      Erőforrás, Dátum, Honnan, Hova, Mit (Ömlesztett és Darabáru),
      Tervezett forduló, Teljesített forduló, Sofőr, Tevékenység
    """
    if not terv_path or not terv_path.exists():
        print(f"  ⚠ Terv fájl nem található: {terv_path}")
        return {}

    try:
        df = pd.read_excel(terv_path, sheet_name='Szállítás lekövető')
    except Exception as e:
        print(f"  ⚠ Terv fájl olvasási hiba: {e}")
        return {}

    # Dátum normalizálás
    df['Dátum'] = pd.to_datetime(df['Dátum'], errors='coerce')

    # Szűrés dátumra ha meg van adva
    if datum:
        df = df[df['Dátum'].dt.date == datum]

    # Csak ömlesztett áru és forduló-releváns sorok
    omle = df[df['Tevékenység'] == 'Ömlesztett áru'].copy()
    if omle.empty:
        return {}

    terv = {}
    for _, sor in omle.iterrows():
        rendszam = rendszam_tisztit(str(sor.get('Erőforrás', '')))
        if not rendszam or rendszam == 'nan':
            continue

        honnan  = str(sor.get('Honnan (Település, munkaterület)', '') or '')
        hova    = str(sor.get('Hova (Település, munkaterület)', '') or '')
        anyag   = str(sor.get('Mit', '') or sor.get('Mit (Ömlesztett és Darabáru)', '') or '')
        kollegak = str(sor.get('Sofőr', '') or '')
        terv_db = sor.get('Tervezett forduló', 0)

        try:
            terv_db = int(float(terv_db)) if pd.notna(terv_db) else 0
        except:
            terv_db = 0

        # Lerakó azonosítás a "Hova" oszlopból
        lerako_nev = _hova_lerakora(hova)

        if rendszam not in terv:
            terv[rendszam] = []

        terv[rendszam].append({
            'lerakó':   lerako_nev,
            'anyag':    anyag,
            'terv_db':  terv_db,
            'kolléga':  kollegak,
            'honnan':   honnan,
            'hova':     hova,
            'datum':    sor.get('Dátum'),
        })

    return terv

def _hova_lerakora(hova: str) -> str:
    """'Érd (CTP)' → 'Érd', 'Gubacsi' → 'Gubacsi' stb."""
    hova_l = hova.lower()
    for lerako_nev, zonak in LERAKO_ZONAK.items():
        for zona in zonak:
            if zona.lower() in hova_l:
                return lerako_nev
    # Fallback: első szó nagybetűsítve
    if hova:
        return hova.split('(')[0].strip()
    return 'Ismeretlen'


# ============================================================
#  ZÓNA MAP ÉPÍTÉS
# ============================================================

def build_zona_map():
    zona_map = {}
    for z in TELEPHELY_ZONAK:
        zona_map[z] = ('TELEPHELY', None)
    for z in FELRAKO_ZONAK:
        zona_map[z] = ('FELRAKÓ', None)
    for lerako_nev, zonak in LERAKO_ZONAK.items():
        for z in zonak:
            zona_map[z] = ('LERAKÓ', lerako_nev)
    return zona_map

ZONA_MAP = build_zona_map()

def zona_tipus(zona_nev):
    return ZONA_MAP.get(zona_nev, ('EGYÉB', None))


# ============================================================
#  GPS ADAT BETÖLTÉS
# ============================================================

def load_gps(path: Path) -> pd.DataFrame:
    """
    Beolvassa az iFleet bővített riport xlsx-et.
    Struktúra: járművenként ismétlődő fejléc blokkok,
    esemény oszlopban: terület belépés:ZONA / terület kilépés:ZONA.
    Az időpontok timedelta objektumok.
    """
    raw = pd.read_excel(path, header=None)

    def td_to_datetime(td, base_date):
        if isinstance(td, timedelta):
            total_sec = int(td.total_seconds())
            h, rem = divmod(total_sec, 3600)
            m, s   = divmod(rem, 60)
            return datetime(base_date.year, base_date.month, base_date.day, h % 24, m, s)
        return None

    rendszam = None
    kollegak = None
    datum    = None
    sorok    = []

    for _, row in raw.iterrows():
        c0 = str(row[0]) if pd.notna(row[0]) else ""
        c2 = str(row[2]) if pd.notna(row[2]) else ""
        c9 = str(row[9]) if pd.notna(row[9]) else ""

        if re.match(r"^(AOBJ|AIDI|RSD|LJY|LPK|MED|POL|ROV|TBY|KEB|KHG)\-", c0):
            rendszam = c0.split("(")[0].strip()
            continue

        if re.match(r"^\d{4}\.\d{2}\.\d{2}", c0):
            try:
                datum = datetime.strptime(c0.split(",")[0].strip(), "%Y.%m.%d").date()
            except Exception:
                pass
            kollegak = c2 if c2 != "nan" else ""
            continue

        if "terület belépés:" in c9 or "terület kilépés:" in c9:
            irany = "belépés" if "terület belépés:" in c9 else "kilépés"
            zona  = c9.split(":")[1].strip()
            ts    = td_to_datetime(row[3], datum) if pd.notna(row[3]) and datum else None
            km    = row[5] if pd.notna(row[5]) else None

            sorok.append({
                "rendszám":       rendszam,
                "rendszam_tiszta": rendszam,
                "kolléga":        kollegak,
                "datum":          datum,
                "dátum":          ts,
                "irány":          irany,
                "terület név":    zona,
                "km_ora":         km,
            })

    df = pd.DataFrame(sorok)
    df = df[df["dátum"].notna()].copy()
    df = df.sort_values(["rendszam_tiszta", "dátum"]).reset_index(drop=True)
    return df


# ============================================================
#  RELEVÁNS ESEMÉNY ELŐKÉSZÍTÉS
# ============================================================

def prep_events(jarmű_df: pd.DataFrame) -> pd.DataFrame:
    df = jarmű_df.copy()
    df['zona_typ']   = df['terület név'].apply(lambda z: zona_tipus(z)[0])
    df['lerako_nev'] = df['terület név'].apply(lambda z: zona_tipus(z)[1])
    priority = {'TELEPHELY': 0, 'FELRAKÓ': 1, 'LERAKÓ': 2, 'EGYÉB': 3}
    df['pri'] = df['zona_typ'].map(priority)
    rel = df[df['zona_typ'] != 'EGYÉB'].copy()
    rel = rel.sort_values(['dátum', 'pri']).drop_duplicates(
        subset=['dátum', 'irány'], keep='first'
    ).reset_index(drop=True)
    return rel


# ============================================================
#  FORDULÓ DETEKTÁLÁS – STATE MACHINE (változatlan logika)
# ============================================================

def detect_fordulok(rel: pd.DataFrame) -> dict:
    rows = rel.to_dict('records')
    n = len(rows)
    nap_kezd = None
    nap_vege = None
    fordulok = []
    nyitott  = False
    state    = 'INIT'
    current  = {}
    i        = 0

    def collect_felrako(start_i):
        be_times, ki_times = [], []
        j = start_i
        while j < n and rows[j]['zona_typ'] == 'FELRAKÓ':
            if rows[j]['irány'] == 'belépés': be_times.append(rows[j]['dátum'])
            if rows[j]['irány'] == 'kilépés': ki_times.append(rows[j]['dátum'])
            j += 1
        return (min(be_times) if be_times else None,
                max(ki_times) if ki_times else None, j)

    def collect_lerako(start_i):
        be_times, ki_times, lerako_nevek = [], [], []
        j = start_i
        while j < n and rows[j]['zona_typ'] == 'LERAKÓ':
            if rows[j]['irány'] == 'belépés':
                be_times.append(rows[j]['dátum'])
                lerako_nevek.append(rows[j]['lerako_nev'])
            if rows[j]['irány'] == 'kilépés':
                ki_times.append(rows[j]['dátum'])
            j += 1
        return (min(be_times) if be_times else None,
                max(ki_times) if ki_times else None,
                lerako_nevek[0] if lerako_nevek else '?', j)

    while i < n:
        row = rows[i]
        zt  = row['zona_typ']
        ir  = row['irány']

        if zt == 'TELEPHELY' and ir == 'kilépés' and state == 'INIT':
            nap_kezd = row['dátum']
            state = 'FELRAKO_VARJ'
            i += 1
            continue

        if zt == 'TELEPHELY' and ir == 'kilépés' and state in ('FELRAKO_VARJ', 'LERAKO_VARJ', 'LERAKO_UTAN'):
            nap_vege = None
            i += 1
            continue

        if zt == 'TELEPHELY' and ir == 'belépés':
            nap_vege = row['dátum']
            state = 'INIT'
            current = {}
            i += 1
            continue

        if zt == 'FELRAKÓ' and ir == 'belépés' and state == 'FELRAKO_VARJ':
            f_start, f_end, j = collect_felrako(i)
            current = {'f_start': f_start, 'f_end': f_end}
            state = 'LERAKO_VARJ'
            i = j if j > i else i + 1
            continue

        if zt == 'LERAKÓ' and ir == 'belépés' and state == 'LERAKO_VARJ':
            l_start, l_end, lerako_nev, j = collect_lerako(i)
            banyaban_p    = perc(current['f_start'], current['f_end'])
            menet_oda_p   = perc(current['f_end'], l_start)
            lebillentes_p = perc(l_start, l_end)
            teljes_kor_p  = perc(current['f_start'], l_end)
            rezsi_ref     = fordulok[-1]['l_end_ts'] if fordulok else nap_kezd
            rezsi_p       = perc(rezsi_ref, current['f_start'])

            fordulok.append({
                'szam':             len(fordulok) + 1,
                'lerakó':           lerako_nev,
                'f_start':          fmt(current['f_start']),
                'f_end':            fmt(current['f_end']),
                'l_start':          fmt(l_start),
                'l_end':            fmt(l_end),
                'f_start_ts':       current['f_start'],
                'f_end_ts':         current['f_end'],
                'l_start_ts':       l_start,
                'l_end_ts':         l_end,
                'rezsi_p':          rezsi_p,
                'banyaban_p':       banyaban_p,
                'menet_oda_p':      menet_oda_p,
                'lebillentes_p':    lebillentes_p,
                'teljes_kor_p':     teljes_kor_p,
            })
            state = 'LERAKO_UTAN'
            i = j if j > i else i + 1
            continue

        if zt == 'FELRAKÓ' and ir == 'belépés' and state == 'LERAKO_UTAN':
            f_start, f_end, j = collect_felrako(i)
            current = {'f_start': f_start, 'f_end': f_end}
            state = 'LERAKO_VARJ'
            i = j if j > i else i + 1
            continue

        i += 1

    if state == 'LERAKO_VARJ' and current.get('f_start'):
        nyitott = True

    return {
        'nap_kezd':        nap_kezd,
        'nap_vege':        nap_vege,
        'fordulok':        fordulok,
        'nyitott':         nyitott,
        'nyitott_f_start': current.get('f_start') if nyitott else None,
    }


# ============================================================
#  MEGJEGYZÉS GENERÁLÁS
# ============================================================

def megjegyzes_generalas(fordulok: list, nyitott: bool,
                          terv_sorok: list, teny_db: int) -> str:
    jegyzetek = []
    if nyitott:
        jegyzetek.append("Nyitott forduló – lerakás nem rögzült a GPS exportban")
    if terv_sorok:
        terv_db_ossz = sum(t.get('terv_db', 0) for t in terv_sorok)
        if teny_db < terv_db_ossz:
            jegyzetek.append(f"Tervtől elmarad: terv {terv_db_ossz} db, tény {teny_db} db")
        elif teny_db > terv_db_ossz:
            jegyzetek.append(f"Tervteljesítés felett: terv {terv_db_ossz} db, tény {teny_db} db")
    return '; '.join(jegyzetek) if jegyzetek else None


# ============================================================
#  MySQL – TÁBLA LÉTREHOZÁS
# ============================================================

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS fact_fordulo (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    datum               DATE NOT NULL,
    rendszam            VARCHAR(20) NOT NULL,
    kollegak            VARCHAR(255),
    honnan              VARCHAR(255),
    hova                VARCHAR(255),
    lerako              VARCHAR(100),
    anyag               VARCHAR(255),
    fordulo_db_terv     SMALLINT,
    fordulo_db_teny     SMALLINT,
    fordulo_db_elteres  SMALLINT,
    nap_kezd            TIME,
    nap_vege            TIME,
    atlag_koridő_perc   DECIMAL(6,1),
    atlag_banyaban_perc DECIMAL(6,1),
    atlag_menet_perc    DECIMAL(6,1),
    atlag_billentes_perc DECIMAL(6,1),
    nyitott_fordulo     TINYINT(1) DEFAULT 0,
    megjegyzes          TEXT,
    gps_fajl            VARCHAR(255),
    letrehozva          DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_datum_rendszam_lerako (datum, rendszam, lerako)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

def db_connect():
    return mysql.connector.connect(**DB_CONFIG)

def tabla_letrehozas(conn):
    cur = conn.cursor()
    cur.execute(CREATE_TABLE_SQL)
    conn.commit()
    cur.close()


# ============================================================
#  MySQL – ADAT BETÖLTÉS
# ============================================================

UPSERT_SQL = """
INSERT INTO fact_fordulo
    (datum, rendszam, kollegak, honnan, hova, lerako, anyag,
     fordulo_db_terv, fordulo_db_teny, fordulo_db_elteres,
     nap_kezd, nap_vege, atlag_koridő_perc, atlag_banyaban_perc,
     atlag_menet_perc, atlag_billentes_perc, nyitott_fordulo,
     megjegyzes, gps_fajl)
VALUES
    (%s, %s, %s, %s, %s, %s, %s,
     %s, %s, %s,
     %s, %s, %s, %s,
     %s, %s, %s,
     %s, %s)
ON DUPLICATE KEY UPDATE
    kollegak            = VALUES(kollegak),
    honnan              = VALUES(honnan),
    hova                = VALUES(hova),
    anyag               = VALUES(anyag),
    fordulo_db_terv     = VALUES(fordulo_db_terv),
    fordulo_db_teny     = VALUES(fordulo_db_teny),
    fordulo_db_elteres  = VALUES(fordulo_db_elteres),
    nap_kezd            = VALUES(nap_kezd),
    nap_vege            = VALUES(nap_vege),
    atlag_koridő_perc   = VALUES(atlag_koridő_perc),
    atlag_banyaban_perc = VALUES(atlag_banyaban_perc),
    atlag_menet_perc    = VALUES(atlag_menet_perc),
    atlag_billentes_perc = VALUES(atlag_billentes_perc),
    nyitott_fordulo     = VALUES(nyitott_fordulo),
    megjegyzes          = VALUES(megjegyzes),
    gps_fajl            = VALUES(gps_fajl);
"""

def db_mentes(conn, sorok: list):
    cur = conn.cursor()
    inserted = 0
    updated  = 0
    for sor in sorok:
        cur.execute(UPSERT_SQL, sor)
        if cur.rowcount == 1:
            inserted += 1
        else:
            updated += 1
    conn.commit()
    cur.close()
    return inserted, updated


# ============================================================
#  ÁTLAG SZÁMÍTÁS FORDULÓKBÓL
# ============================================================

def atlagok(fordulok_lista: list, lerako_filter: str = None):
    lst = [f for f in fordulok_lista if lerako_filter is None or f['lerakó'] == lerako_filter]
    if not lst:
        return None, None, None, None

    def avg(key):
        vals = [f[key] for f in lst if f.get(key) is not None]
        return round(sum(vals) / len(vals), 1) if vals else None

    return avg('teljes_kor_p'), avg('banyaban_p'), avg('menet_oda_p'), avg('lebillentes_p')


# ============================================================
#  FŐ FELDOLGOZÓ
# ============================================================

def feldolgoz(datum: date = None, dry_run: bool = False):
    print(f"\n{'='*65}")
    print(f"  FORDULO PIPELINE v3.0  –  {'DRY RUN' if dry_run else 'ÉLES'}")
    print(f"{'='*65}\n")

    # --- GPS fájl keresés ---
    gps_path = legfrissebb_gps_fajl(GPS_MAPPA, datum)
    if gps_path is None:
        print("❌ Nem található GPS export fájl!")
        return
    print(f"[GPS]  {gps_path.name}")

    # --- Terv fájl ---
    terv_path = terv_fajl_keresese(TERV_FAJL)
    print(f"[TERV] {terv_path.name if terv_path else 'NEM TALÁLHATÓ'}")

    # --- Betöltés ---
    gps = load_gps(gps_path)
    print(f"       {len(gps)} GPS esemény · {gps['rendszám'].nunique()} jármű")

    terv = load_terv(terv_path, datum)
    print(f"       {len(terv)} rendszám a tervben\n")

    # --- DB kapcsolat ---
    conn = None
    if not dry_run:
        try:
            conn = db_connect()
            tabla_letrehozas(conn)
            print("[DB]   Kapcsolódva, fact_fordulo tábla kész\n")
        except Exception as e:
            print(f"❌ DB hiba: {e}")
            return

    # --- Feldolgozás ---
    combók = gps[['datum', 'rendszam_tiszta']].drop_duplicates().values.tolist()
    db_sorok = []
    ossz_inserted = ossz_updated = 0

    for datum_nap, rendszam in combók:
        # Csak ömlesztett áruval foglalkozó gépek
        if rendszam not in terv and not any(
            rendszam in k for k in terv.keys()
        ):
            # Ha nincs tervben, csak akkor dolgozzuk fel ha van FELRAKÓ érintés
            j_events = gps[(gps['datum'] == datum_nap) & (gps['rendszam_tiszta'] == rendszam)]
            rel = prep_events(j_events)
            if rel.empty or 'FELRAKÓ' not in rel['zona_typ'].values:
                continue

        j_events = gps[(gps['datum'] == datum_nap) & (gps['rendszam_tiszta'] == rendszam)].copy()
        rel = prep_events(j_events)
        if rel.empty:
            continue

        eredmeny  = detect_fordulok(rel)
        fordulok  = eredmeny['fordulok']
        nap_kezd  = eredmeny['nap_kezd']
        nap_vege  = eredmeny['nap_vege']
        nyitott   = eredmeny['nyitott']

        if not fordulok and not nyitott:
            continue

        terv_sorok = terv.get(rendszam, [])

        # Adatok kinyerése terv sorból
        kollegak = terv_sorok[0].get('kolléga', '') if terv_sorok else ''
        honnan   = terv_sorok[0].get('honnan', '') if terv_sorok else ''
        hova     = terv_sorok[0].get('hova', '') if terv_sorok else ''
        anyag    = terv_sorok[0].get('anyag', '') if terv_sorok else ''

        # Lerakók szétbontása (egy gép több lerakóra is mehet)
        lerako_csoportok = {}
        for f in fordulok:
            lerako_csoportok.setdefault(f['lerakó'], []).append(f)
        if not lerako_csoportok:
            lerako_csoportok = {'Ismeretlen': []}

        for lerako_nev, fordulok_lerako in lerako_csoportok.items():
            teny_db = len(fordulok_lerako)

            # Terv db az adott lerakóra
            terv_db = 0
            for t in terv_sorok:
                if t.get('lerakó', '').lower() in lerako_nev.lower() or \
                   lerako_nev.lower() in t.get('hova', '').lower():
                    terv_db = t.get('terv_db', 0)
                    if t.get('anyag'):
                        anyag = t['anyag']
                    break

            elteres = teny_db - terv_db
            kor_atl, banya_atl, menet_atl, bill_atl = atlagok(fordulok_lerako)

            megjegyzes = megjegyzes_generalas(
                fordulok_lerako, nyitott, terv_sorok, teny_db
            )

            nap_kezd_str = nap_kezd.strftime('%H:%M:%S') if nap_kezd and pd.notna(nap_kezd) else None
            nap_vege_str = nap_vege.strftime('%H:%M:%S') if nap_vege and pd.notna(nap_vege) else None

            db_sorok.append((
                datum_nap,          # datum
                rendszam,           # rendszam
                kollegak,           # kollegak
                honnan,             # honnan
                lerako_nev,         # hova (lerakó)
                lerako_nev,         # lerako
                anyag,              # anyag
                terv_db,            # fordulo_db_terv
                teny_db,            # fordulo_db_teny
                elteres,            # fordulo_db_elteres
                nap_kezd_str,       # nap_kezd
                nap_vege_str,       # nap_vege
                kor_atl,            # atlag_koridő_perc
                banya_atl,          # atlag_banyaban_perc
                menet_atl,          # atlag_menet_perc
                bill_atl,           # atlag_billentes_perc
                1 if nyitott else 0,# nyitott_fordulo
                megjegyzes,         # megjegyzes
                gps_path.name,      # gps_fajl
            ))

            # Konzol
            status = '✓' if elteres == 0 else (f'+{elteres}' if elteres > 0 else str(elteres))
            print(f"  [{datum_nap}] {rendszam:12s} → {lerako_nev:15s} | "
                  f"Tény: {teny_db} db | Terv: {terv_db} db | {status}"
                  + (" ⚠ NYITOTT" if nyitott else ""))

    # --- DB írás ---
    if not dry_run and conn and db_sorok:
        ossz_inserted, ossz_updated = db_mentes(conn, db_sorok)
        conn.close()
        print(f"\n✅ DB: {ossz_inserted} új sor, {ossz_updated} frissítve")
    elif dry_run:
        print(f"\n[DRY RUN] {len(db_sorok)} sor lett volna írva a DB-be")
    else:
        print("\nℹ️  Nincs írandó adat.")

    print()


# ============================================================
#  BELÉPÉSI PONT
# ============================================================

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Forduló Pipeline v3.0')
    parser.add_argument('--datum', type=str, help='Feldolgozandó dátum YYYY-MM-DD formátumban')
    parser.add_argument('--dry-run', action='store_true', help='DB írás nélkül fut')
    args = parser.parse_args()

    datum = None
    if args.datum:
        try:
            datum = datetime.strptime(args.datum, '%Y-%m-%d').date()
        except ValueError:
            print(f"❌ Hibás dátum formátum: {args.datum} (YYYY-MM-DD kell)")
            exit(1)

    feldolgoz(datum=datum, dry_run=args.dry_run)
