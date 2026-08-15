// functions/_shared/auth-helpers.js

/**
 * À utiliser dans une fonction API pour bloquer l'accès aux non-admins.
 * Exemple : const refus = requireAdmin(context); if (refus) return refus;
 */
export function requireAdmin(context) {
  if (!context.data.user || context.data.user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Action réservée à l'administrateur." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
