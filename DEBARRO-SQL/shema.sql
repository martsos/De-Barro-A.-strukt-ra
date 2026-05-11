CREATE TABLE dim_ceg (
    ceg_id           INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    ceg_nev          VARCHAR(255) NOT NULL,
    ceg_egyeb        VARCHAR(255) NULL,
    tulajdonos_neve  VARCHAR(255) NOT NULL,
    kapcsolattarto   VARCHAR(255) NULL,
    CONSTRAINT pk_dim_ceg     PRIMARY KEY (ceg_id),
    CONSTRAINT uq_dim_ceg_nev UNIQUE      (ceg_nev)
); 


CREATE TABLE dim_lokacio (
    lokacio_id     INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    lokacio_nev    VARCHAR(255) NOT NULL,
    helyrajzi_szam VARCHAR(100) NULL,
    hosszusagi_fok DECIMAL(10,7) NULL,
    szelessegi_fok DECIMAL(10,7) NULL,
    CONSTRAINT pk_dim_lokacio     PRIMARY KEY (lokacio_id),
    CONSTRAINT uq_dim_lokacio_nev UNIQUE      (lokacio_nev)
);

CREATE TABLE dim_fogyoanyag (
    anyag_id         INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    anyag_megnevezes VARCHAR(255) NOT NULL,
    tulajdonos_id    INT          UNSIGNED NULL,
    anyag_kategoria VARCHAR(150) NOT NULL,
    CONSTRAINT pk_dim_fogyoanyag          PRIMARY KEY (anyag_id),
    CONSTRAINT uq_dim_fogyoanyag_megnevez UNIQUE (anyag_megnevezes),
    CONSTRAINT fk_fogyoanyag_tulajdonos   FOREIGN KEY (tulajdonos_id)
        REFERENCES dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE dim_tartaly (
    tartaly_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    tartaly_szam         VARCHAR(100) NOT NULL,

    tartaly_lokacio_id   INT UNSIGNED NOT NULL,

    tartaly_tipus        VARCHAR(20) NOT NULL
        CHECK (tartaly_tipus IN ('FIX','MOBIL','KANNA')),

    befogado_kepesseg_l  DECIMAL(10,2) UNSIGNED NOT NULL
        CHECK (befogado_kepesseg_l > 0),

    egyeb_alapadatok     VARCHAR(255) NULL,

    anyag_id             INT UNSIGNED NOT NULL,

    CONSTRAINT pk_dim_tartaly PRIMARY KEY (tartaly_id),

    CONSTRAINT uq_tartaly_lokacio_szam UNIQUE (tartaly_lokacio_id, tartaly_szam),

    CONSTRAINT fk_tartaly_lokacio FOREIGN KEY (tartaly_lokacio_id)
        REFERENCES dim_lokacio (lokacio_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_tartaly_anyag FOREIGN KEY (anyag_id)
        REFERENCES dim_fogyoanyag (anyag_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE dim_ido (
    datum_id   INT         NOT NULL,
    datum      DATE        NOT NULL,
    ev         INT         NOT NULL,
    negyed     CHAR(2)     NOT NULL,
    honap_szam INT         NOT NULL,
    honap_nev  VARCHAR(20) NOT NULL,
    het_szam   INT         NOT NULL,
    nap_szam   INT         NOT NULL,
    nap_nev    VARCHAR(20) NOT NULL,
    nap_tipusa VARCHAR(20) NOT NULL,
    unnep_neve VARCHAR(100) NULL,
    CONSTRAINT pk_dim_ido    PRIMARY KEY (datum_id),
    CONSTRAINT uq_dim_datum  UNIQUE      (datum)
);

CREATE TABLE dim_jarmuvek (
    eszkoz_sk             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    
    eszkoz_id             VARCHAR(20)  NULL,      -- belső / üzleti azonosító
    rendszam              VARCHAR(20)  NULL,      -- rendszám (ha van)
    
    eszkoz_kategoria      VARCHAR(50)  NOT NULL,  -- pl: KAMION, MUNKAGEP
    debarro_csoportositas VARCHAR(50)  NULL,
    
    gyartmany             VARCHAR(50)  NULL,
    tipus                 VARCHAR(50)  NULL,
    eroforras_fajta       VARCHAR(50)  NULL,      -- pl: DIESEL, BENZIN
    
    uzembentarto_id       INT UNSIGNED NULL,
    tulajdonos_id         INT UNSIGNED NULL,
    
    alvazszam             VARCHAR(50)  NULL,
    megnevezes            VARCHAR(255) NULL,

    CONSTRAINT pk_dim_jarmuvek PRIMARY KEY (eszkoz_sk),

    -- üzleti kulcsok
    CONSTRAINT uq_dim_jarmuvek_eszkoz_id UNIQUE (eszkoz_id),
    CONSTRAINT uq_dim_jarmuvek_rendszam  UNIQUE (rendszam),
    CONSTRAINT uq_dim_jarmuvek_alvaz     UNIQUE (alvazszam),

    -- kapcsolatok
    CONSTRAINT fk_jarmuvek_uzembentarto FOREIGN KEY (uzembentarto_id)
        REFERENCES dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_jarmuvek_tulajdonos FOREIGN KEY (tulajdonos_id)
        REFERENCES dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE dim_jarmuvek_allapot (
    eszkoz_sk        INT UNSIGNED NOT NULL,
    aktualis_km      DECIMAL(10,2) NULL,
    aktualis_uzemora DECIMAL(10,2) NULL,
    utolso_mozgas    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_jarmuvek_allapot PRIMARY KEY (eszkoz_sk),
    CONSTRAINT fk_jarmuvek_allapot FOREIGN KEY (eszkoz_sk)
        REFERENCES dim_jarmuvek (eszkoz_sk)
        ON UPDATE CASCADE ON DELETE RESTRICT
); -- Új tábla implementációja KM, és Gépüzemóra nyilvántartásra


CREATE TABLE dim_munkaero (
    foglalkoztatott_id    INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    foglalkoztatott_nev   VARCHAR(255) NOT NULL,
    foglalkoztato_id      INT          UNSIGNED NULL,
    foglalkoztatas_tipusa VARCHAR(100) NULL,
    munkaora              INT          UNSIGNED NULL,
    CONSTRAINT pk_dim_munkaero           PRIMARY KEY (foglalkoztatott_id),
    CONSTRAINT fk_munkaero_foglalkoztato FOREIGN KEY (foglalkoztato_id)
        REFERENCES dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- ============================================================
-- FACT TÁBLÁK
-- ============================================================

-- ------------------------------------------------------------
-- fact_tankolas
-- Ki, mikor, melyik tartályból, melyik járműnek, mennyit adott ki
-- ------------------------------------------------------------
CREATE TABLE fact_keszlet_kiadas (
    kiadas_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    datum_id            INT NOT NULL,

    kiado_szemely_id    INT UNSIGNED NULL,
    gepkezelo_id        INT UNSIGNED NULL,

    tartaly_id          INT UNSIGNED NOT NULL,
    eszkoz_sk           INT UNSIGNED NOT NULL,

    gepuzemora_eloz     DECIMAL(10,2) NULL,
    gepuzemora_akt      DECIMAL(10,2) NULL,

    km_eloz             DECIMAL(10,2) NULL,
    km_akt              DECIMAL(10,2) NULL,

    kiadott_liter       DECIMAL(10,2) NOT NULL,

    ervenyes BOOLEAN DEFAULT TRUE,
    hiba_uzenet VARCHAR(255),

    CONSTRAINT pk_fact_keszlet_kiadas PRIMARY KEY (kiadas_id),

    CONSTRAINT fk_kiadas_datum FOREIGN KEY (datum_id)
        REFERENCES dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_kiadas_kiado FOREIGN KEY (kiado_szemely_id)
        REFERENCES dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_kiadas_gepkezelo FOREIGN KEY (gepkezelo_id)
        REFERENCES dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_kiadas_tartaly FOREIGN KEY (tartaly_id)
        REFERENCES dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_kiadas_eszkoz FOREIGN KEY (eszkoz_sk)
        REFERENCES dim_jarmuvek (eszkoz_sk)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_liter_positive
        CHECK (kiadott_liter > 0)

);


-- ------------------------------------------------------------
-- fact_tartaly_feltoltes
-- Mikor, melyik fix tartályt, ki vette át, kitől, mennyiért
-- ------------------------------------------------------------
CREATE TABLE fact_keszlet_bevet (
    bevet_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    datum_id         INT NOT NULL,
    tartaly_id       INT UNSIGNED NOT NULL,

    atvevo_id        INT UNSIGNED NULL,
    szallito_id      INT UNSIGNED NULL,

    kezdo_liter      DECIMAL(10,2) NOT NULL CHECK (kezdo_liter >= 0),
    bejovo_liter     DECIMAL(10,2) NOT NULL CHECK (bejovo_liter >= 0),
    zaro_liter       DECIMAL(10,2) NOT NULL CHECK (zaro_liter  >= 0),

    egysegar         DECIMAL(10,2) NULL CHECK (egysegar >= 0),
    szamla_szam      VARCHAR(100) NULL,

    ervenyes BOOLEAN DEFAULT TRUE,
    hiba_uzenet VARCHAR(255),

    CONSTRAINT pk_fact_keszlet_bevet PRIMARY KEY (bevet_id),

    CONSTRAINT fk_bevet_datum FOREIGN KEY (datum_id)
        REFERENCES dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_bevet_tartaly FOREIGN KEY (tartaly_id)
        REFERENCES dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_bevet_atvevo FOREIGN KEY (atvevo_id)
        REFERENCES dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_bevet_szallito FOREIGN KEY (szallito_id)
        REFERENCES dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL

);

-- ------------------------------------------------------------
-- fact_anyagfelvetel
-- Mobil vagy fix tartályból anyagfelvétel, KM állással
-- ------------------------------------------------------------
CREATE TABLE fact_keszlet_mozgas (
    mozgas_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    datum_id          INT NOT NULL,
    felvevo_id        INT UNSIGNED NULL,
    forras_tartaly_id INT UNSIGNED NOT NULL,
    cel_tartaly_id    INT UNSIGNED NOT NULL,
    pisztoly_oraallas DECIMAL(10,2) NULL,
    mozgatott_liter   DECIMAL(10,2) NOT NULL,
    anyag_id          INT UNSIGNED NOT NULL,
    ervenyes          BOOLEAN DEFAULT TRUE,
    hiba_uzenet       VARCHAR(255),
    CONSTRAINT pk_fact_keszlet_mozgas PRIMARY KEY (mozgas_id),
    CONSTRAINT chk_liter_pozitiv CHECK (mozgatott_liter > 0),
    CONSTRAINT fk_mozgas_datum FOREIGN KEY (datum_id)
        REFERENCES dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mozgas_felvevo FOREIGN KEY (felvevo_id)
        REFERENCES dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_mozgas_forras FOREIGN KEY (forras_tartaly_id)
        REFERENCES dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mozgas_cel FOREIGN KEY (cel_tartaly_id)
        REFERENCES dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mozgas_anyag FOREIGN KEY (anyag_id)
        REFERENCES dim_fogyoanyag (anyag_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

--Base structure modify--

CREATE TABLE dim_keszlet (
    tartaly_id      INT UNSIGNED NOT NULL,
    aktualis_liter  DECIMAL(10,2) NOT NULL DEFAULT 0,
    utolso_mozgas   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_dim_keszlet PRIMARY KEY (tartaly_id),
    CONSTRAINT fk_dim_keszlet FOREIGN KEY (tartaly_id)
        REFERENCES dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

ALTER TABLE fact_keszlet_kiadas 
ADD COLUMN pisztoly_oraallas DECIMAL(10,2) NULL AFTER km_akt;

ALTER TABLE fact_keszlet_mozgas 
DROP COLUMN pisztoly_oraallas;