// public/js/produits.js

const utilisateur = renderNav("produits");
const estAdmin = utilisateur && utilisateur.role === "admin";

let categoriesCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (estAdmin) {
    document.getElementById("btn-nouveau-produit").hidden = false;
  }

  await chargerCategories();
  await chargerProduits();

  document.getElementById("filtre-recherche").addEventListener("input", debounce(chargerProduits, 300));
  document.getElementById("filtre-categorie").addEventListener("change", chargerProduits);
  document.getElementById("filtre-statut").addEventListener("change", chargerProduits);

  document.getElementById("btn-nouveau-produit").addEventListener("click", () => ouvrirModaleProduit());
  document.getElementById("btn-annuler-produit").addEventListener("click", fermerModaleProduit);
  document.getElementById("form-produit").addEventListener("submit", soumettreProduit);
});

function debounce(fn, delai) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delai); };
}

async function chargerCategories() {
  categoriesCache = await apiFetch("/categories");

  const selectFiltre = document.getElementById("filtre-categorie");
  const selectFormulaire = document.getElementById("produit-categorie");

  categoriesCache.forEach(c => {
    selectFiltre.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nom}</option>`);
    selectFormulaire.insertAdjacentHTML("beforeend", `<option value="${c.id}">${c.nom}</option>`);
  });
}

async function chargerProduits() {
  const q = document.getElementById("filtre-recherche").value.trim();
  const categorieId = document.getElementById("filtre-categorie").value;
  const statut = document.getElementById("filtre-statut").value;

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categorieId) params.set("categorie_id", categorieId);
  if (statut) params.set("statut", statut);

  try {
    const produits = await apiFetch("/produits?" + params.toString());
    const corps = document.getElementById("corps-produits");
    const msgVide = document.getElementById("msg-vide-produits");

    if (produits.length === 0) {
      corps.innerHTML = "";
      msgVide.hidden = false;
      return;
    }
    msgVide.hidden = true;

    corps.innerHTML = produits.map(p => `
      <tr>
        <td>${p.nom}</td>
        <td>${p.categorie_nom}</td>
        <td>${[p.marque, p.modele_compatible].filter(Boolean).join(" — ") || "—"}</td>
        <td>${formatPrix(p.prix_vente)}</td>
        <td>${p.quantite}</td>
        <td>${statutBadge(p.statut)}</td>
        <td class="actions-cellule">
          ${estAdmin ? `
            <button class="btn btn-secondaire btn-petit" onclick="ouvrirModaleProduit(${p.id})">Modifier</button>
            <button class="btn btn-danger btn-petit" onclick="supprimerProduit(${p.id}, '${p.nom.replace(/'/g, "\\'")}')">Supprimer</button>
          ` : ""}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    alert(err.message);
  }
}

async function ouvrirModaleProduit(id) {
  document.getElementById("message-erreur-produit").hidden = true;
  document.getElementById("form-produit").reset();
  document.getElementById("produit-id").value = "";
  const champQuantite = document.getElementById("produit-quantite");

  if (id) {
    document.getElementById("titre-modale-produit").textContent = "Modifier le produit";
    const p = await apiFetch(`/produits/${id}`);
    document.getElementById("produit-id").value = p.id;
    document.getElementById("produit-nom").value = p.nom;
    document.getElementById("produit-categorie").value = p.categorie_id;
    document.getElementById("produit-marque").value = p.marque || "";
    document.getElementById("produit-modele").value = p.modele_compatible || "";
    document.getElementById("produit-prix-achat").value = p.prix_achat || "";
    document.getElementById("produit-prix-vente").value = p.prix_vente;
    document.getElementById("produit-seuil").value = p.seuil_alerte;

    champQuantite.value = p.quantite;
    champQuantite.disabled = true;
    champQuantite.title = "Utilisez la page Mouvements pour ajuster la quantité.";
  } else {
    document.getElementById("titre-modale-produit").textContent = "Ajouter un produit";
    champQuantite.disabled = false;
    champQuantite.value = 0;
  }

  document.getElementById("modale-produit").hidden = false;
}

function fermerModaleProduit() {
  document.getElementById("modale-produit").hidden = true;
}

async function soumettreProduit(e) {
  e.preventDefault();
  const id = document.getElementById("produit-id").value;
  const msgErreur = document.getElementById("message-erreur-produit");
  msgErreur.hidden = true;

  const payload = {
    nom: document.getElementById("produit-nom").value,
    categorie_id: Number(document.getElementById("produit-categorie").value),
    marque: document.getElementById("produit-marque").value,
    modele_compatible: document.getElementById("produit-modele").value,
    prix_achat: Number(document.getElementById("produit-prix-achat").value) || 0,
    prix_vente: Number(document.getElementById("produit-prix-vente").value),
    seuil_alerte: Number(document.getElementById("produit-seuil").value) || 0,
  };
  if (!id) payload.quantite = Number(document.getElementById("produit-quantite").value) || 0;

  try {
    if (id) {
      await apiFetch(`/produits/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiFetch("/produits", { method: "POST", body: JSON.stringify(payload) });
    }
    fermerModaleProduit();
    chargerProduits();
  } catch (err) {
    msgErreur.textContent = err.message;
    msgErreur.hidden = false;
  }
}

async function supprimerProduit(id, nom) {
  if (!confirm(`Supprimer définitivement "${nom}" ? Cette action est irréversible.`)) return;
  try {
    await apiFetch(`/produits/${id}`, { method: "DELETE" });
    chargerProduits();
  } catch (err) {
    alert(err.message);
  }
}
