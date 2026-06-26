import type { Board } from "../../server/core/types";

export const useSocket = () => {
  const { session } = useUserSession();
  const board = useState<Board | null>("board", () => null);
  const connected = useState<boolean>("connected", () => false);

  // Only open a WebSocket on the client, and only when logged in
  if (import.meta.client && session.value?.slug) {
    const slug = session.value.slug;
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${location.host}/ws/${slug}`);

    ws.addEventListener("open", () => {
      connected.value = true;
    });

    ws.addEventListener("close", () => {
      connected.value = false;
    });

    ws.addEventListener("message", (event) => {
      try {
        board.value = JSON.parse(event.data) as Board;
      } catch {
        console.error("Failed to parse board message", event.data);
      }
    });
  }

  return { board, connected };
};
