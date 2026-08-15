// functions/api/produits/[id].js
// GET    /api/produits/:id  -> détail d'un produit + historique de ses mouvements
// PUT    /api/produits/:id  -> modifie un produit (admin uniquement)
// DELETE /api/produits/:id  -> supprime un produit (admin uniquement)

import { jsonOk, jsonError, statutStock } from "../../_shared/response-helpers.js";
import { requireAdmin } from "../../_shared/auth-helpers.js";

export async function onRequestGet(context) {
  const { env, params, data } = context;

  const produit = await env.DB
    .prepare(`
      SELECT p.id, p.nom, p.categorie_id, c.nom as categorie_nom, p.marque, p.modele_compatible,
             p.prix_achat, p.prix_vente, p.quantite, p.seuil_alerte, p.image_url, p.date_creation
      FROM produits p
      JOIN categories c ON c.id = p.categorie_id
      WHERE p.id = ?
    `)
    .bind(params.id)
    .first();

  if (!produit) return jsonError("Produit introuvable.", 404);

  produit.statut = statutStock(produit.quantite, produit.seuil_alerte);
  if (data.user.role !== "admin") delete produit.prix_achat;

  const { results: mouvements } = await env.DB
    .prepare(`
      SELECT m.id, m.type, m.quantite, m.motif, m.date_mouvement, u.nom as utilisateur_nom
      FROM mouvements_stock m
      LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
      WHERE m.produit_id = ?
      ORDER BY m.date_mouvement DESC
      LIMIT 50
    `)
    .bind(params.id)
    .all();

  return jsonOk({ ...produit, mouvements });
}

export async function onRequestPut(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;

  const { env, request, params } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Requête invalide.");
  }

  const { nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, seuil_alerte, image_url } = body;

  if (!nom || !nom.trim()) return jsonError("Le nom du produit est requis.");
  if (!categorie_id) return jsonError("La catégorie est requise.");

  await env.DB
    .prepare(`
      UPDATE produits
      SET nom = ?, categorie_id = ?, marque = ?, modele_compatible = ?, prix_achat = ?, prix_vente = ?, seuil_alerte = ?, image_url = ?
      WHERE id = ?
    `)
    .bind(
      nom.trim(),
      categorie_id,
      marque || null,
      modele_compatible || null,
      prix_achat || 0,
      prix_vente,
      seuil_alerte ?? 2,
      image_url || null,
      params.id
    )
    .run();

  return jsonOk({ updated: true });
}

export async function onRequestDelete(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;

  const { env, params } = context;

  await env.DB.batch([
    env.DB.prepare("DELETE FROM mouvements_stock WHERE produit_id = ?").bind(params.id),
    env.DB.prepare("DELETE FROM produits WHERE id = ?").bind(params.id),
  ]);

  return jsonOk({ deleted: true });
}
