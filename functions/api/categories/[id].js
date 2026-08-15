// functions/api/categories/[id].js
// PUT    /api/categories/:id  -> modifie une catégorie (admin uniquement)
// DELETE /api/categories/:id  -> supprime une catégorie (admin uniquement, si aucun produit lié)

import { jsonOk, jsonError } from "../../_shared/response-helpers.js";
import { requireAdmin } from "../../_shared/auth-helpers.js";

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

  const { nom, description } = body;
  if (!nom || !nom.trim()) {
    return jsonError("Le nom de la catégorie est requis.");
  }

  await env.DB
    .prepare("UPDATE categories SET nom = ?, description = ? WHERE id = ?")
    .bind(nom.trim(), description || null, params.id)
    .run();

  return jsonOk({ id: Number(params.id), nom: nom.trim(), description: description || null });
}

export async function onRequestDelete(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;

  const { env, params } = context;

  const produitsLies = await env.DB
    .prepare("SELECT COUNT(*) as total FROM produits WHERE categorie_id = ?")
    .bind(params.id)
    .first();

  if (produitsLies.total > 0) {
    return jsonError("Impossible de supprimer : des produits sont encore rattachés à cette catégorie.", 409);
  }

  await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(params.id).run();
  return jsonOk({ deleted: true });
}
