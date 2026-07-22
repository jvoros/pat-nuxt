export const useAuth = () => {
  const {
    loggedIn,
    session,
    fetch: refreshSession,
    clear: clearSession,
  } = useUserSession();

  const login = async (slug: string, code: string): Promise<void> => {
    await $fetch("/api/auth/login", {
      method: "POST",
      body: { slug, code },
    });
    await refreshSession();
    await navigateTo("/board");
  };

  const logout = async (): Promise<void> => {
    await $fetch("/api/auth/logout", { method: "POST" });
    await clearSession();
    resetBoard();
    await navigateTo("/login");
  };

  const adminLogin = async (code: string): Promise<void> => {
    await $fetch("/api/auth/verify-admin", {
      method: "POST",
      body: { code },
    });
    await refreshSession();
    await navigateTo("/admin");
  };

  return { loggedIn, session, login, logout, adminLogin };
};
