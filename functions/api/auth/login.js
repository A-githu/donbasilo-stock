// functions/api/auth/login.js
// POST /api/auth/login
// Body attendu : { "email": "...", "password": "..." }
// Réponse : { token, user: { id, nom, email, role } }

import { verifyPassword } from "../../_shared/crypto.js";
import { signJWT } from "../../_shared/jwt.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Requête invalide.", 400);
  }

  const { email, password } = body;
  if (!email || !password) {
    return jsonError("Email et mot de passe requis.", 400);
  }

  const user = await env.DB
    .prepare("SELECT id, nom, email, mot_de_passe_hash, role FROM utilisateurs WHERE email = ?")
    .bind(email.trim().toLowerCase())
    .first();

  if (!user) {
    return jsonError("Identifiants incorrects.", 401);
  }

  const passwordValid = await verifyPassword(password, user.mot_de_passe_hash);
  if (!passwordValid) {
    return jsonError("Identifiants incorrects.", 401);
  }

  const token = await signJWT(
    { userId: user.id, role: user.role },
    env.JWT_SECRET
  );

  return new Response(
    JSON.stringify({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
