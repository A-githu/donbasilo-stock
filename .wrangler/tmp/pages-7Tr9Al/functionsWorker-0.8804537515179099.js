var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _shared/crypto.js
var ITERATIONS = 1e5;
function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(toHex, "toHex");
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
__name(fromHex, "fromHex");
async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = fromHex(saltHex);
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
  return toHex(derived) === hashHex;
}
__name(verifyPassword, "verifyPassword");

// _shared/jwt.js
function base64urlEncode(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64urlEncode, "base64urlEncode");
function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}
__name(base64urlDecode, "base64urlDecode");
async function getKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(getKey, "getKey");
async function signJWT(payload, secret, expiresInSeconds = 8 * 60 * 60) {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + expiresInSeconds
  };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${base64urlEncode(signature)}`;
}
__name(signJWT, "signJWT");
async function verifyJWT(token, secret) {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
    const data = `${encodedHeader}.${encodedPayload}`;
    const key = await getKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(encodedSignature),
      new TextEncoder().encode(data)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedPayload)));
    if (payload.exp && Math.floor(Date.now() / 1e3) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");

// api/auth/login.js
async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Requ\xEAte invalide.", 400);
  }
  const { email, password } = body;
  if (!email || !password) {
    return jsonError("Email et mot de passe requis.", 400);
  }
  const user = await env.DB.prepare("SELECT id, nom, email, mot_de_passe_hash, role FROM utilisateurs WHERE email = ?").bind(email.trim().toLowerCase()).first();
  if (!user) {
    return jsonError("Identifiants incorrects.", 401);
  }
  const passwordValid = await verifyPassword(password, user.mot_de_passe_hash);
  if (!passwordValid) {
    return jsonError("Identifiants incorrects.", 401);
  }
  const token = await signJWT(
    { userId: user.id, role: user.role },
    env.JWT_SECRET
  );
  return new Response(
    JSON.stringify({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
__name(onRequestPost, "onRequestPost");
function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonError, "jsonError");

// _shared/response-helpers.js
function jsonOk(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonOk, "jsonOk");
function jsonError2(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonError2, "jsonError");
function statutStock(quantite, seuilAlerte) {
  if (quantite <= 0) return "rupture";
  if (quantite <= seuilAlerte) return "faible";
  return "disponible";
}
__name(statutStock, "statutStock");

// api/dashboard/stats.js
async function onRequestGet(context) {
  const { env, data } = context;
  const { results: produits } = await env.DB.prepare(`
      SELECT p.id, p.nom, p.quantite, p.seuil_alerte, p.prix_vente, c.nom as categorie_nom
      FROM produits p
      JOIN categories c ON c.id = p.categorie_id
    `).all();
  const nbProduits = produits.length;
  const valeurStock = produits.reduce((total, p) => total + p.quantite * p.prix_vente, 0);
  const produitsAlerte = produits.map((p) => ({ ...p, statut: statutStock(p.quantite, p.seuil_alerte) })).filter((p) => p.statut !== "disponible").sort((a, b) => a.quantite - b.quantite).slice(0, 30);
  const nbRupture = produits.filter((p) => p.quantite <= 0).length;
  const nbFaible = produits.filter((p) => p.quantite > 0 && p.quantite <= p.seuil_alerte).length;
  const { results: ventesRecentes } = await env.DB.prepare(`
      SELECT m.id, p.nom as produit_nom, m.quantite, m.date_mouvement, u.nom as utilisateur_nom
      FROM mouvements_stock m
      JOIN produits p ON p.id = m.produit_id
      LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
      WHERE m.type = 'sortie'
      ORDER BY m.date_mouvement DESC
      LIMIT 10
    `).all();
  return jsonOk({
    nb_produits: nbProduits,
    valeur_stock: valeurStock,
    nb_rupture: nbRupture,
    nb_stock_faible: nbFaible,
    produits_alerte: produitsAlerte,
    ventes_recentes: ventesRecentes
  });
}
__name(onRequestGet, "onRequestGet");

// _shared/auth-helpers.js
function requireAdmin(context) {
  if (!context.data.user || context.data.user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Action r\xE9serv\xE9e \xE0 l'administrateur." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
__name(requireAdmin, "requireAdmin");

// api/categories/[id].js
async function onRequestPut(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;
  const { env, request, params } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError2("Requ\xEAte invalide.");
  }
  const { nom, description } = body;
  if (!nom || !nom.trim()) {
    return jsonError2("Le nom de la cat\xE9gorie est requis.");
  }
  await env.DB.prepare("UPDATE categories SET nom = ?, description = ? WHERE id = ?").bind(nom.trim(), description || null, params.id).run();
  return jsonOk({ id: Number(params.id), nom: nom.trim(), description: description || null });
}
__name(onRequestPut, "onRequestPut");
async function onRequestDelete(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;
  const { env, params } = context;
  const produitsLies = await env.DB.prepare("SELECT COUNT(*) as total FROM produits WHERE categorie_id = ?").bind(params.id).first();
  if (produitsLies.total > 0) {
    return jsonError2("Impossible de supprimer : des produits sont encore rattach\xE9s \xE0 cette cat\xE9gorie.", 409);
  }
  await env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(params.id).run();
  return jsonOk({ deleted: true });
}
__name(onRequestDelete, "onRequestDelete");

// api/produits/[id].js
async function onRequestGet2(context) {
  const { env, params, data } = context;
  const produit = await env.DB.prepare(`
      SELECT p.id, p.nom, p.categorie_id, c.nom as categorie_nom, p.marque, p.modele_compatible,
             p.prix_achat, p.prix_vente, p.quantite, p.seuil_alerte, p.image_url, p.date_creation
      FROM produits p
      JOIN categories c ON c.id = p.categorie_id
      WHERE p.id = ?
    `).bind(params.id).first();
  if (!produit) return jsonError2("Produit introuvable.", 404);
  produit.statut = statutStock(produit.quantite, produit.seuil_alerte);
  if (data.user.role !== "admin") delete produit.prix_achat;
  const { results: mouvements } = await env.DB.prepare(`
      SELECT m.id, m.type, m.quantite, m.motif, m.date_mouvement, u.nom as utilisateur_nom
      FROM mouvements_stock m
      LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
      WHERE m.produit_id = ?
      ORDER BY m.date_mouvement DESC
      LIMIT 50
    `).bind(params.id).all();
  return jsonOk({ ...produit, mouvements });
}
__name(onRequestGet2, "onRequestGet");
async function onRequestPut2(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;
  const { env, request, params } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError2("Requ\xEAte invalide.");
  }
  const { nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, seuil_alerte, image_url } = body;
  if (!nom || !nom.trim()) return jsonError2("Le nom du produit est requis.");
  if (!categorie_id) return jsonError2("La cat\xE9gorie est requise.");
  await env.DB.prepare(`
      UPDATE produits
      SET nom = ?, categorie_id = ?, marque = ?, modele_compatible = ?, prix_achat = ?, prix_vente = ?, seuil_alerte = ?, image_url = ?
      WHERE id = ?
    `).bind(
    nom.trim(),
    categorie_id,
    marque || null,
    modele_compatible || null,
    prix_achat || 0,
    prix_vente,
    seuil_alerte ?? 2,
    image_url || null,
    params.id
  ).run();
  return jsonOk({ updated: true });
}
__name(onRequestPut2, "onRequestPut");
async function onRequestDelete2(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;
  const { env, params } = context;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM mouvements_stock WHERE produit_id = ?").bind(params.id),
    env.DB.prepare("DELETE FROM produits WHERE id = ?").bind(params.id)
  ]);
  return jsonOk({ deleted: true });
}
__name(onRequestDelete2, "onRequestDelete");

// api/categories/index.js
async function onRequestGet3(context) {
  const { env } = context;
  const { results } = await env.DB.prepare("SELECT id, nom, description FROM categories ORDER BY nom ASC").all();
  return jsonOk(results);
}
__name(onRequestGet3, "onRequestGet");
async function onRequestPost2(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;
  const { env, request } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError2("Requ\xEAte invalide.");
  }
  const { nom, description } = body;
  if (!nom || !nom.trim()) {
    return jsonError2("Le nom de la cat\xE9gorie est requis.");
  }
  try {
    const result = await env.DB.prepare("INSERT INTO categories (nom, description) VALUES (?, ?)").bind(nom.trim(), description || null).run();
    return jsonOk({ id: result.meta.last_row_id, nom: nom.trim(), description: description || null }, 201);
  } catch (err) {
    return jsonError2("Cette cat\xE9gorie existe d\xE9j\xE0.", 409);
  }
}
__name(onRequestPost2, "onRequestPost");

// api/mouvements/index.js
async function onRequestGet4(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const produitId = url.searchParams.get("produit_id");
  const type = url.searchParams.get("type");
  let sql = `
    SELECT m.id, m.produit_id, p.nom as produit_nom, m.type, m.quantite, m.motif,
           m.date_mouvement, u.nom as utilisateur_nom
    FROM mouvements_stock m
    JOIN produits p ON p.id = m.produit_id
    LEFT JOIN utilisateurs u ON u.id = m.utilisateur_id
    WHERE 1=1
  `;
  const bindings = [];
  if (produitId) {
    sql += " AND m.produit_id = ?";
    bindings.push(produitId);
  }
  if (type) {
    sql += " AND m.type = ?";
    bindings.push(type);
  }
  sql += " ORDER BY m.date_mouvement DESC LIMIT 200";
  const { results } = await env.DB.prepare(sql).bind(...bindings).all();
  return jsonOk(results);
}
__name(onRequestGet4, "onRequestGet");
async function onRequestPost3(context) {
  const { env, request, data } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError2("Requ\xEAte invalide.");
  }
  const { produit_id, type, quantite, motif } = body;
  if (!produit_id) return jsonError2("Le produit est requis.");
  if (!["entree", "sortie"].includes(type)) return jsonError2('Le type doit \xEAtre "entree" ou "sortie".');
  if (!quantite || quantite <= 0) return jsonError2("La quantit\xE9 doit \xEAtre sup\xE9rieure \xE0 0.");
  if (data.user.role !== "admin" && type !== "sortie") {
    return jsonError2("Seul l'administrateur peut enregistrer une entr\xE9e de stock.", 403);
  }
  const produit = await env.DB.prepare("SELECT id, quantite FROM produits WHERE id = ?").bind(produit_id).first();
  if (!produit) return jsonError2("Produit introuvable.", 404);
  if (type === "sortie" && produit.quantite < quantite) {
    return jsonError2(`Stock insuffisant (quantit\xE9 disponible : ${produit.quantite}).`, 409);
  }
  const nouvelleQuantite = type === "entree" ? produit.quantite + quantite : produit.quantite - quantite;
  await env.DB.batch([
    env.DB.prepare("UPDATE produits SET quantite = ? WHERE id = ?").bind(nouvelleQuantite, produit_id),
    env.DB.prepare("INSERT INTO mouvements_stock (produit_id, type, quantite, motif, utilisateur_id) VALUES (?, ?, ?, ?, ?)").bind(produit_id, type, quantite, motif || null, data.user.id)
  ]);
  return jsonOk({ produit_id, nouvelle_quantite: nouvelleQuantite }, 201);
}
__name(onRequestPost3, "onRequestPost");

// api/produits/index.js
async function onRequestGet5(context) {
  const { env, request, data } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  const categorieId = url.searchParams.get("categorie_id");
  const statutFiltre = url.searchParams.get("statut");
  let sql = `
    SELECT p.id, p.nom, p.categorie_id, c.nom as categorie_nom, p.marque, p.modele_compatible,
           p.prix_achat, p.prix_vente, p.quantite, p.seuil_alerte, p.image_url, p.date_creation
    FROM produits p
    JOIN categories c ON c.id = p.categorie_id
    WHERE 1=1
  `;
  const bindings = [];
  if (q) {
    sql += " AND (p.nom LIKE ? OR p.marque LIKE ? OR p.modele_compatible LIKE ?)";
    const like = `%${q}%`;
    bindings.push(like, like, like);
  }
  if (categorieId) {
    sql += " AND p.categorie_id = ?";
    bindings.push(categorieId);
  }
  sql += " ORDER BY p.nom ASC";
  const { results } = await env.DB.prepare(sql).bind(...bindings).all();
  let produits = results.map((p) => ({
    ...p,
    statut: statutStock(p.quantite, p.seuil_alerte)
  }));
  if (statutFiltre) {
    produits = produits.filter((p) => p.statut === statutFiltre);
  }
  if (data.user.role !== "admin") {
    produits = produits.map(({ prix_achat, ...reste }) => reste);
  }
  return jsonOk(produits);
}
__name(onRequestGet5, "onRequestGet");
async function onRequestPost4(context) {
  const refus = requireAdmin(context);
  if (refus) return refus;
  const { env, request } = context;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError2("Requ\xEAte invalide.");
  }
  const { nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte, image_url } = body;
  if (!nom || !nom.trim()) return jsonError2("Le nom du produit est requis.");
  if (!categorie_id) return jsonError2("La cat\xE9gorie est requise.");
  if (prix_vente === void 0 || prix_vente === null || isNaN(prix_vente)) {
    return jsonError2("Le prix de vente est requis.");
  }
  const result = await env.DB.prepare(`
      INSERT INTO produits (nom, categorie_id, marque, modele_compatible, prix_achat, prix_vente, quantite, seuil_alerte, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
    nom.trim(),
    categorie_id,
    marque || null,
    modele_compatible || null,
    prix_achat || 0,
    prix_vente,
    quantite || 0,
    seuil_alerte ?? 2,
    image_url || null
  ).run();
  return jsonOk({ id: result.meta.last_row_id }, 201);
}
__name(onRequestPost4, "onRequestPost");

// api/_middleware.js
var ROUTES_PUBLIQUES = ["/api/auth/login"];
async function onRequest(context) {
  const { request, env, next, data } = context;
  const url = new URL(request.url);
  if (ROUTES_PUBLIQUES.includes(url.pathname)) {
    return next();
  }
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return jsonError3("Non authentifi\xE9.", 401);
  }
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) {
    return jsonError3("Session invalide ou expir\xE9e. Merci de vous reconnecter.", 401);
  }
  data.user = { id: payload.userId, role: payload.role };
  return next();
}
__name(onRequest, "onRequest");
function jsonError3(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonError3, "jsonError");

// ../.wrangler/tmp/pages-7Tr9Al/functionsRoutes-0.6662444478428587.mjs
var routes = [
  {
    routePath: "/api/auth/login",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/dashboard/stats",
    mountPath: "/api/dashboard",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/categories/:id",
    mountPath: "/api/categories",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/categories/:id",
    mountPath: "/api/categories",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/produits/:id",
    mountPath: "/api/produits",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/produits/:id",
    mountPath: "/api/produits",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/produits/:id",
    mountPath: "/api/produits",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut2]
  },
  {
    routePath: "/api/categories",
    mountPath: "/api/categories",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/categories",
    mountPath: "/api/categories",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/mouvements",
    mountPath: "/api/mouvements",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/mouvements",
    mountPath: "/api/mouvements",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/produits",
    mountPath: "/api/produits",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/produits",
    mountPath: "/api/produits",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api",
    mountPath: "/api",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];

// ../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
