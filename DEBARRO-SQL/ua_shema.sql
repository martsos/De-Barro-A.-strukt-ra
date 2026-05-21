CREATE TABLE ua_dim_fogyoanyag (
    anyag_id         INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    anyag_megnevezes VARCHAR(255) NOT NULL,
    tulajdonos_id    INT          UNSIGNED NULL,
    anyag_kategoria VARCHAR(150) NOT NULL,
    allapot VARCHAR(20) NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),
    CONSTRAINT pk_ua_dim_fogyoanyag          PRIMARY KEY (anyag_id),
    CONSTRAINT uq_ua_dim_fogyoanyag_megnevez UNIQUE (anyag_megnevezes),
    CONSTRAINT fk_ua_fogyoanyag_tulajdonos   FOREIGN KEY (tulajdonos_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE ua_dim_tartaly (
    tartaly_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    tartaly_szam         VARCHAR(100) NOT NULL,

    tartaly_lokacio_id   INT UNSIGNED NOT NULL,

    tartaly_tipus        VARCHAR(20) NOT NULL
        CHECK (tartaly_tipus IN ('FIX','MOBIL','KANNA')),

    befogado_kepesseg_l  DECIMAL(10,2) UNSIGNED NOT NULL
        CHECK (befogado_kepesseg_l > 0),

    egyeb_alapadatok     VARCHAR(255) NULL,

    anyag_id             INT UNSIGNED NOT NULL,
    allapot VARCHAR(20) NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),

    CONSTRAINT pk_ua_dim_tartaly PRIMARY KEY (tartaly_id),

    CONSTRAINT uq_ua_tartaly_lokacio_szam UNIQUE (tartaly_lokacio_id, tartaly_szam),

    CONSTRAINT fk_ua_tartaly_lokacio FOREIGN KEY (tartaly_lokacio_id)
        REFERENCES core_dim_lokacio (lokacio_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_ua_tartaly_anyag FOREIGN KEY (anyag_id)
        REFERENCES ua_dim_fogyoanyag (anyag_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================================
-- FACT TÁBLÁK
-- ============================================================

-- ------------------------------------------------------------
-- fact_tankolas
-- Ki, mikor, melyik tartályból, melyik járműnek, mennyit adott ki
-- ------------------------------------------------------------
CREATE TABLE ua_fact_keszlet_kiadas (
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
    pisztoly_oraallas DECIMAL(10,2) NULL AFTER km_akt,

    ervenyes BOOLEAN DEFAULT TRUE,
    hiba_uzenet VARCHAR(255),

    CONSTRAINT pk_ua_fact_keszlet_kiadas PRIMARY KEY (kiadas_id),

    CONSTRAINT fk_kiadas_datum FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_kiadas_kiado FOREIGN KEY (kiado_szemely_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_kiadas_gepkezelo FOREIGN KEY (gepkezelo_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_kiadas_tartaly FOREIGN KEY (tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_kiadas_eszkoz FOREIGN KEY (eszkoz_sk)
        REFERENCES eszkoz_dim_jarmuvek (eszkoz_sk)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_liter_positive
        CHECK (kiadott_liter > 0)

);


-- ------------------------------------------------------------
-- fact_tartaly_feltoltes
-- Mikor, melyik fix tartályt, ki vette át, kitől, mennyiért
-- ------------------------------------------------------------
CREATE TABLE ua_fact_keszlet_bevet (
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

    CONSTRAINT pk_ua_fact_keszlet_bevet PRIMARY KEY (bevet_id),

    CONSTRAINT fk_bevet_datum FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_bevet_tartaly FOREIGN KEY (tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_bevet_atvevo FOREIGN KEY (atvevo_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_bevet_szallito FOREIGN KEY (szallito_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL

);

-- ------------------------------------------------------------
-- fact_anyagfelvetel
-- Mobil vagy fix tartályból anyagfelvétel, KM állással
-- ------------------------------------------------------------
CREATE TABLE ua_fact_keszlet_mozgas (
    mozgas_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    datum_id          INT NOT NULL,
    felvevo_id        INT UNSIGNED NULL,
    forras_tartaly_id INT UNSIGNED NOT NULL,
    cel_tartaly_id    INT UNSIGNED NOT NULL,
    mozgatott_liter   DECIMAL(10,2) NOT NULL,
    anyag_id          INT UNSIGNED NOT NULL,
    ervenyes          BOOLEAN DEFAULT TRUE,
    hiba_uzenet       VARCHAR(255),
    CONSTRAINT pk_ua_fact_keszlet_mozgas PRIMARY KEY (mozgas_id),
    CONSTRAINT chk_liter_pozitiv CHECK (mozgatott_liter > 0),
    CONSTRAINT fk_mozgas_datum FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mozgas_felvevo FOREIGN KEY (felvevo_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_mozgas_forras FOREIGN KEY (forras_tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mozgas_cel FOREIGN KEY (cel_tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mozgas_anyag FOREIGN KEY (anyag_id)
        REFERENCES ua_dim_fogyoanyag (anyag_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

--Base structure modify--

CREATE TABLE ua_dim_keszlet (
    tartaly_id      INT UNSIGNED NOT NULL,
    aktualis_liter  DECIMAL(10,2) NOT NULL DEFAULT 0,
    utolso_mozgas   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_ua_dim_keszlet PRIMARY KEY (tartaly_id),
    CONSTRAINT fk_ua_dim_keszlet FOREIGN KEY (tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);