// public/js/utilisateurs.js

const utilisateurConnecte = renderNav("utilisateurs");

if (utilisateurConnecte && utilisateurConnecte.role !== "admin") {
  window.location.href = "/produits.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  await chargerUtilisateurs();

  document.getElementById("btn-nouvel-utilisateur").addEventListener("click", () => ouvrirModaleUtilisateur());
  document.getElementById("btn-annuler-utilisateur").addEventListener("click", fermerModaleUtilisateur);
  document.getElementById("form-utilisateur").addEventListener("submit", soumettreUtilisateur);
});

async function chargerUtilisateurs() {
  try {
    const utilisateurs = await apiFetch("/utilisateurs");
    document.getElementById("corps-utilisateurs").innerHTML = utilisateurs.map(u => `
      <tr>
        <td>${u.nom}</td>
        <td>${u.email}</td>
        <td>${u.role === "admin" ? "Administrateur" : "Vendeur"}</td>
        <td class="actions-cellule">
          <button class="btn btn-secondaire btn-petit" onclick='ouvrirModaleUtilisateur(${u.id}, ${JSON.stringify(u.nom)}, ${JSON.stringify(u.email)}, ${JSON.stringify(u.role)})'>Modifier</button>
          <button class="btn btn-danger btn-petit" onclick="supprimerUtilisateur(${u.id}, '${u.nom.replace(/'/g, "\\'")}')">Supprimer</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    alert(err.message);
  }
}

function ouvrirModaleUtilisateur(id, nom, email, role) {
  document.getElementById("message-erreur-utilisateur").hidden = true;
  document.getElementById("form-utilisateur").reset();
  document.getElementById("utilisateur-id").value = id || "";
  document.getElementById("utilisateur-nom").value = nom || "";
  document.getElementById("utilisateur-email").value = email || "";
  document.getElementById("utilisateur-role").value = role || "vendeur";

  const champPassword = document.getElementById("utilisateur-password");
  const labelPassword = document.getElementById("label-utilisateur-password");
  if (id) {
    document.getElementById("titre-modale-utilisateur").textContent = "Modifier l'utilisateur";
    champPassword.required = false;
    labelPassword.textContent = "Nouveau mot de passe (laisser vide pour ne pas changer)";
  } else {
    document.getElementById("titre-modale-utilisateur").textContent = "Nouvel utilisateur";
    champPassword.required = true;
    labelPassword.textContent = "Mot de passe";
  }

  document.getElementById("modale-utilisateur").hidden = false;
}

function fermerModaleUtilisateur() {
  document.getElementById("modale-utilisateur").hidden = true;
}

async function soumettreUtilisateur(e) {
  e.preventDefault();
  const id = document.getElementById("utilisateur-id").value;
  const msgErreur = document.getElementById("message-erreur-utilisateur");
  msgErreur.hidden = true;

  const payload = {
    nom: document.getElementById("utilisateur-nom").value,
    email: document.getElementById("utilisateur-email").value,
    role: document.getElementById("utilisateur-role").value,
  };
  const password = document.getElementById("utilisateur-password").value;
  if (password) payload.password = password;

  try {
    if (id) {
      await apiFetch(`/utilisateurs/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiFetch("/utilisateurs", { method: "POST", body: JSON.stringify(payload) });
    }
    fermerModaleUtilisateur();
    chargerUtilisateurs();
  } catch (err) {
    msgErreur.textContent = err.message;
    msgErreur.hidden = false;
  }
}

async function supprimerUtilisateur(id, nom) {
  if (!confirm(`Supprimer le compte de "${nom}" ?`)) return;
  try {
    await apiFetch(`/utilisateurs/${id}`, { method: "DELETE" });
    chargerUtilisateurs();
  } catch (err) {
    alert(err.message);
  }
}