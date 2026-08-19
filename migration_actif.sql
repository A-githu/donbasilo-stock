-- migration_actif.sql
-- À exécuter UNE SEULE FOIS sur la base déjà déployée :
--   wrangler d1 execute donbasilo-db --remote --file=migration_actif.sql

ALTER TABLE produits ADD COLUMN actif INTEGER NOT NULL DEFAULT 1;