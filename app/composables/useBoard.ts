import type { Board, SiteConfig } from "../../server/core/types";
import type { ActionMessage } from "../../server/utils/dispatch";

type BoardState = {
  board: Ref<Board | null>;
  config: Ref<SiteConfig | null>;
  connected: Ref<boolean>;
  send: (action: ActionMessage) => void;
};

// Shared state — one connection per site session regardless of how many
// components call useBoard().
let instance: BoardState | null = null;

export const useBoard = (): BoardState => {
  if (instance) return instance;

  const board = useState<Board | null>("board", () => null);
  const config = useState<SiteConfig | null>("boardConfig", () => null);
  const connected = useState<boolean>("boardConnected", () => false);

  let ws: WebSocket | null = null;

  const send = (action: ActionMessage) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(action));
    }
  };

  if (import.meta.client) {
    const { session } = useUserSession();
    const slug = session.value?.user?.slug;

    if (slug) {
      // Fetch the initial board state before the WebSocket connects
      $fetch(`/api/board/${slug}`).then((data) => {
        board.value = data.board;
        config.value = data.config;
      });

      const protocol = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${protocol}://${location.host}/ws/${slug}`);

      ws.addEventListener("open", () => {
        connected.value = true;
      });

      ws.addEventListener("close", () => {
        connected.value = false;
      });

      ws.addEventListener("message", (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.ok) {
            board.value = msg.board;
          } else {
            console.error("Board action error:", msg.error);
          }
        } catch {
          console.error("Failed to parse board message", event.data);
        }
      });
    }
  }

  instance = { board, config, connected, send };
  return instance;
};

// Call this on logout to tear down the connection and reset shared state
export const resetBoard = () => {
  instance = null;
};
