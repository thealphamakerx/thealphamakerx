// Host helpers shared by the proxy (no database access here) and the landing pages.

/** Hostnames that serve the main store, never a landing page. */
export function isMainHost(host: string) {
  const bare = host.toLowerCase().split(":")[0].replace(/^www\./, "");
  const site = (() => {
    try { return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://thealphamakerx.in").hostname.replace(/^www\./, ""); }
    catch { return "thealphamakerx.in"; }
  })();
  return bare === site || bare === "localhost" || bare === "127.0.0.1" || bare.endsWith(".vercel.app");
}

export function normalizeDomain(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}
