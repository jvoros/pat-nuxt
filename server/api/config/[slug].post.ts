import { updateConfig } from "../../db/queries";
import type { SiteConfig } from "../core/types";

// Returns the current board for a site, or null if no board exists yet.
// The client uses this for the initial page load before the WebSocket connects.
export default defineEventHandler(async (event) => {
  const { slug, config } = await readBody<{ slug: string; config: SiteConfig }>(
    event,
  );
  const session = await getUserSession(event);

  if (!session?.admin) {
    throw createError({ statusCode: 401, message: "Unauthorized for Admin" });
  }

  if (!config || !slug) {
    throw createError({ statusCode: 500, message: "slug or config missing" });
  }

  const result = await updateConfig(slug, config);

  if (!result) {
    throw createError({ statusCode: 500, message: "Database error" });
  }

  return { success: true };
});
