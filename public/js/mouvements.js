// public/js/mouvements.js

const utilisateurMouvements = renderNav("mouvements");
const estAdminMouvements = utilisateurMouvements && utilisateurMouvements.role === "admin";

document.addEventListener("DOMContentLoaded", async () => {
  if (estAdminMouvements) {
    document.getElementById("zone-type-mouvement").hidden = false;
    document.getElementById("titre-formulaire-mouvement").textContent = "Enregistrer un mouvement de stock";
  }

  await chargerListeProduitsMouvement();
  await chargerHistorique();

  document.getElementById("form-mouvement").addEventListener("submit", soumettreMouvement);
  document.getElementById("filtre-type-historique").addEventListener("change", chargerHistorique);
});

async function chargerListeProduitsMouvement() {
  const produits = await apiFetch("/produits");
  document.getElementById("mouvement-produit").innerHTML = produits
    .map(p => `<option value="${p.id}">${p.nom} (stock actuel : ${p.quantite})</option>`)
    .join("");
}

async function chargerHistorique() {
  const type = document.getElementById("filtre-type-historique").value;
  const params = new URLSearchParams();
  if (type) params.set("type", type);

  try {
    const mouvements = await apiFetch("/mouvements?" + params.toString());
    document.getElementById("corps-historique").innerHTML = mouvements.length
      ? mouvements.map(m => `
          <tr>
            <td>${m.produit_nom}</td>
            <td>${m.type === "entree" ? "Entrée" : "Sortie"}</td>
            <td>${m.quantite}</td>
            <td>${m.motif || "—"}</td>
            <td>${m.utilisateur_nom || "—"}</td>
            <td>${formatDate(m.date_mouvement)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="6">Aucun mouvement enregistré.</td></tr>`;
  } catch (err) {
    alert(err.message);
  }
}

async function soumettreMouvement(e) {
  e.preventDefault();
  const msgErreur = document.getElementById("message-erreur-mouvement");
  const msgSucces = document.getElementById("message-succes-mouvement");
  msgErreur.hidden = true;
  msgSucces.hidden = true;

  const payload = {
    produit_id: Number(document.getElementById("mouvement-produit").value),
    type: estAdminMouvements ? document.getElementById("mouvement-type").value : "sortie",
    quantite: Number(document.getElementById("mouvement-quantite").value),
    motif: document.getElementById("mouvement-motif").value,
  };

  try {
    await apiFetch("/mouvements", { method: "POST", body: JSON.stringify(payload) });
    msgSucces.textContent = "Mouvement enregistré avec succès.";
    msgSucces.hidden = false;
    document.getElementById("form-mouvement").reset();
    await chargerListeProduitsMouvement();
    await chargerHistorique();
  } catch (err) {
    msgErreur.textContent = err.message;
    msgErreur.hidden = false;
  }
}
