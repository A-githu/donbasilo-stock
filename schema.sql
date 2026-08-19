-- ============================================
-- Schéma de base de données - Don Basilo
-- Base : Cloudflare D1 (SQLite)
-- ============================================

-- Table des utilisateurs (Admin / Vendeur)
CREATE TABLE IF NOT EXISTS utilisateurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  mot_de_passe_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'vendeur')),
  date_creation TEXT DEFAULT (datetime('now'))
);

-- Table des catégories (Afficheurs, Chargeurs, Batteries, Montres, Tablettes, Écouteurs, Coques, Vitres...)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Table des produits
CREATE TABLE IF NOT EXISTS produits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL,
  categorie_id INTEGER NOT NULL,
  marque TEXT,               -- ex: Samsung, iPhone, Tecno...
  modele_compatible TEXT,    -- ex: A14, iPhone 12, Infinix Hot 30...
  prix_achat REAL DEFAULT 0,
  prix_vente REAL NOT NULL,
  quantite INTEGER NOT NULL DEFAULT 0,
  seuil_alerte INTEGER NOT NULL DEFAULT 2,
  actif INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  date_creation TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (categorie_id) REFERENCES categories(id)
);

-- Table des mouvements de stock (entrées et sorties)
CREATE TABLE IF NOT EXISTS mouvements_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entree', 'sortie')),
  quantite INTEGER NOT NULL,
  motif TEXT,                 -- ex: "Réapprovisionnement", "Vente client"
  utilisateur_id INTEGER,
  date_mouvement TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (produit_id) REFERENCES produits(id),
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

-- Index utiles pour les recherches et filtres fréquents
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_produit ON mouvements_stock(produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON mouvements_stock(date_mouvement);

-- ============================================
-- Données de départ : catégories de base
-- ============================================
INSERT INTO categories (nom, description) VALUES
  ('Afficheurs', 'Écrans de remplacement pour tous modèles de téléphones'),
  ('Chargeurs', 'Chargeurs classés par marque et modèle de téléphone'),
  ('Batteries', 'Batteries classées par marque et modèle de téléphone'),
  ('Montres', 'Montres connectées'),
  ('Tablettes', 'Tablettes tactiles'),
  ('Écouteurs', 'Écouteurs filaires et sans fil'),
  ('Coques', 'Coques de protection'),
  ('Vitres de protection', 'Films et vitres de protection d''écran');