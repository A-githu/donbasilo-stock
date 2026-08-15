// functions/api/categories/index.js
// GET  /api/categories        -> liste toutes les catégories
// POST /api/categories        -> crée une catégorie (admin uniquement)

import { jsonOk, jsonError } from "../../_shared/response-helpers.js";
import { requireAdmin } from "../../_shared/auth-helpers.js";

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB
    .prepare("SELECT id, nom, description FROM categories ORDER BY nom ASC")
    .all();
  return jsonOk(results);
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

  const { nom, description } = body;
  if (!nom || !nom.trim()) {
    return jsonError("Le nom de la catégorie est requis.");
  }

  try {
    const result = await env.DB
      .prepare("INSERT INTO categories (nom, description) VALUES (?, ?)")
      .bind(nom.trim(), description || null)
      .run();

    return jsonOk({ id: result.meta.last_row_id, nom: nom.trim(), description: description || null }, 201);
  } catch (err) {
    return jsonError("Cette catégorie existe déjà.", 409);
  }
}
