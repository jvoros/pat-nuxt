export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  if (to.path === "/") {
    return navigateTo(loggedIn.value ? "/board" : "/login");
  }

  if (!loggedIn.value && to.path !== "/login") {
    return navigateTo("/login");
  }

  if (loggedIn.value && to.path === "/login") {
    return navigateTo("/board");
  }
});
