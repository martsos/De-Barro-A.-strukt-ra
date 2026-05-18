import fastapi
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from database import get_connection


app = fastapi.FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── GET ENDPOINTOK ────────────────────────────────────────────

@app.get("/")
def index():
    return {"STATUS": "De Barro API alive!:)"}

@app.get("/cegek")
def get_cegek():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT ceg_id, ceg_nev FROM dim_ceg")
    result = cursor.fetchall()
    conn.close()
    return result

@app.get("/tartaly")
def get_tartalyok():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""SELECT tartaly_id, tartaly_szam, tartaly_tipus, befogado_kepesseg_l, f.anyag_megnevezes FROM dim_tartaly t
        LEFT JOIN dim_fogyoanyag f ON t.anyag_id = f.anyag_id """)
    result = cursor.fetchall()
    conn.close()
    return result

@app.get("/jarmu")
def get_jarművek():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT eszkoz_sk, rendszam, megnevezes FROM dim_jarmuvek")
    result = cursor.fetchall()
    conn.close()
    return result

@app.get("/jarmuvek-allapot")
def get_jarmuvek_allapot():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT j.eszkoz_sk, j.rendszam, j.megnevezes,
               a.aktualis_km, a.aktualis_uzemora
        FROM dim_jarmuvek j
        LEFT JOIN dim_jarmuvek_allapot a ON j.eszkoz_sk = a.eszkoz_sk
    """)
    result = cursor.fetchall()
    conn.close()
    return result

@app.get("/alkalmazott")
def get_munkaero():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT foglalkoztatott_id, foglalkoztatott_nev FROM dim_munkaero")
    result = cursor.fetchall()
    conn.close()
    return result

@app.get("/lokacio")
def get_lokaciok():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT lokacio_id, lokacio_nev FROM dim_lokacio")
    result = cursor.fetchall()
    conn.close()
    return result

@app.get("/fogyoanyag")
def get_fogyoanyagok():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT anyag_id, anyag_megnevezes, anyag_kategoria FROM dim_fogyoanyag")
    result = cursor.fetchall()
    conn.close()
    return result

@app.get("/keszlet")
def get_keszlet():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT tartaly_id, aktualis_liter, utolso_mozgas FROM dim_keszlet")
    result = cursor.fetchall()
    conn.close()
    return result

# ─── POST ENDPOINTOK ───────────────────────────────────────────

class BEvetAdat(BaseModel):
    datum: str
    tartaly_szam: str
    atvevo_nev: str
    szallito_nev: str
    kezdo_liter: float
    bejovo_liter: float
    zaro_liter: float
    egysegar: float
    szamla_szam: str

@app.post("/keszlet-bevet")
def post_bevet(adat: BEvetAdat):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # LOOKUP – nevek → ID-k
    cursor.execute("SELECT datum_id FROM dim_ido WHERE datum = %s", (adat.datum,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Dátum nem található: {adat.datum}")
    datum_id = sor["datum_id"]

    cursor.execute("SELECT tartaly_id FROM dim_tartaly WHERE tartaly_szam = %s", (adat.tartaly_szam,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Tartály nem található: {adat.tartaly_szam}")
    tartaly_id = sor["tartaly_id"]

    cursor.execute("SELECT foglalkoztatott_id FROM dim_munkaero WHERE foglalkoztatott_nev = %s", (adat.atvevo_nev,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Átvevő nem található: {adat.atvevo_nev}")
    atvevo_id = sor["foglalkoztatott_id"]

    cursor.execute("SELECT ceg_id FROM dim_ceg WHERE ceg_nev = %s", (adat.szallito_nev,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Szállító cég nem található: {adat.szallito_nev}")
    szallito_id = sor["ceg_id"]

    # INSERT
    cursor.execute("""
        INSERT INTO fact_keszlet_bevet
            (datum_id, tartaly_id, atvevo_id, szallito_id,
             kezdo_liter, bejovo_liter, zaro_liter,
             egysegar, szamla_szam)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        datum_id, tartaly_id, atvevo_id, szallito_id,
        adat.kezdo_liter, adat.bejovo_liter, adat.zaro_liter,
        adat.egysegar, adat.szamla_szam
    ))
    conn.commit()

    # VISSZAOLVASÁS (trigger eredménye)
    bevet_id = cursor.lastrowid
    cursor.execute(
        "SELECT bevet_id, ervenyes, hiba_uzenet FROM fact_keszlet_bevet WHERE bevet_id = %s",
        (bevet_id,)
    )
    result = cursor.fetchone()
    conn.close()
    return JSONResponse(content=result)

# ─── KÉSZLET KIADÁS ────────────────────────────────────────────

from typing import Optional

class KiadasAdat(BaseModel):
    datum: str
    kiado_szemely_nev: str
    gepkezelo_nev: str
    tartaly_szam: str
    rendszam: str
    gepuzemora_eloz: Optional[float] = None
    gepuzemora_akt: Optional[float] = None
    km_eloz: Optional[float] = None
    km_akt: Optional[float] = None
    pisztoly_oraallas: Optional[float] = None
    kiadott_liter: float
    
@app.post("/keszlet-kiadas")
def post_kiadas(adat: KiadasAdat):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT datum_id FROM dim_ido WHERE datum = %s", (adat.datum,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Dátum nem található: {adat.datum}")
    datum_id = sor["datum_id"]

    cursor.execute("SELECT foglalkoztatott_id FROM dim_munkaero WHERE foglalkoztatott_nev = %s", (adat.kiado_szemely_nev,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Kiadó személy nem található: {adat.kiado_szemely_nev}")
    kiado_id = sor["foglalkoztatott_id"]

    cursor.execute("SELECT foglalkoztatott_id FROM dim_munkaero WHERE foglalkoztatott_nev = %s", (adat.gepkezelo_nev,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Gépkezelő nem található: {adat.gepkezelo_nev}")
    gepkezelo_id = sor["foglalkoztatott_id"]

    cursor.execute("SELECT tartaly_id FROM dim_tartaly WHERE tartaly_szam = %s", (adat.tartaly_szam,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Tartály nem található: {adat.tartaly_szam}")
    tartaly_id = sor["tartaly_id"]

    cursor.execute("SELECT eszkoz_sk FROM dim_jarmuvek WHERE rendszam = %s", (adat.rendszam,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Jármű nem található: {adat.rendszam}")
    eszkoz_sk = sor["eszkoz_sk"]

    cursor.execute("""
        INSERT INTO fact_keszlet_kiadas
            (datum_id, kiado_szemely_id, gepkezelo_id, tartaly_id, eszkoz_sk,
             gepuzemora_eloz, gepuzemora_akt, km_eloz, km_akt, pisztoly_oraallas, kiadott_liter)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        datum_id, kiado_id, gepkezelo_id, tartaly_id, eszkoz_sk,
        adat.gepuzemora_eloz, adat.gepuzemora_akt,
        adat.km_eloz, adat.km_akt, adat.pisztoly_oraallas, adat.kiadott_liter
    ))
    conn.commit()

    kiadas_id = cursor.lastrowid
    cursor.execute(
        "SELECT kiadas_id, ervenyes, hiba_uzenet FROM fact_keszlet_kiadas WHERE kiadas_id = %s",
        (kiadas_id,)
    )
    result = cursor.fetchone()
    conn.close()
    return JSONResponse(content=result)


# ─── KÉSZLET MOZGÁS ────────────────────────────────────────────

class MozgasAdat(BaseModel):
    datum: str
    felvevo_nev: str
    forras_tartaly_szam: str
    cel_tartaly_szam: str
    anyag_megnevezes: str
    mozgatott_liter: float

@app.post("/keszlet-mozgas")
def post_mozgas(adat: MozgasAdat):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT datum_id FROM dim_ido WHERE datum = %s", (adat.datum,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Dátum nem található: {adat.datum}")
    datum_id = sor["datum_id"]

    cursor.execute("SELECT foglalkoztatott_id FROM dim_munkaero WHERE foglalkoztatott_nev = %s", (adat.felvevo_nev,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Felvevő nem található: {adat.felvevo_nev}")
    felvevo_id = sor["foglalkoztatott_id"]

    cursor.execute("SELECT tartaly_id FROM dim_tartaly WHERE tartaly_szam = %s", (adat.forras_tartaly_szam,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Forrás tartály nem található: {adat.forras_tartaly_szam}")
    forras_tartaly_id = sor["tartaly_id"]

    cursor.execute("SELECT tartaly_id FROM dim_tartaly WHERE tartaly_szam = %s", (adat.cel_tartaly_szam,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Cél tartály nem található: {adat.cel_tartaly_szam}")
    cel_tartaly_id = sor["tartaly_id"]

    cursor.execute("SELECT anyag_id FROM dim_fogyoanyag WHERE anyag_megnevezes = %s", (adat.anyag_megnevezes,))
    sor = cursor.fetchone()
    if not sor:
        raise HTTPException(status_code=404, detail=f"Anyag nem található: {adat.anyag_megnevezes}")
    anyag_id = sor["anyag_id"]

    cursor.execute("""
        INSERT INTO fact_keszlet_mozgas
            (datum_id, felvevo_id, forras_tartaly_id, cel_tartaly_id,
             anyag_id, mozgatott_liter)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        datum_id, felvevo_id, forras_tartaly_id, cel_tartaly_id,
        anyag_id, adat.mozgatott_liter
    ))
    conn.commit()

    mozgas_id = cursor.lastrowid
    cursor.execute(
        "SELECT mozgas_id, ervenyes, hiba_uzenet FROM fact_keszlet_mozgas WHERE mozgas_id = %s",
        (mozgas_id,)
    )
    result = cursor.fetchone()
    conn.close()
    return JSONResponse(content=result)

    # ─── TRANZAKCIÓ ELŐZMÉNYEK ─────────────────────────────────────

@app.get("/tranzakciok/kiadas")
def get_kiadas_lista(
    tartaly_id: Optional[int] = None,
    datum_tol: Optional[str] = None,
    datum_ig: Optional[str] = None,
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """
        SELECT k.kiadas_id, i.datum,
               t.tartaly_szam,
               mn1.foglalkoztatott_nev AS kiado_szemely,
               mn2.foglalkoztatott_nev AS gepkezelo,
               j.rendszam, j.megnevezes,
               k.km_eloz, k.km_akt,
               k.gepuzemora_eloz, k.gepuzemora_akt,
               k.pisztoly_oraallas,
               k.kiadott_liter,
               k.ervenyes, k.hiba_uzenet
        FROM fact_keszlet_kiadas k
        JOIN  dim_ido i      ON i.datum_id              = k.datum_id
        JOIN  dim_tartaly t  ON t.tartaly_id             = k.tartaly_id
        LEFT JOIN dim_munkaero mn1 ON mn1.foglalkoztatott_id = k.kiado_szemely_id
        LEFT JOIN dim_munkaero mn2 ON mn2.foglalkoztatott_id = k.gepkezelo_id
        LEFT JOIN dim_jarmuvek j   ON j.eszkoz_sk            = k.eszkoz_sk
        WHERE 1=1
    """
    params = []
    if tartaly_id is not None:
        sql += " AND k.tartaly_id = %s"
        params.append(tartaly_id)
    if datum_tol:
        sql += " AND i.datum >= %s"
        params.append(datum_tol)
    if datum_ig:
        sql += " AND i.datum <= %s"
        params.append(datum_ig)
    sql += " ORDER BY i.datum DESC, k.kiadas_id DESC LIMIT 500"
    cursor.execute(sql, params)
    result = cursor.fetchall()
    conn.close()
    return result


@app.get("/tranzakciok/bevet")
def get_bevet_lista(
    tartaly_id: Optional[int] = None,
    datum_tol: Optional[str] = None,
    datum_ig: Optional[str] = None,
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """
        SELECT b.bevet_id, i.datum,
               t.tartaly_szam,
               mn.foglalkoztatott_nev AS atvevo,
               c.ceg_nev              AS szallito,
               b.kezdo_liter, b.bejovo_liter, b.zaro_liter,
               b.egysegar, b.szamla_szam,
               b.ervenyes, b.hiba_uzenet
        FROM fact_keszlet_bevet b
        JOIN  dim_ido i      ON i.datum_id              = b.datum_id
        JOIN  dim_tartaly t  ON t.tartaly_id             = b.tartaly_id
        LEFT JOIN dim_munkaero mn ON mn.foglalkoztatott_id = b.atvevo_id
        LEFT JOIN dim_ceg c       ON c.ceg_id              = b.szallito_id
        WHERE 1=1
    """
    params = []
    if tartaly_id is not None:
        sql += " AND b.tartaly_id = %s"
        params.append(tartaly_id)
    if datum_tol:
        sql += " AND i.datum >= %s"
        params.append(datum_tol)
    if datum_ig:
        sql += " AND i.datum <= %s"
        params.append(datum_ig)
    sql += " ORDER BY i.datum DESC, b.bevet_id DESC LIMIT 500"
    cursor.execute(sql, params)
    result = cursor.fetchall()
    conn.close()
    return result


@app.get("/tranzakciok/mozgas")
def get_mozgas_lista(
    tartaly_id: Optional[int] = None,
    datum_tol: Optional[str] = None,
    datum_ig: Optional[str] = None,
):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """
        SELECT m.mozgas_id, i.datum,
               tf.tartaly_szam AS forras_tartaly,
               tc.tartaly_szam AS cel_tartaly,
               mn.foglalkoztatott_nev AS felvevo,
               f.anyag_megnevezes,
               m.mozgatott_liter,
               m.ervenyes, m.hiba_uzenet
        FROM fact_keszlet_mozgas m
        JOIN  dim_ido i       ON i.datum_id               = m.datum_id
        JOIN  dim_tartaly tf  ON tf.tartaly_id             = m.forras_tartaly_id
        JOIN  dim_tartaly tc  ON tc.tartaly_id             = m.cel_tartaly_id
        LEFT JOIN dim_munkaero mn ON mn.foglalkoztatott_id = m.felvevo_id
        LEFT JOIN dim_fogyoanyag f ON f.anyag_id           = m.anyag_id
        WHERE 1=1
    """
    params = []
    if tartaly_id is not None:
        sql += " AND (m.forras_tartaly_id = %s OR m.cel_tartaly_id = %s)"
        params.extend([tartaly_id, tartaly_id])
    if datum_tol:
        sql += " AND i.datum >= %s"
        params.append(datum_tol)
    if datum_ig:
        sql += " AND i.datum <= %s"
        params.append(datum_ig)
    sql += " ORDER BY i.datum DESC, m.mozgas_id DESC LIMIT 500"
    cursor.execute(sql, params)
    result = cursor.fetchall()
    conn.close()
    return result