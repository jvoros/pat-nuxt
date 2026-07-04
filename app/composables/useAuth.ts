export const useAuth = () => {
  const { loggedIn, session, fetch: refreshSession, clear: clearSession } = useUserSession();

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

  return { loggedIn, session, login, logout };
};
