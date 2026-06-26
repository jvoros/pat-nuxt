// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  ssr: false,

  alias: {
    "#core": "./server/core",
    "#core/*": "./server/core/*",
  },

  runtimeConfig: {
    tursoUrl: "", // overridden by NUXT_TURSO_URL
    tursoAuthToken: "", // overridden by NUXT_TURSO_AUTH_TOKEN
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  modules: ["nuxt-auth-utils"],
});
