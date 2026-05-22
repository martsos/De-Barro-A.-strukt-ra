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