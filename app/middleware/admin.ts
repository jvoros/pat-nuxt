export default defineNuxtRouteMiddleware(async (to) => {
  const { session } = useUserSession();

  // If they don't have the unlock flag in their session, send them to lock
  if (!session.value?.admin) {
    return navigateTo({
      path: "/admin-lock",
      query: { redirect: to.fullPath },
    });
  }
});
