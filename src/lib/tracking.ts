// Landing-page tracking shared by the browser and the server.
//
// A visitor id is minted on the landing domain and carried, with the ad's UTM
// tags, in the checkout link to the main store (cookies can't cross domains).
// Checkout stores both on the order, so every sale traces back to its visit
// and campaign.

export const TRACK_TYPES = ["view", "scroll", "cta", "checkout"] as const;
export type TrackType = (typeof TRACK_TYPES)[number];

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** Attribution that travels in the checkout URL: landing slug, visitor id and UTM tags. */
export type Attribution = { lp: string; vid?: string } & Utm;

export function pickUtm(params: URLSearchParams | Record<string, string | string[] | undefined>): Utm {
  const get = (key: string) => {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key];
    return typeof value === "string" && value.trim() ? value.trim().slice(0, 150) : undefined;
  };
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = get(key);
    if (value) utm[key] = value;
  }
  // Meta adds fbclid to ad clicks; with no UTM tags on the ad, still credit Facebook/Instagram ads.
  if (!utm.utm_source && get("fbclid")) {
    utm.utm_source = "facebook";
    utm.utm_medium = utm.utm_medium ?? "paid";
  }
  return utm;
}

export const VISITOR_ID_RE = /^[a-zA-Z0-9-]{8,64}$/;
