-- ============================================================
-- VIEW 1: Tartályonkénti aktuális egyenleg
-- ============================================================
CREATE OR REPLACE VIEW vw_tartaly_egyenleg AS
SELECT
    t.tartaly_id,
    t.tartaly_szam,
    t.tartaly_tipus,
    t.befogado_kepesseg_l,
    f.anyag_megnevezes,
    l.lokacio_nev,
    COALESCE(dk.aktualis_liter, 0)          AS aktualis_liter,
    dk.utolso_mozgas,
    COALESCE(b.ossz_bevet,       0)         AS ossz_bevet,
    COALESCE(k.ossz_kiadott,     0)         AS ossz_kiadott,
    COALESCE(mo.ossz_mozgas_ki,  0)         AS ossz_mozgas_ki,
    COALESCE(mi.ossz_mozgas_be,  0)         AS ossz_mozgas_be
FROM dim_tartaly t
LEFT JOIN dim_fogyoanyag f  ON f.anyag_id       = t.anyag_id
LEFT JOIN dim_lokacio l     ON l.lokacio_id     = t.tartaly_lokacio_id
LEFT JOIN dim_keszlet dk    ON dk.tartaly_id    = t.tartaly_id
LEFT JOIN (
    SELECT tartaly_id, SUM(bejovo_liter) AS ossz_bevet
    FROM fact_keszlet_bevet
    WHERE ervenyes = TRUE
    GROUP BY tartaly_id
) b  ON b.tartaly_id = t.tartaly_id
LEFT JOIN (
    SELECT tartaly_id, SUM(kiadott_liter) AS ossz_kiadott
    FROM fact_keszlet_kiadas
    WHERE ervenyes = TRUE
    GROUP BY tartaly_id
) k  ON k.tartaly_id = t.tartaly_id
LEFT JOIN (
    SELECT forras_tartaly_id AS tartaly_id, SUM(mozgatott_liter) AS ossz_mozgas_ki
    FROM fact_keszlet_mozgas
    WHERE ervenyes = TRUE
    GROUP BY forras_tartaly_id
) mo ON mo.tartaly_id = t.tartaly_id
LEFT JOIN (
    SELECT cel_tartaly_id AS tartaly_id, SUM(mozgatott_liter) AS ossz_mozgas_be
    FROM fact_keszlet_mozgas
    WHERE ervenyes = TRUE
    GROUP BY cel_tartaly_id
) mi ON mi.tartaly_id = t.tartaly_id;


-- ============================================================
-- VIEW 2: Eszközönkénti utolsó km / üzemóra állás
-- ============================================================
CREATE VIEW vw_eszkoz_utolso_allapot AS
SELECT
    j.eszkoz_sk,
    j.eszkoz_id,
    j.rendszam,
    j.megnevezes,
    j.eszkoz_kategoria,
    k.km_akt         AS utolso_km,
    k.gepuzemora_akt AS utolso_uzemora,
    k.datum_id       AS utolso_datum
FROM dim_jarmuvek j

LEFT JOIN (
    SELECT eszkoz_sk, MAX(kiadas_id) AS max_id
    FROM fact_keszlet_kiadas
    WHERE km_akt IS NOT NULL
    GROUP BY eszkoz_sk
) x 
    ON x.eszkoz_sk = j.eszkoz_sk

LEFT JOIN fact_keszlet_kiadas k 
    ON k.kiadas_id = x.max_id;


-- ============================================================
-- VIEW 3: Napi kiadások összesítve
-- ============================================================
CREATE VIEW vw_napi_kiadasok AS
SELECT
    i.datum,
    i.ev,
    i.honap_nev,
    t.tartaly_szam,
    f.anyag_megnevezes,
    COUNT(k.kiadas_id)          AS kiadasi_db,
    SUM(k.kiadott_liter)        AS ossz_kiadott_liter
FROM fact_keszlet_kiadas k
JOIN dim_ido i      ON i.datum_id   = k.datum_id
JOIN dim_tartaly t  ON t.tartaly_id = k.tartaly_id
JOIN dim_fogyoanyag f ON f.anyag_id = t.anyag_id
GROUP BY
    i.datum, i.ev, i.honap_nev,
    t.tartaly_szam, f.anyag_megnevezes;


-- ============================================================
-- VIEW 4: Hibás / érvénytelen rekordok listája
-- ============================================================
CREATE VIEW vw_hibas_rekordok AS
SELECT
    'kiadas'            AS forras_tabla,
    kiadas_id           AS rekord_id,
    datum_id,
    hiba_uzenet
FROM fact_keszlet_kiadas
WHERE ervenyes = FALSE

UNION ALL

SELECT
    'bevet'             AS forras_tabla,
    bevet_id            AS rekord_id,
    datum_id,
    hiba_uzenet
FROM fact_keszlet_bevet
WHERE ervenyes = FALSE

UNION ALL

SELECT
    'mozgas'            AS forras_tabla,
    mozgas_id           AS rekord_id,
    datum_id,
    hiba_uzenet
FROM fact_keszlet_mozgas
WHERE ervenyes = FALSE;


-- ============================================================
-- VIEW 5: Bevételek szállítónként
-- ============================================================
CREATE VIEW vw_bevet_szallitokent AS
SELECT
    c.ceg_nev           AS szallito_nev,
    i.ev,
    i.honap_nev,
    t.tartaly_szam,
    f.anyag_megnevezes,
    COUNT(b.bevet_id)   AS bevet_db,
    SUM(b.bejovo_liter) AS ossz_bejovo_liter,
    CASE 
    WHEN SUM(b.bejovo_liter) > 0 
    THEN SUM(b.egysegar * b.bejovo_liter) / SUM(b.bejovo_liter)
    END AS atlag_egysegar
FROM fact_keszlet_bevet b
JOIN dim_ido i        ON i.datum_id    = b.datum_id
JOIN dim_tartaly t    ON t.tartaly_id  = b.tartaly_id
JOIN dim_fogyoanyag f ON f.anyag_id    = t.anyag_id
LEFT JOIN dim_ceg c   ON c.ceg_id      = b.szallito_id
GROUP BY
    c.ceg_nev, i.ev, i.honap_nev,
    t.tartaly_szam, f.anyag_megnevezes;