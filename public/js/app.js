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

// ---------- Icônes (SVG en ligne, style traits fins) ----------
const ICONES = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
  produits: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>`,
  categories: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
  mouvements: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`,
  burger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>`,
};

function initiales(nom) {
  if (!nom) return "??";
  return nom.trim().split(/\s+/).map(m => m[0]).join("").toUpperCase().slice(0, 2);
}

/** Construit la sidebar + la barre du haut. Lit le titre/sous-titre depuis data-page-title / data-page-subtitle sur <body>. */
function renderNav(pageActive) {
  const user = requireAuth();
  if (!user) return;

  const titre = document.body.dataset.pageTitle || "Don Basilo";
  const sousTitre = document.body.dataset.pageSubtitle || "";

  const liens = [
    { id: "dashboard", href: "/dashboard.html", label: "Tableau de bord", icone: ICONES.dashboard },
    { id: "produits", href: "/produits.html", label: "Produits", icone: ICONES.produits },
    { id: "categories", href: "/categories.html", label: "Catégories", icone: ICONES.categories },
    { id: "mouvements", href: "/mouvements.html", label: "Mouvements", icone: ICONES.mouvements },
  ];

  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div class="sidebar-logo-badge">DB</div>
        <div class="sidebar-logo-texte">
          <strong>Don Basilo</strong>
          <span>Gestion de stock</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <p class="sidebar-nav-label">Menu principal</p>
        ${liens.map(l => `
          <a href="${l.href}" class="sidebar-lien ${pageActive === l.id ? "actif" : ""}">
            ${l.icone}
            <span>${l.label}</span>
          </a>
        `).join("")}
      </nav>
      <div class="sidebar-bas">
        <a href="#" id="lien-deconnexion" class="sidebar-lien deconnexion">
          ${ICONES.logout}
          <span>Déconnexion</span>
        </a>
        <p class="sidebar-version">Don Basilo · v1.0</p>
      </div>
    `;
    document.getElementById("lien-deconnexion").addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  const topbar = document.getElementById("topbar");
  if (topbar) {
    topbar.innerHTML = `
      <div class="topbar-inner">
        <div class="topbar-gauche">
          <button class="btn-burger" id="btn-burger" type="button" aria-label="Ouvrir le menu">${ICONES.burger}</button>
          <div class="topbar-titre">
            <h1>${titre}</h1>
            ${sousTitre ? `<p>${sousTitre}</p>` : ""}
          </div>
        </div>
        <div class="topbar-droite">
          <div class="topbar-user-info">
            <strong>${user.nom}</strong>
            <span>${user.role === "admin" ? "Administrateur" : "Vendeur"}</span>
          </div>
          <div class="avatar">${initiales(user.nom)}</div>
        </div>
      </div>
    `;
    document.getElementById("btn-burger").addEventListener("click", () => {
      document.getElementById("sidebar").classList.add("ouvert");
      document.getElementById("sidebar-backdrop").classList.add("visible");
    });
  }

  const backdrop = document.getElementById("sidebar-backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      document.getElementById("sidebar").classList.remove("ouvert");
      backdrop.classList.remove("visible");
    });
  }

  return user;
}