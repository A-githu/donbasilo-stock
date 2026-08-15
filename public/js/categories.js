// public/js/categories.js

const utilisateurCategories = renderNav("categories");
const estAdminCategories = utilisateurCategories && utilisateurCategories.role === "admin";

document.addEventListener("DOMContentLoaded", async () => {
  if (estAdminCategories) {
    document.getElementById("btn-nouvelle-categorie").hidden = false;
  }
  await chargerCategoriesPage();

  document.getElementById("btn-nouvelle-categorie").addEventListener("click", () => ouvrirModaleCategorie());
  document.getElementById("btn-annuler-categorie").addEventListener("click", fermerModaleCategorie);
  document.getElementById("form-categorie").addEventListener("submit", soumettreCategorie);
});

async function chargerCategoriesPage() {
  try {
    const categories = await apiFetch("/categories");
    document.getElementById("corps-categories").innerHTML = categories.map(c => `
      <tr>
        <td>${c.nom}</td>
        <td>${c.description || "—"}</td>
        <td class="actions-cellule">
          ${estAdminCategories ? `
            <button class="btn btn-secondaire btn-petit" onclick='ouvrirModaleCategorie(${c.id}, ${JSON.stringify(c.nom)}, ${JSON.stringify(c.description || "")})'>Modifier</button>
            <button class="btn btn-danger btn-petit" onclick="supprimerCategorie(${c.id}, '${c.nom.replace(/'/g, "\\'")}')">Supprimer</button>
          ` : ""}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    alert(err.message);
  }
}

function ouvrirModaleCategorie(id, nom, description) {
  document.getElementById("message-erreur-categorie").hidden = true;
  document.getElementById("form-categorie").reset();
  document.getElementById("categorie-id").value = id || "";
  document.getElementById("categorie-nom").value = nom || "";
  document.getElementById("categorie-description").value = description || "";
  document.getElementById("titre-modale-categorie").textContent = id ? "Modifier la catégorie" : "Nouvelle catégorie";
  document.getElementById("modale-categorie").hidden = false;
}

function fermerModaleCategorie() {
  document.getElementById("modale-categorie").hidden = true;
}

async function soumettreCategorie(e) {
  e.preventDefault();
  const id = document.getElementById("categorie-id").value;
  const msgErreur = document.getElementById("message-erreur-categorie");
  msgErreur.hidden = true;

  const payload = {
    nom: document.getElementById("categorie-nom").value,
    description: document.getElementById("categorie-description").value,
  };

  try {
    if (id) {
      await apiFetch(`/categories/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiFetch("/categories", { method: "POST", body: JSON.stringify(payload) });
    }
    fermerModaleCategorie();
    chargerCategoriesPage();
  } catch (err) {
    msgErreur.textContent = err.message;
    msgErreur.hidden = false;
  }
}

async function supprimerCategorie(id, nom) {
  if (!confirm(`Supprimer la catégorie "${nom}" ?`)) return;
  try {
    await apiFetch(`/categories/${id}`, { method: "DELETE" });
    chargerCategoriesPage();
  } catch (err) {
    alert(err.message);
  }
}
