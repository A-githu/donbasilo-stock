// functions/api/_middleware.js
// S'exécute avant chaque requête vers /api/*.
// Vérifie le token JWT (sauf pour /api/auth/login) et attache l'utilisateur à la requête.

import { verifyJWT } from "../_shared/jwt.js";

const ROUTES_PUBLIQUES = ["/api/auth/login"];

export async function onRequest(context) {
  const { request, env, next, data } = context;
  const url = new URL(request.url);

  if (ROUTES_PUBLIQUES.includes(url.pathname)) {
    return next();
  }

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return jsonError("Non authentifié.", 401);
  }

  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return jsonError("Session invalide ou expirée. Merci de vous reconnecter.", 401);
  }

  // Rend l'utilisateur connecté disponible pour les fonctions API suivantes
  data.user = { id: payload.userId, role: payload.role };

  return next();
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
