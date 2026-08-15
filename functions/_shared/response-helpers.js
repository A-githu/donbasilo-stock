// functions/_shared/response-helpers.js

export function jsonOk(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Calcule le statut d'un produit selon sa quantité et son seuil d'alerte.
 * Retourne "rupture", "faible" ou "disponible".
 */
export function statutStock(quantite, seuilAlerte) {
  if (quantite <= 0) return "rupture";
  if (quantite <= seuilAlerte) return "faible";
  return "disponible";
}
