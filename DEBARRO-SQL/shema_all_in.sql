CREATE TABLE core_dim_ceg (
    ceg_id           INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    ceg_nev          VARCHAR(255) NOT NULL,
    ceg_egyeb        VARCHAR(255) NULL,
    tulajdonos_neve  VARCHAR(255) NOT NULL,
    kapcsolattarto   VARCHAR(255) NULL,
    allapot          VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),
    CONSTRAINT pk_core_dim_ceg     PRIMARY KEY (ceg_id),
    CONSTRAINT uq_core_dim_ceg_nev UNIQUE      (ceg_nev)
);

CREATE TABLE core_dim_lokacio (
    lokacio_id     INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    lokacio_nev    VARCHAR(255) NOT NULL,
    helyrajzi_szam VARCHAR(100) NULL,
    hosszusagi_fok DECIMAL(10,7) NULL,
    szelessegi_fok DECIMAL(10,7) NULL,
    allapot        VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),
    CONSTRAINT pk_core_dim_lokacio     PRIMARY KEY (lokacio_id),
    CONSTRAINT uq_core_dim_lokacio_nev UNIQUE      (lokacio_nev)
);

CREATE TABLE core_dim_ido (
    datum_id   INT          NOT NULL,
    datum      DATE         NOT NULL,
    ev         INT          NOT NULL,
    negyed     CHAR(2)      NOT NULL,
    honap_szam INT          NOT NULL,
    honap_nev  VARCHAR(20)  NOT NULL,
    het_szam   INT          NOT NULL,
    nap_szam   INT          NOT NULL,
    nap_nev    VARCHAR(20)  NOT NULL,
    nap_tipusa VARCHAR(20)  NOT NULL,
    unnep_neve VARCHAR(100) NULL,
    CONSTRAINT pk_core_dim_ido   PRIMARY KEY (datum_id),
    CONSTRAINT uq_core_dim_datum UNIQUE      (datum)
);

CREATE TABLE core_dim_munkaero (
    foglalkoztatott_id    INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    foglalkoztatott_nev   VARCHAR(255) NOT NULL,
    foglalkoztato_id      INT          UNSIGNED NULL,
    foglalkoztatas_tipusa VARCHAR(100) NULL,
    munkaora              INT          UNSIGNED NULL,
    allapot               VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),
    CONSTRAINT pk_core_dim_munkaero           PRIMARY KEY (foglalkoztatott_id),
    CONSTRAINT fk_core_munkaero_foglalkoztato FOREIGN KEY (foglalkoztato_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE core_dim_projektek (
    projekt_id  INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    projekt_nev VARCHAR(255) NOT NULL,
    ceg_id      INT          UNSIGNED NOT NULL,
    lokacio_id  INT          UNSIGNED NOT NULL,
    datum_id    INT          NOT NULL,
    statusz     VARCHAR(20)  NOT NULL DEFAULT 'TERVEZETT' CHECK (statusz IN ('TERVEZETT','AKTÍV','LEZÁRT')),
    allapot     VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),
    CONSTRAINT pk_core_dim_projektek PRIMARY KEY (projekt_id),
    CONSTRAINT fk_projekt_ceg        FOREIGN KEY (ceg_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_projekt_lokacio    FOREIGN KEY (lokacio_id)
        REFERENCES core_dim_lokacio (lokacio_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_projekt_datum      FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================================
-- ÜZEMANYAG DIMEK
-- ============================================================

CREATE TABLE ua_dim_fogyoanyag (
    anyag_id         INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    anyag_megnevezes VARCHAR(255) NOT NULL,
    tulajdonos_id    INT          UNSIGNED NULL,
    anyag_kategoria  VARCHAR(150) NOT NULL,
    allapot          VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),
    CONSTRAINT pk_ua_dim_fogyoanyag          PRIMARY KEY (anyag_id),
    CONSTRAINT uq_ua_dim_fogyoanyag_megnevez UNIQUE      (anyag_megnevezes),
    CONSTRAINT fk_ua_fogyoanyag_tulajdonos   FOREIGN KEY (tulajdonos_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE ua_dim_tartaly (
    tartaly_id          INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    tartaly_szam        VARCHAR(100) NOT NULL,
    tartaly_lokacio_id  INT          UNSIGNED NOT NULL,
    tartaly_tipus       VARCHAR(20)  NOT NULL CHECK (tartaly_tipus IN ('FIX','MOBIL','KANNA')),
    befogado_kepesseg_l DECIMAL(10,2) UNSIGNED NOT NULL CHECK (befogado_kepesseg_l > 0),
    egyeb_alapadatok    VARCHAR(255) NULL,
    anyag_id            INT          UNSIGNED NOT NULL,
    allapot             VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),
    CONSTRAINT pk_ua_dim_tartaly          PRIMARY KEY (tartaly_id),
    CONSTRAINT uq_ua_tartaly_lokacio_szam UNIQUE      (tartaly_lokacio_id, tartaly_szam),
    CONSTRAINT fk_ua_tartaly_lokacio      FOREIGN KEY (tartaly_lokacio_id)
        REFERENCES core_dim_lokacio (lokacio_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ua_tartaly_anyag        FOREIGN KEY (anyag_id)
        REFERENCES ua_dim_fogyoanyag (anyag_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE ua_dim_keszlet (
    tartaly_id     INT          UNSIGNED NOT NULL,
    aktualis_liter DECIMAL(10,2) NOT NULL DEFAULT 0,
    utolso_mozgas  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_ua_dim_keszlet PRIMARY KEY (tartaly_id),
    CONSTRAINT fk_ua_dim_keszlet FOREIGN KEY (tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================================
-- ESZKÖZ DIMEK
-- ============================================================

CREATE TABLE eszkoz_dim_jarmuvek (
    eszkoz_sk             INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    eszkoz_id             VARCHAR(20)  NULL,
    rendszam              VARCHAR(20)  NULL,
    eszkoz_kategoria      VARCHAR(50)  NOT NULL,
    debarro_csoportositas VARCHAR(50)  NULL,
    gyartmany             VARCHAR(50)  NULL,
    tipus                 VARCHAR(50)  NULL,
    eroforras_fajta       VARCHAR(50)  NULL,
    uzembentarto_id       INT          UNSIGNED NULL,
    tulajdonos_id         INT          UNSIGNED NULL,
    alvazszam             VARCHAR(50)  NULL,
    megnevezes            VARCHAR(255) NULL,
    allapot               VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),
    CONSTRAINT pk_eszkoz_dim_jarmuvek            PRIMARY KEY (eszkoz_sk),
    CONSTRAINT uq_eszkoz_dim_jarmuvek_eszkoz_id  UNIQUE      (eszkoz_id),
    CONSTRAINT uq_eszkoz_dim_jarmuvek_rendszam   UNIQUE      (rendszam),
    CONSTRAINT uq_eszkoz_dim_jarmuvek_alvaz      UNIQUE      (alvazszam),
    CONSTRAINT fk_eszkoz_jarmuvek_uzembentarto   FOREIGN KEY (uzembentarto_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_eszkoz_jarmuvek_tulajdonos     FOREIGN KEY (tulajdonos_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE eszkoz_dim_jarmuvek_allapot (
    eszkoz_sk        INT          UNSIGNED NOT NULL,
    aktualis_km      DECIMAL(10,2) NULL,
    aktualis_uzemora DECIMAL(10,2) NULL,
    utolso_mozgas    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_eszkoz_dim_jarmuvek_allapot PRIMARY KEY (eszkoz_sk),
    CONSTRAINT fk_eszkoz_dim_jarmuvek_allapot FOREIGN KEY (eszkoz_sk)
        REFERENCES eszkoz_dim_jarmuvek (eszkoz_sk)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- ============================================================
-- PROJEKT DIMEK
-- ============================================================

CREATE TABLE proj_dim_fordulo_tipus (
    fordulo_id        INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    fordulo_nev       VARCHAR(255) NOT NULL,
    projekt_szam      VARCHAR(100) NULL,
    munkaterulet_szam VARCHAR(100) NULL,
    szelessegi_fok    DECIMAL(11,8) NULL,
    hosszusagi_fok    DECIMAL(11,8) NULL,
    allapot           VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),
    CONSTRAINT pk_proj_dim_fordulo_tipus PRIMARY KEY (fordulo_id),
    CONSTRAINT uq_proj_dim_fordulo_nev   UNIQUE      (fordulo_nev)
);

-- ============================================================
-- ÜZEMANYAG FACT TÁBLÁK
-- ============================================================

CREATE TABLE ua_fact_keszlet_kiadas (
    kiadas_id        INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    datum_id         INT          NOT NULL,
    kiado_szemely_id INT          UNSIGNED NULL,
    gepkezelo_id     INT          UNSIGNED NULL,
    tartaly_id       INT          UNSIGNED NOT NULL,
    eszkoz_sk        INT          UNSIGNED NOT NULL,
    gepuzemora_eloz  DECIMAL(10,2) NULL,
    gepuzemora_akt   DECIMAL(10,2) NULL,
    km_eloz          DECIMAL(10,2) NULL,
    km_akt           DECIMAL(10,2) NULL,
    pisztoly_oraallas DECIMAL(10,2) NULL,
    kiadott_liter    DECIMAL(10,2) NOT NULL,
    ervenyes         BOOLEAN DEFAULT TRUE,
    hiba_uzenet      VARCHAR(255),
    CONSTRAINT pk_ua_fact_keszlet_kiadas PRIMARY KEY (kiadas_id),
    CONSTRAINT chk_ua_kiadas_liter       CHECK       (kiadott_liter > 0),
    CONSTRAINT fk_kiadas_datum           FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_kiadas_kiado           FOREIGN KEY (kiado_szemely_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_kiadas_gepkezelo       FOREIGN KEY (gepkezelo_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_kiadas_tartaly         FOREIGN KEY (tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_kiadas_eszkoz          FOREIGN KEY (eszkoz_sk)
        REFERENCES eszkoz_dim_jarmuvek (eszkoz_sk)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE ua_fact_keszlet_bevet (
    bevet_id     INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    datum_id     INT          NOT NULL,
    tartaly_id   INT          UNSIGNED NOT NULL,
    atvevo_id    INT          UNSIGNED NULL,
    szallito_id  INT          UNSIGNED NULL,
    kezdo_liter  DECIMAL(10,2) NOT NULL CHECK (kezdo_liter  >= 0),
    bejovo_liter DECIMAL(10,2) NOT NULL CHECK (bejovo_liter >= 0),
    zaro_liter   DECIMAL(10,2) NOT NULL CHECK (zaro_liter   >= 0),
    egysegar     DECIMAL(10,2) NULL     CHECK (egysegar     >= 0),
    szamla_szam  VARCHAR(100) NULL,
    ervenyes     BOOLEAN DEFAULT TRUE,
    hiba_uzenet  VARCHAR(255),
    CONSTRAINT pk_ua_fact_keszlet_bevet PRIMARY KEY (bevet_id),
    CONSTRAINT fk_bevet_datum           FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_bevet_tartaly         FOREIGN KEY (tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_bevet_atvevo          FOREIGN KEY (atvevo_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_bevet_szallito        FOREIGN KEY (szallito_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE ua_fact_keszlet_mozgas (
    mozgas_id         INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    datum_id          INT          NOT NULL,
    felvevo_id        INT          UNSIGNED NULL,
    forras_tartaly_id INT          UNSIGNED NOT NULL,
    cel_tartaly_id    INT          UNSIGNED NOT NULL,
    mozgatott_liter   DECIMAL(10,2) NOT NULL,
    anyag_id          INT          UNSIGNED NOT NULL,
    ervenyes          BOOLEAN DEFAULT TRUE,
    hiba_uzenet       VARCHAR(255),
    CONSTRAINT pk_ua_fact_keszlet_mozgas PRIMARY KEY (mozgas_id),
    CONSTRAINT chk_ua_mozgas_liter       CHECK       (mozgatott_liter > 0),
    CONSTRAINT fk_mozgas_datum           FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mozgas_felvevo         FOREIGN KEY (felvevo_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_mozgas_forras          FOREIGN KEY (forras_tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mozgas_cel             FOREIGN KEY (cel_tartaly_id)
        REFERENCES ua_dim_tartaly (tartaly_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mozgas_anyag           FOREIGN KEY (anyag_id)
        REFERENCES ua_dim_fogyoanyag (anyag_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
