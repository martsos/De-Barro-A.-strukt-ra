CREATE TABLE eszkoz_dim_jarmuvek (
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
    allapot VARCHAR(20) NOT NULL DEFAULT 'AKTÍV' CHECK (allapot IN ('AKTÍV','INAKTÍV')),

    CONSTRAINT pk_eszkoz_dim_jarmuvek PRIMARY KEY (eszkoz_sk),

    -- üzleti kulcsok
    CONSTRAINT uq_eszkoz_dim_jarmuvek_eszkoz_id UNIQUE (eszkoz_id),
    CONSTRAINT uq_eszkoz_dim_jarmuvek_rendszam  UNIQUE (rendszam),
    CONSTRAINT uq_eszkoz_dim_jarmuvek_alvaz     UNIQUE (alvazszam),

    -- kapcsolatok
    CONSTRAINT fk_eszkoz_jarmuvek_uzembentarto FOREIGN KEY (uzembentarto_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_eszkoz_jarmuvek_tulajdonos FOREIGN KEY (tulajdonos_id)
        REFERENCES core_dim_ceg (ceg_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE eszkoz_dim_jarmuvek_allapot (
    eszkoz_sk        INT UNSIGNED NOT NULL,
    aktualis_km      DECIMAL(10,2) NULL,
    aktualis_uzemora DECIMAL(10,2) NULL,
    utolso_mozgas    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_eszkoz_dim_jarmuvek_allapot PRIMARY KEY (eszkoz_sk),
    CONSTRAINT fk_eszkoz_dim_jarmuvek_allapot FOREIGN KEY (eszkoz_sk)
        REFERENCES eszkoz_dim_jarmuvek (eszkoz_sk)
        ON UPDATE CASCADE ON DELETE RESTRICT
); -- Új tábla implementációja KM, és Gépüzemóra nyilvántartásra