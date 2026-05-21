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

CREATE TABLE core_dim_munkaero (
    foglalkoztatott_id    INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    foglalkoztatott_nev   VARCHAR(255) NOT NULL,
    foglalkoztato_id      INT          UNSIGNED NULL,
    foglalkoztatas_tipusa VARCHAR(100) NULL,
    munkaora              INT          UNSIGNED NULL,
    CONSTRAINT pk_core_dim_munkaero           PRIMARY KEY (foglalkoztatott_id),
    CONSTRAINT fk_core_munkaero_foglalkoztato FOREIGN KEY (foglalkoztato_id)
        REFERENCES dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE core_dim_projektek (
    projekt_id      INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    projekt_nev     VARCHAR(255) NOT NULL,
    ceg_id          INT          UNSIGNED NOT NULL,
    lokacio_id      INT          UNSIGNED NOT NULL,
    datum_id        INT         NOT NULL,
    CONSTRAINT pk_core_dim_projektek PRIMARY KEY (projekt_id),
    CONSTRAINT fk_projekt_ceg       FOREIGN KEY (ceg_id)
        REFERENCES dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_projekt_lokacio   FOREIGN KEY (lokacio_id)
        REFERENCES dim_lokacio (lokacio_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_projekt_datum     FOREIGN KEY (datum_id)
        REFERENCES dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

