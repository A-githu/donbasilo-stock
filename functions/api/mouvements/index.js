// functions/api/mouvements/index.js
// GET  /api/mouvements?produit_id=...&type=entree|sortie   -> historique des mouvements (admin uniquement)
// POST /api/mouvements                                      -> enregistre une entrée ou une sortie
//      Body : { produit_id, type: "entree"|"sortie", quantite, motif }
//      -> Met à jour automatiquement la quantité du produit concerné.
//      -> Un "vendeur" ne peut enregistrer que des sorties (ventes).
//      -> Impossible d'enregistrer un mouvement sur un produit désactivé.

import { jsonOk, jsonError } from "../../_shared/response-helpers.js";
import { requireAdmin } from "../../_shared/auth-helpers.js";

export async function onRequestGet(context) {
  // Consulter l'historique complet est réservé à l'administrateur (cahier des charges 5.1 / 5.2)
  const refus = requireAdmin(context);
  if (refus) return refus;

  const { env, request } = context;
  const url = new URL(request.url);
  const produitId = url.searchParams.get("produit_id");
  const type = url.searchParams.get("type");

  let sql = `
    SELECT m.id, m.produit_id, p.nom as produit_nom, m.type, m.quantite, m.motif,
           m.date_mouvement, u.nom as utilisateur_nom
    FROM mouvements_stock m
    JOIN produits p ON p.id = m.produit_id
    LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
    WHERE 1=1
  `;
  const bindings = [];

  if (produitId) {
    sql += " AND m.produit_id = ?";
    bindings.push(produitId);
  }
  if (type) {
    sql += " AND m.type = ?";
    bindings.push(type);
  }

  sql += " ORDER BY m.date_mouvement DESC LIMIT 200";

  const { results } = await env.DB.prepare(sql).bind(...bindings).all();
  return jsonOk(results);
}

export async function onRequestPost(context) {
  const { env, request, data } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Requête invalide.");
  }

  const { produit_id, type, quantite, motif } = body;

  if (!produit_id) return jsonError("Le produit est requis.");
  if (!["entree", "sortie"].includes(type)) return jsonError('Le type doit être "entree" ou "sortie".');
  if (!quantite || quantite <= 0) return jsonError("La quantité doit être supérieure à 0.");

  // Un vendeur ne peut enregistrer que des ventes (sorties)
  if (data.user.role !== "admin" && type !== "sortie") {
    return jsonError("Seul l'administrateur peut enregistrer une entrée de stock.", 403);
  }

  const produit = await env.DB
    .prepare("SELECT id, quantite, actif FROM produits WHERE id = ?")
    .bind(produit_id)
    .first();

  if (!produit) return jsonError("Produit introuvable.", 404);
  if (!produit.actif) return jsonError("Ce produit est désactivé, aucun mouvement n'est possible.", 409);

  if (type === "sortie" && produit.quantite < quantite) {
    return jsonError(`Stock insuffisant (quantité disponible : ${produit.quantite}).`, 409);
  }

  const nouvelleQuantite = type === "entree" ? produit.quantite + quantite : produit.quantite - quantite;

  await env.DB.batch([
    env.DB.prepare("UPDATE produits SET quantite = ? WHERE id = ?").bind(nouvelleQuantite, produit_id),
    env.DB
      .prepare("INSERT INTO mouvements_stock (produit_id, type, quantite, motif, utilisateur_id) VALUES (?, ?, ?, ?, ?)")
      .bind(produit_id, type, quantite, motif || null, data.user.id),
  ]);

  return jsonOk({ produit_id, nouvelle_quantite: nouvelleQuantite }, 201);
}