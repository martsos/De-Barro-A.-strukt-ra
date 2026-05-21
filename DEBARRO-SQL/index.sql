-- ============================================================
-- ua_fact_keszlet_kiadas
-- ============================================================
CREATE INDEX idx_kiadas_datum
ON ua_fact_keszlet_kiadas (datum_id);

CREATE INDEX idx_kiadas_eszkoz
ON ua_fact_keszlet_kiadas (eszkoz_sk);

CREATE INDEX idx_kiadas_tartaly_datum
ON ua_fact_keszlet_kiadas (tartaly_id, datum_id);

CREATE INDEX idx_kiadas_ervenyes
ON ua_fact_keszlet_kiadas (ervenyes);

-- ============================================================
-- ua_fact_keszlet_bevet
-- ============================================================
CREATE INDEX idx_bevet_datum
ON ua_fact_keszlet_bevet (datum_id);

CREATE INDEX idx_bevet_tartaly_datum
ON ua_fact_keszlet_bevet (tartaly_id, datum_id);

CREATE INDEX idx_bevet_ervenyes
ON ua_fact_keszlet_bevet (ervenyes);

-- ============================================================
-- ua_fact_keszlet_mozgas
-- ============================================================
CREATE INDEX idx_mozgas_datum
ON ua_fact_keszlet_mozgas (datum_id);

CREATE INDEX idx_mozgas_forras_datum
ON ua_fact_keszlet_mozgas (forras_tartaly_id, datum_id);

CREATE INDEX idx_mozgas_cel_datum
ON ua_fact_keszlet_mozgas (cel_tartaly_id, datum_id);

CREATE INDEX idx_mozgas_ervenyes
ON ua_fact_keszlet_mozgas (ervenyes);