// functions/api/utilisateurs/[id].js
// PUT    /api/utilisateurs/:id  -> modifie un utilisateur (admin uniquement)
// DELETE /api/utilisateurs/:id  -> supprime un utilisateur (admin uniquement)

import { jsonOk, jsonError } from "../../_shared/response-helpers.js";
import { requireAdmin } from "../../_shared/auth-helpers.js";
import { hashPassword } from "../../_shared/crypto.js";

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

  const { nom, email, role, password } = body;

  if (!nom || !nom.trim()) return jsonError("Le nom est requis.");
  if (!email || !email.trim()) return jsonError("L'email est requis.");
  if (!["admin", "vendeur"].includes(role)) return jsonError('Le rôle doit être "admin" ou "vendeur".');

  const emailNormalise = email.trim().toLowerCase();

  if (password) {
    if (password.length < 6) return jsonError("Le mot de passe doit contenir au moins 6 caractères.");
    const hash = await hashPassword(password);
    await env.DB
      .prepare("UPDATE utilisateurs SET nom = ?, email = ?, role = ?, mot_de_passe_hash = ? WHERE id = ?")
      .bind(nom.trim(), emailNormalise, role, hash, params.id)
      .run();
  } else {
    await env.DB
      .prepare("UPDATE utilisateurs SET nom = ?, email = ?, role = ? WHERE id = ?")
      .bind(nom.trim(), emailNormalise, role, params.id)
      .run();
  }

  return jsonOk({ id: Number(params.id), nom: nom.trim(), email: emailNormalise, role });
}

export async function onRequestDelete(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;

  const { env, params, data } = context;

  if (Number(params.id) === data.user.id) {
    return jsonError("Vous ne pouvez pas supprimer votre propre compte.", 400);
  }

  const nbAdmins = await env.DB
    .prepare("SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'admin'")
    .first();
  const cible = await env.DB.prepare("SELECT role FROM utilisateurs WHERE id = ?").bind(params.id).first();

  if (!cible) return jsonError("Utilisateur introuvable.", 404);
  if (cible.role === "admin" && nbAdmins.total <= 1) {
    return jsonError("Impossible de supprimer le dernier compte administrateur.", 400);
  }

  await env.DB.prepare("DELETE FROM utilisateurs WHERE id = ?").bind(params.id).run();
  return jsonOk({ deleted: true });
}