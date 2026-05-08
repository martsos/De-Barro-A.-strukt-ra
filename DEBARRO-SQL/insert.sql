INSERT INTO dim_ceg (ceg_nev, tulajdonos_neve) VALUES 
('De Barro Kft.', 'Sáry László Endre'),
('SC-Invest Kft.', 'Sáry László Endre'),
('AVIA', 'AVIA');

INSERT INTO dim_lokacio (lokacio_nev)
VALUES ('Tata - Magdolna');

INSERT INTO dim_fogyoanyag (anyag_megnevezes, tulajdonos_id, anyag_kategoria)
VALUES ('Gázolaj', 1, 'üzemanyag');

INSERT INTO dim_tartaly (
    tartaly_szam, tartaly_lokacio_id, tartaly_tipus,
    befogado_kepesseg_l, egyeb_alapadatok, anyag_id
)
VALUES ('10000/1', 1, 'FIX', 10000, NULL, 1);

INSERT INTO dim_jarmuvek (
    eszkoz_id, rendszam, eszkoz_kategoria, debarro_csoportositas,
    gyartmany, tipus, eroforras_fajta,
    uzembentarto_id, tulajdonos_id,
    alvazszam, megnevezes
)
VALUES (
    NULL, 'AACX-250', 'Tehergépkocsi', 'RAM',
    'RAM', 'RAM 1500', 'DIESEL',
    2, 2,
    '1C6RR7NM2GS134306', 'RAM 1500'
);

INSERT INTO dim_munkaero (
    foglalkoztatott_nev, foglalkoztato_id,
    foglalkoztatas_tipusa, munkaora
)
VALUES ('Sáry László Endre', 1, 'teljes munkaidős', 8);

INSERT INTO dim_keszlet (tartaly_id, aktualis_liter)
SELECT tartaly_id, 0 FROM dim_tartaly;
