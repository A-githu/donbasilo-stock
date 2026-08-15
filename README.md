# Don Basilo — Plateforme de gestion de stock

Structure de base du projet (étapes 3 à 5 du plan).

## Contenu
- `public/` → frontend (HTML/CSS/JS), servi par Cloudflare Pages
- `functions/api/` → backend (fonctions JavaScript), à remplir à l'étape suivante
- `schema.sql` → structure de la base de données (catégories, produits, mouvements, utilisateurs)
- `wrangler.toml` → configuration Cloudflare (à compléter avec l'ID de la base D1 quand tu seras prêt)

## Comment récupérer ce projet chez toi

1. Télécharge/copie ce dossier `donbasilo-stock/`
2. Dans le dossier, initialise Git et pousse-le vers ton dépôt GitHub existant :
   ```
   git init
   git add .
   git commit -m "Structure initiale du projet Don Basilo"
   git branch -M main
   git remote add origin <URL_DE_TON_DEPOT_GITHUB>
   git push -u origin main
   ```

## Étapes suivantes (quand tu seras prêt pour Cloudflare)

1. `npm install -g wrangler` puis `wrangler login`
2. `wrangler d1 create donbasilo-db` → copier l'ID généré dans `wrangler.toml` (champ `database_id`)
3. `wrangler d1 execute donbasilo-db --file=schema.sql` → applique le schéma à la base
4. Connecter le dépôt GitHub à un projet Cloudflare Pages (déploiement automatique à chaque `push`)

## Étape de développement suivante
Développer l'authentification (Admin/Vendeur) dans `functions/api/`, comme prévu à l'étape 6 du plan.

---

## ✅ Étape 6 réalisée : Authentification (Admin / Vendeur)

### Ce qui a été ajouté
- `functions/_shared/crypto.js` → hachage sécurisé des mots de passe (PBKDF2, Web Crypto)
- `functions/_shared/jwt.js` → création/vérification de token de connexion (JWT)
- `functions/_shared/auth-helpers.js` → pour restreindre certaines routes au rôle admin
- `functions/api/auth/login.js` → API de connexion : `POST /api/auth/login`
- `functions/api/_middleware.js` → protège automatiquement toutes les routes `/api/*` (sauf la connexion) : sans token valide, l'accès est refusé
- `public/login.html` + `public/js/login.js` → page de connexion
- `scripts/create-user.js` → script pour créer les deux comptes (admin et vendeur)

### Comment créer les deux comptes (Admin et Vendeur)

1. Ajoute un secret pour signer les connexions (remplace `une_phrase_secrete_longue` par autre chose) :
   ```
   wrangler pages secret put JWT_SECRET
   ```
   (il te sera demandé de taper la valeur secrète — choisis une phrase longue et unique, garde-la seulement pour toi)

2. Génère la commande SQL pour le compte admin :
   ```
   node scripts/create-user.js "Basilo" "admin@donbasilo.com" "motdepasse_admin" "admin"
   ```
   Puis copie-colle la commande `wrangler d1 execute ...` affichée.

3. Fais pareil pour le compte vendeur :
   ```
   node scripts/create-user.js "Vendeur 1" "vendeur@donbasilo.com" "motdepasse_vendeur" "vendeur"
   ```

⚠️ Choisis de vrais mots de passe (pas ceux d'exemple) avant la mise en ligne réelle.

### Tester en local
```
wrangler pages dev public
```
Puis ouvre `http://localhost:8788/login.html` et connecte-toi avec l'un des deux comptes créés.

### Prochaine étape
Développer les API produits et catégories (lister, ajouter, modifier), puis les mouvements de stock (entrée/sortie) avec mise à jour automatique des quantités.

---

## ✅ Projet complet (pages + API connectées)

### Pages (public/)
- `login.html` — connexion (Admin / Vendeur)
- `dashboard.html` — tableau de bord : valeur du stock, alertes, dernières ventes
- `produits.html` — liste filtrable, ajout/modification/suppression (admin)
- `categories.html` — gestion des catégories (admin)
- `mouvements.html` — enregistrement des ventes (tous) et réapprovisionnements (admin), historique

### API (functions/api/)
- `auth/login.js` — connexion
- `categories/index.js` + `categories/[id].js` — CRUD catégories (écriture réservée à l'admin)
- `produits/index.js` + `produits/[id].js` — CRUD produits (écriture réservée à l'admin ; le prix d'achat est masqué pour le vendeur)
- `mouvements/index.js` — historique + enregistrement (le vendeur ne peut créer que des sorties/ventes)
- `dashboard/stats.js` — statistiques et alertes de stock

Toutes les routes `/api/*` (sauf `/api/auth/login`) sont protégées par le middleware de connexion.
Le statut d'un produit (Disponible / Stock faible / Rupture) est calculé automatiquement selon la quantité et le seuil d'alerte, et affiché en couleur (vert / orange / rouge).

### Pour tester en local
```
wrangler pages dev public
```
Ouvre `http://localhost:8788` (redirige automatiquement vers la connexion).

### Pour pousser sur GitHub (dépôt A-githu)
GitHub n'accepte plus les mots de passe pour `git push` — il faut un **token d'accès personnel** :
1. Sur GitHub : Settings → Developer settings → Personal access tokens → Generate new token (droits : `repo`)
2. Depuis le dossier du projet :
   ```
   git init
   git add .
   git commit -m "Projet complet Don Basilo : pages + API connectées"
   git branch -M main
   git remote add origin https://github.com/A-githu/<nom-du-depot>.git
   git push -u origin main
   ```
   Quand Git demande le mot de passe, colle le **token** (pas ton mot de passe GitHub).

### Étape suivante
Une fois poussé sur GitHub : connexion du dépôt à un projet **Cloudflare Pages**, création de la base **D1**, puis premier déploiement en ligne.
