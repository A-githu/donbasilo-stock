-- seed_produits.sql
-- Enregistre un premier catalogue de produits, classés par catégorie,
-- avec prix d'achat et prix de vente (en FCFA).
--
-- À exécuter UNE FOIS sur la base en ligne :
--   wrangler d1 execute donbasilo-db --remote --file=seed_produits.sql

-- ===================== AFFICHEURS (écrans) =====================
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Afficheur Samsung Galaxy A14', (SELECT id FROM categories WHERE nom='Afficheurs'), 'Samsung', 'Galaxy A14', 8000, 12000, 15, 3);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Afficheur Samsung Galaxy A10', (SELECT id FROM categories WHERE nom='Afficheurs'), 'Samsung', 'Galaxy A10', 7000, 11000, 10, 3);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Afficheur iPhone 11', (SELECT id FROM categories WHERE nom='Afficheurs'), 'Apple', 'iPhone 11', 15000, 22000, 8, 2);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Afficheur iPhone XR', (SELECT id FROM categories WHERE nom='Afficheurs'), 'Apple', 'iPhone XR', 13000, 19000, 6, 2);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Afficheur Infinix Hot 30', (SELECT id FROM categories WHERE nom='Afficheurs'), 'Infinix', 'Hot 30', 6000, 9500, 12, 3);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Afficheur Tecno Spark 10', (SELECT id FROM categories WHERE nom='Afficheurs'), 'Tecno', 'Spark 10', 6500, 10000, 10, 3);

-- ===================== CHARGEURS =====================
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Chargeur rapide Type-C 25W', (SELECT id FROM categories WHERE nom='Chargeurs'), 'Samsung', 'Type-C', 2500, 4000, 30, 5);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Chargeur iPhone Lightning 20W', (SELECT id FROM categories WHERE nom='Chargeurs'), 'Apple', 'Lightning', 3000, 5000, 25, 5);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Chargeur universel Micro-USB', (SELECT id FROM categories WHERE nom='Chargeurs'), 'Générique', 'Micro-USB', 1200, 2000, 40, 8);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Chargeur rapide Type-C', (SELECT id FROM categories WHERE nom='Chargeurs'), 'Infinix/Tecno', 'Type-C', 2000, 3500, 20, 5);

-- ===================== BATTERIES =====================
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Batterie Samsung Galaxy A14', (SELECT id FROM categories WHERE nom='Batteries'), 'Samsung', 'Galaxy A14', 4000, 6500, 10, 3);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Batterie iPhone 11', (SELECT id FROM categories WHERE nom='Batteries'), 'Apple', 'iPhone 11', 7000, 11000, 6, 2);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Batterie Infinix Hot 30', (SELECT id FROM categories WHERE nom='Batteries'), 'Infinix', 'Hot 30', 3500, 5500, 8, 3);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Batterie Tecno Spark 10', (SELECT id FROM categories WHERE nom='Batteries'), 'Tecno', 'Spark 10', 3500, 5500, 8, 3);

-- ===================== MONTRES =====================
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Montre connectée Smartwatch T500', (SELECT id FROM categories WHERE nom='Montres'), 'Générique', 'T500', 6000, 10000, 12, 3);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Montre connectée Watch 8', (SELECT id FROM categories WHERE nom='Montres'), 'Générique', 'Watch 8', 9000, 15000, 6, 2);

-- ===================== TABLETTES =====================
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Tablette Samsung Galaxy Tab A8', (SELECT id FROM categories WHERE nom='Tablettes'), 'Samsung', 'Tab A8', 55000, 75000, 4, 2);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Tablette générique 10 pouces', (SELECT id FROM categories WHERE nom='Tablettes'), 'Générique', '10 pouces', 35000, 50000, 5, 2);

-- ===================== ÉCOUTEURS =====================
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Écouteurs Bluetooth TWS i12', (SELECT id FROM categories WHERE nom='Écouteurs'), 'Générique', 'i12', 2500, 4500, 20, 5);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Écouteurs filaires Jack 3.5mm', (SELECT id FROM categories WHERE nom='Écouteurs'), 'Générique', 'Jack 3.5mm', 800, 1500, 30, 8);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Écouteurs filaires Type-C', (SELECT id FROM categories WHERE nom='Écouteurs'), 'Samsung', 'Type-C', 2000, 3500, 15, 5);

-- ===================== COQUES =====================
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Coque silicone Galaxy A14', (SELECT id FROM categories WHERE nom='Coques'), 'Samsung', 'Galaxy A14', 800, 1500, 25, 5);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Coque silicone iPhone 11', (SELECT id FROM categories WHERE nom='Coques'), 'Apple', 'iPhone 11', 1000, 2000, 20, 5);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Coque antichoc universelle', (SELECT id FROM categories WHERE nom='Coques'), 'Générique', 'Universelle', 700, 1300, 30, 8);

-- ===================== VITRES DE PROTECTION =====================
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Vitre trempée Galaxy A14', (SELECT id FROM categories WHERE nom='Vitres de protection'), 'Samsung', 'Galaxy A14', 500, 1000, 40, 10);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Vitre trempée iPhone 11', (SELECT id FROM categories WHERE nom='Vitres de protection'), 'Apple', 'iPhone 11', 600, 1200, 35, 10);
INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte)
VALUES ('Vitre trempée universelle', (SELECT id FROM categories WHERE nom='Vitres de protection'), 'Générique', 'Universelle', 400, 800, 50, 10);