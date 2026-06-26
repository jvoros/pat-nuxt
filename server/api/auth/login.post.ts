import { getAccessCode } from "../../db/queries";
import { verifyCode } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const { slug, code } = await readBody<{ slug: string; code: string }>(event);

  if (!slug || !code) {
    throw createError({ statusCode: 400, message: "slug and code are required" });
  }

  const site = await getAccessCode(slug);

  if (!site || !verifyCode(code, site.hash, site.salt)) {
    throw createError({ statusCode: 401, message: "Invalid access code" });
  }

  await setUserSession(event, { slug });

  return { ok: true };
});
