import { dispatch, dispatchUndo } from "../../utils/dispatch";
import type { ActionMessage } from "../../utils/dispatch";

export default defineWebSocketHandler({
  // Verify the session before upgrading the connection.
  // Reject with 401 if the session slug doesn't match the requested site.
  async upgrade(request) {
    const url = new URL(request.url);
    const slug = url.pathname.split("/").at(-1);

    const session = await getUserSession(request as any);

    if (!session?.user?.slug || session.user.slug !== slug) {
      throw new Response("Unauthorized", { status: 401 });
    }

    // Store slug in request context so open/message/close hooks can access it
    request.context.slug = session.user.slug;
  },

  open(peer) {
    const { slug } = peer.context as { slug: string };
    // Subscribe this peer to the site topic so board updates
    // can be broadcast to all connected users at this site.
    peer.subscribe(slug);
  },

  async message(peer, message) {
    const { slug } = peer.context as { slug: string };

    let parsed: { action: string; payload?: unknown };
    try {
      parsed = JSON.parse(message.text());
    } catch {
      peer.send(JSON.stringify({ ok: false, error: "Invalid JSON" }));
      return;
    }

    const { action, payload } = parsed;

    // Undo is handled separately — it doesn't go through Core
    const result =
      action === "undo"
        ? await dispatchUndo(slug)
        : await dispatch(slug, { action, payload } as ActionMessage);

    if (!result.ok) {
      // Send the error only to the peer that triggered it
      peer.send(JSON.stringify({ ok: false, error: result.error }));
      return;
    }

    // Broadcast the updated board to all connected users at this site,
    // including the sender (publish goes to all subscribers, not the sender,
    // so we also send directly to the peer that triggered the action).
    const boardMessage = JSON.stringify({ ok: true, board: result.board });
    peer.send(boardMessage);
    peer.publish(slug, boardMessage);
  },

  close(peer) {
    const { slug } = peer.context as { slug: string };
    peer.unsubscribe(slug);
  },
});
