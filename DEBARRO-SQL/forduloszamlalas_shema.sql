-- ============================================================
--  fact_fordulo – GPS alapú forduló számlálás fact tábla
--  A meglévő debarro_uzemanyag DB-be illeszthető
--  Futtatás: mysql -u root -p debarro_uzemanyag < fact_fordulo.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS fact_fordulo (
    id                      INT AUTO_INCREMENT PRIMARY KEY,

    -- Ki, mikor, mivel
    datum                   DATE NOT NULL,
    rendszam                VARCHAR(20) NOT NULL,
    kollegak                VARCHAR(255)        COMMENT 'Sofőr(ök) neve a terv alapján',

    -- Honnan–Hova
    honnan                  VARCHAR(255)        COMMENT 'Felrakó helyszín (terv)',
    hova                    VARCHAR(255)        COMMENT 'Lerakó helyszín (terv)',
    lerako                  VARCHAR(100)        COMMENT 'GPS-ből azonosított lerakó zóna neve',

    -- Mit szállított
    anyag                   VARCHAR(255)        COMMENT 'Szállított anyag a terv alapján',

    -- Forduló számok
    fordulo_db_terv         SMALLINT            COMMENT 'Tervezett forduló darabszám',
    fordulo_db_teny         SMALLINT            COMMENT 'GPS-ből detektált tény forduló',
    fordulo_db_elteres      SMALLINT            COMMENT 'Tény - Terv (negatív = elmaradás)',

    -- Időzítés
    nap_kezd                TIME                COMMENT 'Telephely elhagyás ideje',
    nap_vege                TIME                COMMENT 'Telephely visszaérkezés ideje',

    -- Átlagok (percben) – az adott nap összes fordulójának átlaga
    atlag_koridő_perc       DECIMAL(6,1)        COMMENT 'Átlag teljes kör idő (felrakás start → lerakás vége)',
    atlag_banyaban_perc     DECIMAL(6,1)        COMMENT 'Átlag bányában töltött idő',
    atlag_menet_perc        DECIMAL(6,1)        COMMENT 'Átlag menet oda (felrakás vége → lerakás start)',
    atlag_billentes_perc    DECIMAL(6,1)        COMMENT 'Átlag lebillentési idő a lerakónál',

    -- Minőség jelzők
    nyitott_fordulo         TINYINT(1) DEFAULT 0 COMMENT '1 ha volt nyitott (lerakás nélkül maradt) forduló',
    ervenyes                TINYINT(1) DEFAULT 1 COMMENT '0 ha az adat gyanús / manuálisan megjelölt',
    megjegyzes              TEXT                COMMENT 'Auto generált + manuális megjegyzések',

    -- Meta
    gps_fajl                VARCHAR(255)        COMMENT 'Forrás GPS export fájl neve',
    letrehozva              DATETIME DEFAULT CURRENT_TIMESTAMP,
    modositva               DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Egyedi kulcs: egy nap + rendszám + lerakó kombinációja egyszer szerepelhet
    -- (ha egy gép két lerakóra is visz, két sor lesz)
    UNIQUE KEY uq_datum_rendszam_lerako (datum, rendszam, lerako),

    -- Indexek a várható lekérdezési mintákhoz
    INDEX idx_datum (datum),
    INDEX idx_rendszam (rendszam),
    INDEX idx_datum_rendszam (datum, rendszam),
    INDEX idx_ervenyes (ervenyes)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='GPS területi érintések alapján számolt napi forduló összesítő';


-- ============================================================
--  VIEW – Napi forduló összesítő (API-hoz, frontendhez)
-- ============================================================

CREATE OR REPLACE VIEW vw_fordulo_napi AS
SELECT
    f.datum,
    f.rendszam,
    f.kollegak,
    f.honnan,
    f.hova,
    f.lerako,
    f.anyag,
    f.fordulo_db_terv,
    f.fordulo_db_teny,
    f.fordulo_db_elteres,
    CASE
        WHEN f.fordulo_db_elteres = 0 THEN 'OK'
        WHEN f.fordulo_db_elteres > 0 THEN 'TERV_FELETT'
        ELSE 'ELMARADAS'
    END AS teljesites_status,
    f.nap_kezd,
    f.nap_vege,
    TIMEDIFF(f.nap_vege, f.nap_kezd) AS munkaidő,
    f.atlag_koridő_perc,
    f.atlag_banyaban_perc,
    f.atlag_menet_perc,
    f.atlag_billentes_perc,
    f.nyitott_fordulo,
    f.megjegyzes,
    f.ervenyes
FROM fact_fordulo f
WHERE f.ervenyes = 1
ORDER BY f.datum DESC, f.rendszam, f.lerako;


-- ============================================================
--  VIEW – Heti/havi összesítő rendszám szerint
-- ============================================================

CREATE OR REPLACE VIEW vw_fordulo_osszesito AS
SELECT
    rendszam,
    YEAR(datum)         AS ev,
    MONTH(datum)        AS ho,
    WEEK(datum, 1)      AS het,
    COUNT(*)            AS munkanapok,
    SUM(fordulo_db_terv)  AS ossz_terv,
    SUM(fordulo_db_teny)  AS ossz_teny,
    SUM(fordulo_db_elteres) AS ossz_elteres,
    ROUND(AVG(atlag_koridő_perc), 1)    AS atlag_kor_perc,
    ROUND(AVG(atlag_banyaban_perc), 1)  AS atlag_banya_perc,
    ROUND(AVG(atlag_menet_perc), 1)     AS atlag_menet_perc,
    ROUND(AVG(atlag_billentes_perc), 1) AS atlag_bill_perc,
    SUM(nyitott_fordulo) AS nyitott_napok
FROM fact_fordulo
WHERE ervenyes = 1
GROUP BY rendszam, ev, ho, het
ORDER BY ev DESC, ho DESC, het DESC, rendszam;