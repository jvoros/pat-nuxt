import { getSite } from "../../db/queries";

// Returns the current board for a site, or null if no board exists yet.
// The client uses this for the initial page load before the WebSocket connects.
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  const slug = getRouterParam(event, "slug");

  if (!session?.user?.slug || session.user.slug !== slug) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const site = await getSite(slug!);
  if (!site) {
    throw createError({ statusCode: 404, message: "Site not found" });
  }

  return { board: site.board, config: site.config };
});
