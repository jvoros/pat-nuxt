export default defineWebSocketHandler({
  // Verify the session before upgrading the connection.
  // Reject with 401 if the session slug doesn't match the requested site.
  async upgrade(request) {
    const url = new URL(request.url);
    const slug = url.pathname.split("/").at(-1);

    const session = await getUserSession(request as any);

    if (!session?.slug || session.slug !== slug) {
      throw new Response("Unauthorized", { status: 401 });
    }

    // Store slug in request context so open/close hooks can access it
    request.context.slug = session.slug;
  },

  open(peer) {
    const { slug } = peer.context as { slug: string };
    // Subscribe this peer to the site topic so board updates
    // can be broadcast to all connected users at this site.
    peer.subscribe(slug);
  },

  close(peer) {
    const { slug } = peer.context as { slug: string };
    peer.unsubscribe(slug);
  },
});
