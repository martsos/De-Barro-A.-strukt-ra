drop trigger trg_kiadas_validate;
drop trigger trg_bevet_validate;
drop trigger trg_mozgas_validate;

drop view vw_bevet_szallitokent;
drop view vw_eszkoz_utolso_allapot;
drop view vw_hibas_rekordok;
drop view vw_napi_kiadasok;
drop view vw_tartaly_egyenleg;

TRUNCATE TABLE fact_keszlet_kiadas;
TRUNCATE TABLE fact_keszlet_mozgas;
TRUNCATE TABLE fact_keszlet_bevet;