// public/js/login.js

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const messageErreur = document.getElementById("message-erreur");
  messageErreur.hidden = true;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      messageErreur.textContent = data.error || "Une erreur est survenue.";
      messageErreur.hidden = false;
      return;
    }

    // Stocke le token et les infos utilisateur pour les prochaines requêtes API
    localStorage.setItem("donbasilo_token", data.token);
    localStorage.setItem("donbasilo_user", JSON.stringify(data.user));

    // Redirection vers le tableau de bord (page à créer à l'étape suivante)
    window.location.href = "/dashboard.html";
  } catch (err) {
    messageErreur.textContent = "Impossible de contacter le serveur.";
    messageErreur.hidden = false;
  }
});
