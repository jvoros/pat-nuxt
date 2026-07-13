import type { Board, SiteConfig, Shift } from "../../server/core/types";
import type { ActionMessage } from "../../server/utils/dispatch";

type SendResult = { ok: true; board: Board } | { ok: false; error: string };

type BoardState = {
  board: Ref<Board | null>;
  config: Ref<SiteConfig | null>;
  connected: Ref<boolean>;
  send: (action: ActionMessage) => Promise<SendResult>;
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

  // Holds the resolve/reject for the in-flight send.
  // Resolves on the next message received — if a broadcast from another client
  // arrives first, it settles early which is fine: the board is already updated.
  let pending: {
    resolve: (result: SendResult) => void;
    reject: (reason: unknown) => void;
  } | null = null;

  const send = (action: ActionMessage): Promise<SendResult> => {
    return new Promise((resolve, reject) => {
      if (ws?.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket is not connected"));
        return;
      }
      pending = { resolve, reject };
      ws.send(JSON.stringify(action));
    });
  };

  // If Nuxt client-side
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
        pending?.reject(new Error("WebSocket closed"));
        pending = null;
      });

      ws.addEventListener("message", (event) => {
        try {
          const msg = JSON.parse(event.data) as SendResult;
          if (msg.ok) {
            board.value = msg.board;
          } else {
            console.error("Board action error:", msg.error);
          }
          pending?.resolve(msg);
        } catch {
          const err = new Error("Failed to parse board message");
          console.error(err, event.data);
          pending?.reject(err);
        } finally {
          pending = null;
        }
      });
    }
  }

  function getShiftName(id: Shift.id): string {
    const shift = board.value?.shifts[id];
    return `${shift.first} ${shift.last}`;
  }

  function getShiftsAlphabetically() {
    const shifts = Object.keys(board.value?.shifts).map(
      (shiftId) => board.value.shifts[shiftId],
    );

    const sortedShifts = shifts.sort((a, b) => {
      if (a.last < b.last) return -1;
      if (a.last > b.last) return 1;
      return 0;
    });

    return sortedShifts.map((shift) => shift.id);
  }

  instance = {
    board,
    config,
    connected,
    send,
    getShiftName,
    getShiftsAlphabetically,
  };
  return instance;
};

// Call this on logout to tear down the connection and reset shared state
export const resetBoard = () => {
  instance = null;
};
