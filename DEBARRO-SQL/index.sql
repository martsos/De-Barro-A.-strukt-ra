-- ============================================================
-- FACT_KESZLET_KIADAS
-- ============================================================
CREATE INDEX idx_kiadas_datum
ON fact_keszlet_kiadas (datum_id);

CREATE INDEX idx_kiadas_eszkoz
ON fact_keszlet_kiadas (eszkoz_sk);

CREATE INDEX idx_kiadas_tartaly_datum
ON fact_keszlet_kiadas (tartaly_id, datum_id);

CREATE INDEX idx_kiadas_ervenyes
ON fact_keszlet_kiadas (ervenyes);

-- ============================================================
-- FACT_KESZLET_BEVET
-- ============================================================
CREATE INDEX idx_bevet_datum
ON fact_keszlet_bevet (datum_id);

CREATE INDEX idx_bevet_tartaly_datum
ON fact_keszlet_bevet (tartaly_id, datum_id);

CREATE INDEX idx_bevet_ervenyes
ON fact_keszlet_bevet (ervenyes);

-- ============================================================
-- FACT_KESZLET_MOZGAS
-- ============================================================
CREATE INDEX idx_mozgas_datum
ON fact_keszlet_mozgas (datum_id);

CREATE INDEX idx_mozgas_forras_datum
ON fact_keszlet_mozgas (forras_tartaly_id, datum_id);

CREATE INDEX idx_mozgas_cel_datum
ON fact_keszlet_mozgas (cel_tartaly_id, datum_id);

CREATE INDEX idx_mozgas_ervenyes
ON fact_keszlet_mozgas (ervenyes);