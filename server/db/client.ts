import { createClient, type Client } from "@libsql/client/web";

let _client: Client | null = null;

// Returns a singleton libsql client, initialised on first call.
// Must be called inside a Nuxt server context (runtimeConfig requires it).
export const useDb = (): Client => {
  if (_client) return _client;
  const config = useRuntimeConfig();
  _client = createClient({
    url: config.tursoUrl,
    authToken: config.tursoAuthToken,
  });
  return _client;
};
