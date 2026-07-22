import { updateConfig } from "../../db/queries";
import type { SiteConfig } from "../core/types";

// Updates the site configuration in the database.
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
