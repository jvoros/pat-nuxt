export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  // Redirect unauthenticated users to login from any protected page
  if (!loggedIn.value && to.path !== "/login") {
    return navigateTo("/login");
  }

  // Redirect authenticated users away from login to the board
  if (loggedIn.value && to.path === "/login") {
    return navigateTo("/board");
  }
});
