// functions/api/produits/index.js
// GET  /api/produits?q=...&categorie_id=...&statut=disponible|faible|rupture&inclure_desactives=1
// POST /api/produits   -> crée un produit (admin uniquement)

import { jsonOk, jsonError, statutStock } from "../../_shared/response-helpers.js";
import { requireAdmin } from "../../_shared/auth-helpers.js";

export async function onRequestGet(context) {
  const { env, request, data } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const categorieId = url.searchParams.get("categorie_id");
  const statutFiltre = url.searchParams.get("statut");
  const inclureDesactives = url.searchParams.get("inclure_desactives") === "1";

  let sql = `
    SELECT p.id, p.nom, p.categorie_id, c.nom as categorie_nom, p.marque, p.modele_compatible,
           p.prix_achat, p.prix_vente, p.quantite, p.seuil_alerte, p.actif, p.image_url, p.date_creation
    FROM produits p
    JOIN categories c ON c.id = p.categorie_id
    WHERE 1=1
  `;
  const bindings = [];

  // Le vendeur ne voit jamais les produits désactivés. L'admin peut choisir de les inclure.
  if (data.user.role !== "admin" || !inclureDesactives) {
    sql += " AND p.actif = 1";
  }

  if (q) {
    sql += " AND (p.nom LIKE ? OR p.marque LIKE ? OR p.modele_compatible LIKE ?)";
    const like = `%${q}%`;
    bindings.push(like, like, like);
  }
  if (categorieId) {
    sql += " AND p.categorie_id = ?";
    bindings.push(categorieId);
  }

  sql += " ORDER BY p.nom ASC";

  const { results } = await env.DB.prepare(sql).bind(...bindings).all();

  let produits = results.map(p => ({
    ...p,
    statut: statutStock(p.quantite, p.seuil_alerte),
  }));

  if (statutFiltre) {
    produits = produits.filter(p => p.statut === statutFiltre);
  }

  // Le vendeur ne voit pas le prix d'achat / la marge
  if (data.user.role !== "admin") {
    produits = produits.map(({ prix_achat, ...reste }) => reste);
  }

  return jsonOk(produits);
}

export async function onRequestPost(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;

  const { env, request } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Requête invalide.");
  }

  const { nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte, image_url } = body;

  if (!nom || !nom.trim()) return jsonError("Le nom du produit est requis.");
  if (!categorie_id) return jsonError("La catégorie est requise.");
  if (prix_vente === undefined || prix_vente === null || isNaN(prix_vente)) {
    return jsonError("Le prix de vente est requis.");
  }

  const result = await env.DB
    .prepare(`
      INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte, actif, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `)
    .bind(
      nom.trim(),
      categorie_id,
      marque || null,
      modele_compatible || null,
      prix_achat || 0,
      prix_vente,
      quantite || 0,
      seuil_alerte ?? 2,
      image_url || null
    )
    .run();

  return jsonOk({ id: result.meta.last_row_id }, 201);
}