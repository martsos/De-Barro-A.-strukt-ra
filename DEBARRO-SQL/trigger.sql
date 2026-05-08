
-- FACT_KESZLET_KIADAS VALIDÁCIÓ

DELIMITER $$

DROP TRIGGER IF EXISTS trg_kiadas_validate$$

CREATE TRIGGER trg_kiadas_validate
BEFORE INSERT ON fact_keszlet_kiadas
FOR EACH ROW
BEGIN
    DECLARE utolso_km DECIMAL(10,2);
    DECLARE utolso_pisztoly DECIMAL(10,2);
    DECLARE defense_limit DECIMAL(10,2);

    -- 1. GÉPÜZEMÓRA / KM LOKÁLIS
    IF NEW.gepuzemora_eloz IS NOT NULL 
       AND NEW.gepuzemora_akt IS NOT NULL 
       AND NEW.gepuzemora_eloz > NEW.gepuzemora_akt THEN
        SET NEW.ervenyes = FALSE;
        SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
            'HIBA: Gépüzemóra aktuális kisebb mint előző');
    END IF;

    IF NEW.km_eloz IS NOT NULL 
       AND NEW.km_akt IS NOT NULL 
       AND NEW.km_eloz > NEW.km_akt THEN
        SET NEW.ervenyes = FALSE;
        SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
            'HIBA: KM aktuális kisebb mint előző');
    END IF;

    -- 2. ESZKÖZ SZINTŰ KM
    SELECT km_akt INTO utolso_km
    FROM fact_keszlet_kiadas
    WHERE eszkoz_sk = NEW.eszkoz_sk
      AND km_akt IS NOT NULL
    ORDER BY datum_id DESC, kiadas_id DESC
    LIMIT 1;

    IF utolso_km IS NOT NULL 
       AND NEW.km_akt IS NOT NULL 
       AND NEW.km_akt < utolso_km THEN
        SET NEW.ervenyes = FALSE;
        SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
            CONCAT('HIBA: KM (', NEW.km_akt,
                   ') < utolsó (', utolso_km, ')'));
    END IF;

    -- 3. PISZTOLY ÓRAÁLLÁS

    SELECT pisztoly_oraallas INTO utolso_pisztoly
    FROM fact_keszlet_kiadas
    WHERE tartaly_id = NEW.tartaly_id
      AND pisztoly_oraallas IS NOT NULL
    ORDER BY datum_id DESC, kiadas_id DESC
    LIMIT 1;

    IF utolso_pisztoly IS NOT NULL
       AND NEW.pisztoly_oraallas IS NOT NULL THEN
        IF ABS((NEW.pisztoly_oraallas - utolso_pisztoly) - NEW.kiadott_liter) > 0.5 THEN
            SET NEW.ervenyes = FALSE;
            SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
                CONCAT('HIBA: Pisztoly eltérés (',
                       NEW.pisztoly_oraallas - utolso_pisztoly,
                       ') != kiadott (', NEW.kiadott_liter, ')'));
        END IF;
    END IF;

    -- 4. DEFENSE LIMIT
    SELECT aktualis_liter INTO defense_limit
    FROM dim_keszlet
    WHERE tartaly_id = NEW.tartaly_id;

    IF defense_limit IS NOT NULL 
       AND NEW.kiadott_liter > defense_limit THEN
        SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
            CONCAT('FIGYELMEZTETÉS: Készlet negatív (',
                   defense_limit - NEW.kiadott_liter, ')'));
    END IF;

    -- 5. KÉSZLET FRISSÍTÉS
    IF NEW.ervenyes = TRUE THEN
        UPDATE dim_keszlet 
        SET aktualis_liter = aktualis_liter - NEW.kiadott_liter,
            utolso_mozgas = NOW()
        WHERE tartaly_id = NEW.tartaly_id;
    END IF;

END$$

DELIMITER ;

-- FACT_KESZLET_MOZGAS VALIDÁCIÓ

DELIMITER $$

DROP TRIGGER IF EXISTS trg_mozgas_validate$$

CREATE TRIGGER trg_mozgas_validate
BEFORE INSERT ON fact_keszlet_mozgas
FOR EACH ROW
BEGIN
    DECLARE defense_forras_limit DECIMAL(10,2);
    DECLARE cel_max_kapacitas DECIMAL(10,2);
    DECLARE cel_aktualis DECIMAL(10,2);
    DECLARE forras_anyag INT;
    DECLARE cel_anyag INT;

    -- 1. FORRÁS DEFENSE LIMIT
    SELECT aktualis_liter INTO defense_forras_limit
    FROM dim_keszlet
    WHERE tartaly_id = NEW.forras_tartaly_id;

    IF defense_forras_limit IS NOT NULL THEN
        IF NEW.mozgatott_liter > defense_forras_limit * 1.02 THEN
            SET NEW.ervenyes = FALSE;
            SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
                CONCAT('HIBA: Nincs elég készlet! Elérhető(',
                       defense_forras_limit, ') < mozgatott(', NEW.mozgatott_liter, ')'));
        ELSEIF NEW.mozgatott_liter > defense_forras_limit THEN
            SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
                CONCAT('FIGYELMEZTETÉS: Készlet negatív(',
                       defense_forras_limit - NEW.mozgatott_liter, ')'));
        END IF;
    END IF;

    -- 2. CÉL KAPACITÁS
    SELECT befogado_kepesseg_l INTO cel_max_kapacitas
    FROM dim_tartaly
    WHERE tartaly_id = NEW.cel_tartaly_id;

    SELECT aktualis_liter INTO cel_aktualis
    FROM dim_keszlet
    WHERE tartaly_id = NEW.cel_tartaly_id;

    IF cel_aktualis IS NOT NULL
       AND cel_max_kapacitas IS NOT NULL THEN
        IF cel_aktualis + NEW.mozgatott_liter > cel_max_kapacitas * 1.02 THEN
            SET NEW.ervenyes = FALSE;
            SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
                CONCAT('HIBA: Cél tartály kapacitás túllépés! Aktuális(',
                       cel_aktualis, ') + mozgatott(', NEW.mozgatott_liter,
                       ') > max(', cel_max_kapacitas, ')'));
        ELSEIF cel_aktualis + NEW.mozgatott_liter > cel_max_kapacitas THEN
            SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
                CONCAT('FIGYELMEZTETÉS: Cél tartály kapacitás közel! Aktuális(',
                       cel_aktualis, ') + mozgatott(', NEW.mozgatott_liter,
                       ') > max(', cel_max_kapacitas, ')'));
        END IF;
    END IF;

    -- 3. ANYAG CHECK
    SELECT anyag_id INTO forras_anyag
    FROM dim_tartaly WHERE tartaly_id = NEW.forras_tartaly_id;

    SELECT anyag_id INTO cel_anyag
    FROM dim_tartaly WHERE tartaly_id = NEW.cel_tartaly_id;

    IF forras_anyag IS NOT NULL 
       AND cel_anyag IS NOT NULL 
       AND forras_anyag <> cel_anyag THEN
        SET NEW.ervenyes = FALSE;
        SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
            'HIBA: Anyag eltérés');
    END IF;

    -- 4. KÉSZLET FRISSÍTÉS
    IF NEW.ervenyes = TRUE THEN
        UPDATE dim_keszlet 
        SET aktualis_liter = aktualis_liter - NEW.mozgatott_liter,
            utolso_mozgas = NOW()
        WHERE tartaly_id = NEW.forras_tartaly_id;

        UPDATE dim_keszlet 
        SET aktualis_liter = aktualis_liter + NEW.mozgatott_liter,
            utolso_mozgas = NOW()
        WHERE tartaly_id = NEW.cel_tartaly_id;
    END IF;

END$$

DELIMITER ;

-- FACT_KESZLET_BEVET  VALIDÁCIÓ

DELIMITER $$

DROP TRIGGER IF EXISTS trg_bevet_validate$$

CREATE TRIGGER trg_bevet_validate
BEFORE INSERT ON fact_keszlet_bevet
FOR EACH ROW
BEGIN
    DECLARE max_kapacitas DECIMAL(10,2);
    DECLARE aktualis DECIMAL(10,2);

    -- 1. ZÁRÓ - KEZDŐ = BEJÖVŐ
    IF ABS((NEW.zaro_liter - NEW.kezdo_liter) - NEW.bejovo_liter) > 0.5 THEN
        SET NEW.ervenyes = FALSE;
        SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
            CONCAT('HIBA: záró(', NEW.zaro_liter, ') - kezdő(',
                   NEW.kezdo_liter, ') != bevételezett(', NEW.bejovo_liter, ')'));
    END IF;

    -- 2. KAPACITÁS
    SELECT befogado_kepesseg_l INTO max_kapacitas
    FROM dim_tartaly
    WHERE tartaly_id = NEW.tartaly_id;

    SELECT aktualis_liter INTO aktualis
    FROM dim_keszlet
    WHERE tartaly_id = NEW.tartaly_id;

    IF max_kapacitas IS NOT NULL THEN
        IF NEW.zaro_liter > max_kapacitas * 1.02 THEN
            SET NEW.ervenyes = FALSE;
            SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
                CONCAT('HIBA: záró(', NEW.zaro_liter,
                       ') > kapacitás(', max_kapacitas, ')'));
        ELSEIF NEW.zaro_liter > max_kapacitas THEN
            SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
                CONCAT('FIGYELMEZTETÉS: záró(', NEW.zaro_liter,
                       ') közel kapacitáshoz(', max_kapacitas, ')'));
        END IF;
    END IF;

    IF aktualis IS NOT NULL
       AND max_kapacitas IS NOT NULL THEN
        IF aktualis + NEW.bejovo_liter > max_kapacitas * 1.02 THEN
            SET NEW.ervenyes = FALSE;
            SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
                CONCAT('HIBA: Kapacitás túllépés! Aktuális(',
                       aktualis, ') + bejövő(', NEW.bejovo_liter,
                       ') > max(', max_kapacitas, ')'));
        ELSEIF aktualis + NEW.bejovo_liter > max_kapacitas THEN
            SET NEW.hiba_uzenet = CONCAT_WS(' | ', NEW.hiba_uzenet,
                CONCAT('FIGYELMEZTETÉS: Kapacitás közel! Aktuális(',
                       aktualis, ') + bejövő(', NEW.bejovo_liter,
                       ') > max(', max_kapacitas, ')'));
        END IF;
    END IF;

    -- 3. KÉSZLET FRISSÍTÉS (csak ha érvényes)
    IF NEW.ervenyes = TRUE THEN
        UPDATE dim_keszlet 
        SET aktualis_liter = aktualis_liter + NEW.bejovo_liter,
            utolso_mozgas = NOW()
        WHERE tartaly_id = NEW.tartaly_id;
    END IF;

END$$

DELIMITER ;