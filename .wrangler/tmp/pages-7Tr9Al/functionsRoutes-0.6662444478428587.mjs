import { onRequestPost as __api_auth_login_js_onRequestPost } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\auth\\login.js"
import { onRequestGet as __api_dashboard_stats_js_onRequestGet } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\dashboard\\stats.js"
import { onRequestDelete as __api_categories__id__js_onRequestDelete } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\categories\\[id].js"
import { onRequestPut as __api_categories__id__js_onRequestPut } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\categories\\[id].js"
import { onRequestDelete as __api_produits__id__js_onRequestDelete } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\produits\\[id].js"
import { onRequestGet as __api_produits__id__js_onRequestGet } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\produits\\[id].js"
import { onRequestPut as __api_produits__id__js_onRequestPut } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\produits\\[id].js"
import { onRequestGet as __api_categories_index_js_onRequestGet } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\categories\\index.js"
import { onRequestPost as __api_categories_index_js_onRequestPost } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\categories\\index.js"
import { onRequestGet as __api_mouvements_index_js_onRequestGet } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\mouvements\\index.js"
import { onRequestPost as __api_mouvements_index_js_onRequestPost } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\mouvements\\index.js"
import { onRequestGet as __api_produits_index_js_onRequestGet } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\produits\\index.js"
import { onRequestPost as __api_produits_index_js_onRequestPost } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\produits\\index.js"
import { onRequest as __api__middleware_js_onRequest } from "C:\\Users\\USER PRO\\Desktop\\donbasilo-stock\\functions\\api\\_middleware.js"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestPost],
    },
  {
      routePath: "/api/dashboard/stats",
      mountPath: "/api/dashboard",
      method: "GET",
      middlewares: [],
      modules: [__api_dashboard_stats_js_onRequestGet],
    },
  {
      routePath: "/api/categories/:id",
      mountPath: "/api/categories",
      method: "DELETE",
      middlewares: [],
      modules: [__api_categories__id__js_onRequestDelete],
    },
  {
      routePath: "/api/categories/:id",
      mountPath: "/api/categories",
      method: "PUT",
      middlewares: [],
      modules: [__api_categories__id__js_onRequestPut],
    },
  {
      routePath: "/api/produits/:id",
      mountPath: "/api/produits",
      method: "DELETE",
      middlewares: [],
      modules: [__api_produits__id__js_onRequestDelete],
    },
  {
      routePath: "/api/produits/:id",
      mountPath: "/api/produits",
      method: "GET",
      middlewares: [],
      modules: [__api_produits__id__js_onRequestGet],
    },
  {
      routePath: "/api/produits/:id",
      mountPath: "/api/produits",
      method: "PUT",
      middlewares: [],
      modules: [__api_produits__id__js_onRequestPut],
    },
  {
      routePath: "/api/categories",
      mountPath: "/api/categories",
      method: "GET",
      middlewares: [],
      modules: [__api_categories_index_js_onRequestGet],
    },
  {
      routePath: "/api/categories",
      mountPath: "/api/categories",
      method: "POST",
      middlewares: [],
      modules: [__api_categories_index_js_onRequestPost],
    },
  {
      routePath: "/api/mouvements",
      mountPath: "/api/mouvements",
      method: "GET",
      middlewares: [],
      modules: [__api_mouvements_index_js_onRequestGet],
    },
  {
      routePath: "/api/mouvements",
      mountPath: "/api/mouvements",
      method: "POST",
      middlewares: [],
      modules: [__api_mouvements_index_js_onRequestPost],
    },
  {
      routePath: "/api/produits",
      mountPath: "/api/produits",
      method: "GET",
      middlewares: [],
      modules: [__api_produits_index_js_onRequestGet],
    },
  {
      routePath: "/api/produits",
      mountPath: "/api/produits",
      method: "POST",
      middlewares: [],
      modules: [__api_produits_index_js_onRequestPost],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [__api__middleware_js_onRequest],
      modules: [],
    },
  ]