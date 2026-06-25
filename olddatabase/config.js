import { turso } from "./client.js";
import sites from "../sites/index.js";

const sql = `
  INSERT INTO sites (slug, site)
  VALUES (:slug, :site)
  ON CONFLICT (slug)
  DO UPDATE SET site = excluded.site
  `;

sites.forEach(async (site) => {
  try {
    await turso.execute({
      sql: sql,
      args: { slug: site.slug, site: JSON.stringify(site) },
    });
    console.log(`[config] updated: ${site.name}`);
  } catch (err) {
    console.error(err);
  }
});
