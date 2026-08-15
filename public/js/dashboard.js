// public/js/dashboard.js

renderNav("dashboard");

async function chargerDashboard() {
  try {
    const stats = await apiFetch("/dashboard/stats");

    document.getElementById("grille-kpi").innerHTML = `
      <div class="carte-kpi">
        <div class="valeur">${stats.nb_produits}</div>
        <div class="label">Références en stock</div>
      </div>
      <div class="carte-kpi">
        <div class="valeur">${formatPrix(stats.valeur_stock)}</div>
        <div class="label">Valeur totale du stock</div>
      </div>
      <div class="carte-kpi alerte">
        <div class="valeur">${stats.nb_rupture}</div>
        <div class="label">Produits en rupture</div>
      </div>
      <div class="carte-kpi alerte">
        <div class="valeur">${stats.nb_stock_faible}</div>
        <div class="label">Produits en stock faible</div>
      </div>
    `;

    const corpsAlertes = document.getElementById("corps-alertes");
    if (stats.produits_alerte.length === 0) {
      document.getElementById("msg-vide-alertes").hidden = false;
    } else {
      corpsAlertes.innerHTML = stats.produits_alerte.map(p => `
        <tr>
          <td>${p.nom}</td>
          <td>${p.categorie_nom}</td>
          <td>${p.quantite}</td>
          <td>${p.seuil_alerte}</td>
          <td>${statutBadge(p.statut)}</td>
        </tr>
      `).join("");
    }

    document.getElementById("corps-ventes").innerHTML = stats.ventes_recentes.length
      ? stats.ventes_recentes.map(v => `
          <tr>
            <td>${v.produit_nom}</td>
            <td>${v.quantite}</td>
            <td>${v.utilisateur_nom || "—"}</td>
            <td>${formatDate(v.date_mouvement)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4">Aucune vente enregistrée pour le moment.</td></tr>`;

  } catch (err) {
    document.querySelector("main").insertAdjacentHTML(
      "afterbegin",
      `<p class="message-erreur">${err.message}</p>`
    );
  }
}

chargerDashboard();
