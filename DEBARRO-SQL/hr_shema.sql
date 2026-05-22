-- HR modul stub – kapcsolati váz, oszlopok később bővülnek -- Üzleti elemzés folytatása szükséges a megfelelő dimenziók és tények meghatározásához

CREATE TABLE hr_dim_szemelyes_adatok (
    szemelyes_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    foglalkoztatott_id INT UNSIGNED NOT NULL,
    allapot            VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV',
    CONSTRAINT pk_hr_dim_szemelyes_adatok PRIMARY KEY (szemelyes_id),
    CONSTRAINT fk_hr_szemelyes_munkaero   FOREIGN KEY (foglalkoztatott_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE hr_dim_foglalkoztatas_tipus (
    tipus_id  INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    tipus_nev VARCHAR(100) NOT NULL,
    allapot   VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV',
    CONSTRAINT pk_hr_dim_foglalkoztatas_tipus PRIMARY KEY (tipus_id),
    CONSTRAINT uq_hr_foglalkoztatas_tipus_nev UNIQUE (tipus_nev)
);

CREATE TABLE hr_dim_beosztas (
    beosztas_id  INT          UNSIGNED NOT NULL AUTO_INCREMENT,
    beosztas_nev VARCHAR(100) NOT NULL,
    allapot      VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV',
    CONSTRAINT pk_hr_dim_beosztas     PRIMARY KEY (beosztas_id),
    CONSTRAINT uq_hr_dim_beosztas_nev UNIQUE (beosztas_nev)
);

CREATE TABLE hr_fact_munkaviszony (
    munkaviszony_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    foglalkoztatott_id INT UNSIGNED NOT NULL,
    ceg_id             INT UNSIGNED NOT NULL,
    tipus_id           INT UNSIGNED NULL,
    beosztas_id        INT UNSIGNED NULL,
    kezdes_datum       DATE         NOT NULL,
    befejezes_datum    DATE         NULL,
    allapot            VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV',
    CONSTRAINT pk_hr_fact_munkaviszony        PRIMARY KEY (munkaviszony_id),
    CONSTRAINT fk_hr_munkaviszony_munkaero    FOREIGN KEY (foglalkoztatott_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_hr_munkaviszony_ceg         FOREIGN KEY (ceg_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_hr_munkaviszony_tipus       FOREIGN KEY (tipus_id)
        REFERENCES hr_dim_foglalkoztatas_tipus (tipus_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_hr_munkaviszony_beosztas    FOREIGN KEY (beosztas_id)
        REFERENCES hr_dim_beosztas (beosztas_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE hr_fact_napi_beosztas (
    beosztas_id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    foglalkoztatott_id INT UNSIGNED NOT NULL,
    datum_id           INT          NOT NULL,
    projekt_id         INT UNSIGNED NULL,
    lokacio_id         INT UNSIGNED NULL,
    allapot            VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV',
    CONSTRAINT pk_hr_fact_napi_beosztas     PRIMARY KEY (beosztas_id),
    CONSTRAINT fk_hr_napi_beosztas_munkaero FOREIGN KEY (foglalkoztatott_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_hr_napi_beosztas_datum    FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_hr_napi_beosztas_projekt  FOREIGN KEY (projekt_id)
        REFERENCES core_dim_projektek (projekt_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_hr_napi_beosztas_lokacio  FOREIGN KEY (lokacio_id)
        REFERENCES core_dim_lokacio (lokacio_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE hr_fact_szabadsag (
    szabadsag_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    foglalkoztatott_id INT UNSIGNED NOT NULL,
    datum_id           INT          NOT NULL,
    tipus              VARCHAR(50)  NOT NULL DEFAULT 'RENDES',
    napok_szama        INT UNSIGNED NOT NULL DEFAULT 1,
    allapot            VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV',
    CONSTRAINT pk_hr_fact_szabadsag        PRIMARY KEY (szabadsag_id),
    CONSTRAINT fk_hr_szabadsag_munkaero    FOREIGN KEY (foglalkoztatott_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_hr_szabadsag_datum       FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE hr_fact_uzemorvos (
    uzemorvos_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    foglalkoztatott_id INT UNSIGNED NOT NULL,
    datum_id           INT          NOT NULL,
    ervenyes_ig        DATE         NULL,
    alkalmas           BOOLEAN      NOT NULL DEFAULT TRUE,
    allapot            VARCHAR(20)  NOT NULL DEFAULT 'AKTÍV',
    CONSTRAINT pk_hr_fact_uzemorvos        PRIMARY KEY (uzemorvos_id),
    CONSTRAINT fk_hr_uzemorvos_munkaero    FOREIGN KEY (foglalkoztatott_id)
        REFERENCES core_dim_munkaero (foglalkoztatott_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_hr_uzemorvos_datum       FOREIGN KEY (datum_id)
        REFERENCES core_dim_ido (datum_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);