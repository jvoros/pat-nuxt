const config = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  const { code } = await readBody(event);

  // 1. Fetch the correct code
  const correctCode = config.adminCode;

  if (code !== correctCode) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid access code",
    });
  }

  // 2. Get their current session
  const session = await getUserSession(event);

  // 3. Update the existing session to include the unlocked state
  await setUserSession(event, {
    ...session,
    admin: true,
  });

  return { success: true };
});
