// functions/api/dashboard/stats.js
// GET /api/dashboard/stats -> statistiques globales pour le tableau de bord (admin uniquement)

import { jsonOk, statutStock } from "../../_shared/response-helpers.js";
import { requireAdmin } from "../../_shared/auth-helpers.js";

export async function onRequestGet(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;

  const { env } = context;

  const { results: produits } = await env.DB
    .prepare(`
      SELECT p.id, p.nom, p.quantite, p.seuil_alerte, p.prix_vente, c.nom as categorie_nom
      FROM produits p
      JOIN categories c ON c.id = p.categorie_id
      WHERE p.actif = 1
    `)
    .all();

  const nbProduits = produits.length;
  const valeurStock = produits.reduce((total, p) => total + p.quantite * p.prix_vente, 0);

  const produitsAlerte = produits
    .map(p => ({ ...p, statut: statutStock(p.quantite, p.seuil_alerte) }))
    .filter(p => p.statut !== "disponible")
    .sort((a, b) => a.quantite - b.quantite)
    .slice(0, 30);

  const nbRupture = produits.filter(p => p.quantite <= 0).length;
  const nbFaible = produits.filter(p => p.quantite > 0 && p.quantite <= p.seuil_alerte).length;

  const { results: ventesRecentes } = await env.DB
    .prepare(`
      SELECT m.id, p.nom as produit_nom, m.quantite, m.date_mouvement, u.nom as utilisateur_nom
      FROM mouvements_stock m
      JOIN produits p ON p.id = m.produit_id
      LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
      WHERE m.type = 'sortie'
      ORDER BY m.date_mouvement DESC
      LIMIT 10
    `)
    .all();

  return jsonOk({
    nb_produits: nbProduits,
    valeur_stock: valeurStock,
    nb_rupture: nbRupture,
    nb_stock_faible: nbFaible,
    produits_alerte: produitsAlerte,
    ventes_recentes: ventesRecentes,
  });
}