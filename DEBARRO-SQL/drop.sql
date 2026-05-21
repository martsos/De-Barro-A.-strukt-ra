drop trigger trg_kiadas_validate;
drop trigger trg_bevet_validate;
drop trigger trg_mozgas_validate;

drop view vw_bevet_szallitokent;
drop view vw_eszkoz_utolso_allapot;
drop view vw_hibas_rekordok;
drop view vw_napi_kiadasok;
drop view vw_tartaly_egyenleg;

TRUNCATE TABLE ua_fact_keszlet_kiadas;
TRUNCATE TABLE ua_fact_keszlet_mozgas;
TRUNCATE TABLE ua_fact_keszlet_bevet;


-- old drop shema.sql--

-- schema_drop_all.sql
DROP TABLE IF EXISTS ua_fact_kiadas;
DROP TABLE IF EXISTS ua_fact_mozgas;
DROP TABLE IF EXISTS ua_fact_bevet;
DROP TABLE IF EXISTS ua_dim_keszlet;
DROP TABLE IF EXISTS ua_dim_tartaly;
DROP TABLE IF EXISTS ua_dim_fogyoanyag;
DROP TABLE IF EXISTS eszkoz_dim_jarmuvek;
DROP TABLE IF EXISTS core_dim_munkaero;
DROP TABLE IF EXISTS core_dim_projekt;
DROP TABLE IF EXISTS core_dim_lokacio;
DROP TABLE IF EXISTS core_dim_ido;
DROP TABLE IF EXISTS core_dim_ceg;


-- schema_drop_all.sql
-- Fact táblák először
DROP TABLE IF EXISTS ua_fact_keszlet_kiadas;
DROP TABLE IF EXISTS ua_fact_keszlet_mozgas;
DROP TABLE IF EXISTS ua_fact_keszlet_bevet;

-- UA dimek
DROP TABLE IF EXISTS ua_dim_keszlet;
DROP TABLE IF EXISTS ua_dim_tartaly;
DROP TABLE IF EXISTS ua_dim_fogyoanyag;

-- Eszköz
DROP TABLE IF EXISTS eszkoz_dim_jarmuvek_allapot;
DROP TABLE IF EXISTS eszkoz_dim_jarmuvek;

-- Proj
DROP TABLE IF EXISTS proj_dim_fordulo_tipus;

-- Core – projektek előbb mint lokáció és cég
DROP TABLE IF EXISTS core_dim_projektek;
DROP TABLE IF EXISTS core_dim_munkaero;
DROP TABLE IF EXISTS core_dim_ido;
DROP TABLE IF EXISTS core_dim_lokacio;
DROP TABLE IF EXISTS core_dim_ceg;

SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'debarro_uzemanyag';

SET FOREIGN_KEY_CHECKS = 0; DROP TABLE IF EXISTS core_core_dim_ceg; DROP TABLE IF EXISTS core_core_dim_ido; DROP TABLE IF EXISTS core_core_dim_lokacio; DROP TABLE IF EXISTS dim_ceg; DROP TABLE IF EXISTS dim_fogyoanyag; DROP TABLE IF EXISTS dim_ido; DROP TABLE IF EXISTS dim_jarmuvek; DROP TABLE IF EXISTS dim_jarmuvek_allapot; DROP TABLE IF EXISTS dim_keszlet; DROP TABLE IF EXISTS dim_lokacio; DROP TABLE IF EXISTS dim_munkaero; DROP TABLE IF EXISTS dim_tartaly; DROP TABLE IF EXISTS eszkoz_eszkoz_dim_jarmuvek; DROP TABLE IF EXISTS eszkoz_eszkoz_eszkoz_dim_jarmuvek_allapot; DROP TABLE IF EXISTS fact_keszlet_bevet; DROP TABLE IF EXISTS fact_keszlet_kiadas; DROP TABLE IF EXISTS fact_keszlet_mozgas; DROP VIEW IF EXISTS vw_bevet_szallitokent; DROP VIEW IF EXISTS vw_eszkoz_utolso_allapot; DROP VIEW IF EXISTS vw_hibas_rekordok; DROP VIEW IF EXISTS vw_napi_kiadasok; DROP VIEW IF EXISTS vw_tartaly_egyenleg; SET FOREIGN_KEY_CHECKS = 1;
