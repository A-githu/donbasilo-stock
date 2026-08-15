// public/js/app.js — fonctions partagées par toutes les pages

const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("donbasilo_token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("donbasilo_user"));
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem("donbasilo_token");
  localStorage.removeItem("donbasilo_user");
  window.location.href = "/login.html";
}

/** À appeler en haut de chaque page protégée. Redirige vers /login.html si non connecté. */
function requireAuth() {
  const user = getUser();
  if (!getToken() || !user) {
    window.location.href = "/login.html";
    return null;
  }
  return user;
}

/** Appelle l'API avec le token d'authentification. Lève une erreur si la réponse n'est pas OK. */
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401) {
    logout();
    throw new Error("Session expirée, merci de vous reconnecter.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

function statutBadge(statut) {
  const labels = { disponible: "Disponible", faible: "Stock faible", rupture: "Rupture" };
  return `<span class="badge badge-${statut}">${labels[statut] || statut}</span>`;
}

function formatPrix(valeur) {
  return Number(valeur).toLocaleString("fr-FR") + " FCFA";
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T") + "Z");
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

/** Construit la barre de navigation dans <div id="nav"></div>. */
function renderNav(pageActive) {
  const user = requireAuth();
  if (!user) return;

  const nav = document.getElementById("nav");
  if (!nav) return;

  const liens = [
    { id: "dashboard", href: "/dashboard.html", label: "Tableau de bord" },
    { id: "produits", href: "/produits.html", label: "Produits" },
    { id: "categories", href: "/categories.html", label: "Catégories" },
    { id: "mouvements", href: "/mouvements.html", label: "Mouvements" },
  ];

  nav.innerHTML = `
    <div class="nav-inner">
      <div class="nav-brand">Don Basilo</div>
      <nav class="nav-liens">
        ${liens.map(l => `<a href="${l.href}" class="${pageActive === l.id ? "actif" : ""}">${l.label}</a>`).join("")}
      </nav>
      <div class="nav-user">
        <span>${user.nom} <em>(${user.role})</em></span>
        <button id="btn-logout" type="button">Déconnexion</button>
      </div>
    </div>
  `;

  document.getElementById("btn-logout").addEventListener("click", logout);
}
