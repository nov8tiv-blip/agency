const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function injectTracking(html: string, trackingToken: string): string {
  const openPixel = `<img src="${APP_URL}/api/track/open?t=${trackingToken}" width="1" height="1" alt="" style="display:none;" />`;

  // Rewrite all href links through the click tracker
  let tracked = html.replace(
    /href="(https?:\/\/[^"]+)"/gi,
    (_, url) =>
      `href="${APP_URL}/api/track/click?t=${trackingToken}&url=${encodeURIComponent(url)}"`
  );

  // Inject open pixel before </body>
  tracked = tracked.replace(/<\/body>/i, `${openPixel}</body>`);
  if (!tracked.includes(openPixel)) {
    tracked += openPixel;
  }

  return tracked;
}

export function resolveMergeTags(
  html: string,
  data: Record<string, string>
): string {
  return html.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (_, key) => data[key] ?? "");
}

export const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);
