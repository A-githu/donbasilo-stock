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
  utilisateurs: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`,
  burger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>`,
  parametres: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`,
  soleil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>`,
  lune: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>`,
  fermer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>`,
};

function initiales(nom) {
  if (!nom) return "??";
  return nom.trim().split(/\s+/).map(m => m[0]).join("").toUpperCase().slice(0, 2);
}

// ---------- Thème (clair / sombre) ----------
const THEME_KEY = "donbasilo_theme";

function themeActuel() {
  return localStorage.getItem(THEME_KEY) === "sombre" ? "sombre" : "clair";
}

function appliquerTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll(".theme-option").forEach(bouton => {
    bouton.classList.toggle("actif", bouton.dataset.theme === theme);
  });
}

// Applique le thème mémorisé dès le chargement du script (évite le "flash" clair)
appliquerTheme(themeActuel());

// ---------- Panneau Paramètres ----------
function construirePanneauParametres() {
  if (document.getElementById("modale-parametres")) return; // déjà construit

  const theme = themeActuel();

  document.body.insertAdjacentHTML("beforeend", `
    <div class="fond-modale" id="modale-parametres" hidden>
      <div class="contenu-modale">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <h3>Paramètres</h3>
          <button type="button" id="btn-fermer-parametres" class="btn-burger" style="color:var(--texte-clair);">${ICONES.fermer}</button>
        </div>

        <div class="parametres-section" style="margin-top:1rem;">
          <p class="parametres-label">À propos de l'application</p>
          <p class="parametres-description">
            Don Basilo est une plateforme de gestion de stock pour boutique d'accessoires
            téléphoniques : afficheurs, chargeurs, batteries, montres, tablettes et accessoires.
            Elle suit automatiquement les quantités disponibles et alerte en cas de rupture ou de
            stock faible.
          </p>
        </div>

        <div class="parametres-section">
          <p class="parametres-label">Thème</p>
          <div class="theme-toggle">
            <button type="button" class="theme-option ${theme === "clair" ? "actif" : ""}" data-theme="clair">
              ${ICONES.soleil}
              Clair
            </button>
            <button type="button" class="theme-option ${theme === "sombre" ? "actif" : ""}" data-theme="sombre">
              ${ICONES.lune}
              Sombre
            </button>
          </div>
        </div>

        <div class="parametres-section">
          <p class="parametres-label">Langue</p>
          <select id="select-langue">
            <option value="fr" selected>Français</option>
            <option value="en" disabled>English (bientôt disponible)</option>
          </select>
        </div>

        <p class="parametres-footer">Don Basilo · v1.0</p>
      </div>
    </div>
  `);

  document.getElementById("btn-fermer-parametres").addEventListener("click", fermerParametres);
  document.getElementById("modale-parametres").addEventListener("click", (e) => {
    if (e.target.id === "modale-parametres") fermerParametres();
  });
  document.querySelectorAll(".theme-option").forEach(bouton => {
    bouton.addEventListener("click", () => appliquerTheme(bouton.dataset.theme));
  });
}

function ouvrirParametres() {
  construirePanneauParametres();
  document.getElementById("modale-parametres").hidden = false;
}

function fermerParametres() {
  const modale = document.getElementById("modale-parametres");
  if (modale) modale.hidden = true;
}

/** Construit la sidebar + la barre du haut. Lit le titre/sous-titre depuis data-page-title / data-page-subtitle sur <body>. */
function renderNav(pageActive) {
  const user = requireAuth();
  if (!user) return;

  const titre = document.body.dataset.pageTitle || "Don Basilo";
  const sousTitre = document.body.dataset.pageSubtitle || "";

  const liens = [
    { id: "dashboard", href: "/dashboard.html", label: "Tableau de bord", icone: ICONES.dashboard, adminSeulement: true },
    { id: "produits", href: "/produits.html", label: "Produits", icone: ICONES.produits },
    { id: "categories", href: "/categories.html", label: "Catégories", icone: ICONES.categories },
    { id: "mouvements", href: "/mouvements.html", label: "Mouvements", icone: ICONES.mouvements },
    { id: "utilisateurs", href: "/utilisateurs.html", label: "Utilisateurs", icone: ICONES.utilisateurs, adminSeulement: true },
  ].filter(l => !l.adminSeulement || user.role === "admin");

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
        <a href="#" id="lien-parametres" class="sidebar-lien">
          ${ICONES.parametres}
          <span>Paramètres</span>
        </a>
        <a href="#" id="lien-deconnexion" class="sidebar-lien deconnexion">
          ${ICONES.logout}
          <span>Déconnexion</span>
        </a>
        <p class="sidebar-version">Don Basilo · v1.0</p>
      </div>
    `;
    document.getElementById("lien-parametres").addEventListener("click", (e) => {
      e.preventDefault();
      ouvrirParametres();
    });
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