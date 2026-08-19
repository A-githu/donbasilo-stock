// functions/api/utilisateurs/index.js
// GET  /api/utilisateurs   -> liste tous les utilisateurs (admin uniquement)
// POST /api/utilisateurs   -> crée un utilisateur (admin uniquement)

import { jsonOk, jsonError } from "../../_shared/response-helpers.js";
import { requireAdmin } from "../../_shared/auth-helpers.js";
import { hashPassword } from "../../_shared/crypto.js";

export async function onRequestGet(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;

  const { env } = context;
  const { results } = await env.DB
    .prepare("SELECT id, nom, email, role, date_creation FROM utilisateurs ORDER BY nom ASC")
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

  const { nom, email, password, role } = body;

  if (!nom || !nom.trim()) return jsonError("Le nom est requis.");
  if (!email || !email.trim()) return jsonError("L'email est requis.");
  if (!password || password.length < 6) return jsonError("Le mot de passe doit contenir au moins 6 caractères.");
  if (!["admin", "vendeur"].includes(role)) return jsonError('Le rôle doit être "admin" ou "vendeur".');

  const emailNormalise = email.trim().toLowerCase();

  const existant = await env.DB
    .prepare("SELECT id FROM utilisateurs WHERE email = ?")
    .bind(emailNormalise)
    .first();
  if (existant) return jsonError("Un compte existe déjà avec cet email.", 409);

  const hash = await hashPassword(password);

  const result = await env.DB
    .prepare("INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, role) VALUES (?, ?, ?, ?)")
    .bind(nom.trim(), emailNormalise, hash, role)
    .run();

  return jsonOk({ id: result.meta.last_row_id, nom: nom.trim(), email: emailNormalise, role }, 201);
}