-- ─────────────────────────────────────────────────────────────────────────────
-- Migración 002: Agregar saldo de cuenta a la tabla config
--
-- Se aprovecha la tabla `config` existente (siempre tiene exactamente un registro
-- con id = 1) para evitar crear una tabla extra solo para un scalar.
-- Valor por defecto: $13.000 ARS.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE config
  ADD COLUMN IF NOT EXISTS dinero_cuenta DECIMAL(14, 2) NOT NULL DEFAULT 13000.00;

-- Aseguramos que la fila base tenga el valor inicial si recién se agrega la columna.
UPDATE config
SET    dinero_cuenta = 13000.00
WHERE  id = 1
  AND  dinero_cuenta = 0;   -- solo si alguien corrió el ALTER con DEFAULT 0
