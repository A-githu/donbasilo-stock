// functions/api/produits/[id]/activer.js
// POST /api/produits/:id/activer -> réactive un produit précédemment désactivé (admin uniquement)

import { jsonOk, jsonError } from "../../../_shared/response-helpers.js";
import { requireAdmin } from "../../../_shared/auth-helpers.js";

export async function onRequestPost(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;

  const { env, params } = context;

  const produit = await env.DB.prepare("SELECT id FROM produits WHERE id = ?").bind(params.id).first();
  if (!produit) return jsonError("Produit introuvable.", 404);

  await env.DB.prepare("UPDATE produits SET actif = 1 WHERE id = ?").bind(params.id).run();
  return jsonOk({ id: Number(params.id), actif: 1 });
}