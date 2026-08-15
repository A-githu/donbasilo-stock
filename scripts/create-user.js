// scripts/create-user.js
// Usage local (une seule fois, avant le premier déploiement) :
//   node scripts/create-user.js "Nom" "email@exemple.com" "motdepasse" "admin"
//   node scripts/create-user.js "Nom" "email@exemple.com" "motdepasse" "vendeur"
//
// Le script affiche une commande SQL à copier-coller et exécuter avec :
//   wrangler d1 execute donbasilo-db --command="...la commande affichée..."
// (ou --remote après le déploiement, pour créer le compte sur la base en ligne)

const { webcrypto } = require("node:crypto");
const crypto = webcrypto;

const ITERATIONS = 100000;

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `${toHex(salt)}:${toHex(derived)}`;
}

async function main() {
  const [nom, email, password, role] = process.argv.slice(2);

  if (!nom || !email || !password || !role) {
    console.log('Usage : node scripts/create-user.js "Nom" "email@exemple.com" "motdepasse" "admin|vendeur"');
    process.exit(1);
  }
  if (!["admin", "vendeur"].includes(role)) {
    console.log('Le rôle doit être "admin" ou "vendeur".');
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const sql = `INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, role) VALUES ('${nom.replace(/'/g, "''")}', '${email.trim().toLowerCase()}', '${hash}', '${role}');`;

  console.log("\nCommande SQL à exécuter :\n");
  console.log(sql);
  console.log("\nExemple :");
  console.log(`wrangler d1 execute donbasilo-db --command="${sql}"`);
  console.log("(ajoute --remote une fois le projet déployé, pour viser la base en ligne au lieu de la base locale)\n");
}

main();
