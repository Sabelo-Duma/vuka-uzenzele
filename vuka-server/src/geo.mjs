/* ============================================================
   Distance — measured, not guessed.

   "3.4 km away" used to be a number typed into the seed data. Now it's
   computed: every listing carries coordinates, the viewer's device offers its
   position (with permission), and the server measures the great-circle distance
   between them.

   Free by design. No geocoding API, no map tiles, no per-request cost:
   - the viewer's position comes from the browser's own Geolocation API;
   - listings get coordinates from the employer's device at post time, or from
     the small local gazetteer below (the townships and suburbs this product
     actually serves), so a listing typed as "Pimville, Soweto" still lands on
     the map without calling anyone.

   When neither side has coordinates, callers fall back to the stored
   distance_km label and say so (`distanceSource: 'listed'`) rather than
   presenting a guess as a measurement.
   ============================================================ */

const EARTH_RADIUS_KM = 6371;
const rad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance in km, rounded to one decimal. */
export function haversineKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/**
 * Validate a lat/lng pair from an untrusted source.
 * @returns {{lat: number, lng: number}|null}
 */
export function parseCoords(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  if (la === 0 && ln === 0) return null;         // null island — almost always a bug
  return { lat: la, lng: ln };
}

/**
 * Local gazetteer: the places this product serves. Cheaper, faster and more
 * private than a geocoding call, and it works offline in dev. Add rows as the
 * footprint grows — a missing place degrades to the listed distance, not an error.
 */
export const PLACES = {
  // Soweto
  'diepkloof': { lat: -26.2472, lng: 27.9375 },
  'orlando east': { lat: -26.2437, lng: 27.9203 },
  'orlando west': { lat: -26.2381, lng: 27.9083 },
  'pimville': { lat: -26.2686, lng: 27.8956 },
  'meadowlands': { lat: -26.2214, lng: 27.8836 },
  'dobsonville': { lat: -26.2320, lng: 27.8385 },
  'zola': { lat: -26.2483, lng: 27.8380 },
  'jabulani': { lat: -26.2564, lng: 27.8628 },
  'klipspruit': { lat: -26.2569, lng: 27.8964 },
  'maponya mall': { lat: -26.2569, lng: 27.8964 },
  'protea glen': { lat: -26.2711, lng: 27.8069 },
  'soweto': { lat: -26.2678, lng: 27.8585 },
  // Greater Johannesburg
  'nasrec': { lat: -26.2350, lng: 27.9720 },
  'city deep': { lat: -26.2311, lng: 28.0745 },
  'braamfontein': { lat: -26.1929, lng: 28.0305 },
  'johannesburg': { lat: -26.2041, lng: 28.0473 },
  'sandton': { lat: -26.1076, lng: 28.0567 },
  'rosebank': { lat: -26.1444, lng: 28.0416 },
  'randburg': { lat: -26.0936, lng: 27.9750 },
  'roodepoort': { lat: -26.1625, lng: 27.8725 },
  'alexandra': { lat: -26.1036, lng: 28.0917 },
  'midrand': { lat: -25.9895, lng: 28.1284 },
  'tembisa': { lat: -25.9964, lng: 28.2264 },
  'katlehong': { lat: -26.3333, lng: 28.1500 },
  'vosloorus': { lat: -26.3500, lng: 28.2000 },
  'germiston': { lat: -26.2178, lng: 28.1672 },
  'benoni': { lat: -26.1885, lng: 28.3208 },
  'kempton park': { lat: -26.1000, lng: 28.2333 },
  'pretoria': { lat: -25.7479, lng: 28.2293 },
  'mamelodi': { lat: -25.7167, lng: 28.3833 },
  'soshanguve': { lat: -25.5333, lng: 28.1000 },
  'vereeniging': { lat: -26.6736, lng: 27.9319 },
  'sebokeng': { lat: -26.5833, lng: 27.8333 },
  // Other metros, for when the footprint grows
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'khayelitsha': { lat: -34.0403, lng: 18.6778 },
  'mitchells plain': { lat: -34.0350, lng: 18.6178 },
  'gugulethu': { lat: -33.9767, lng: 18.5747 },
  'durban': { lat: -29.8587, lng: 31.0218 },
  'umlazi': { lat: -29.9667, lng: 30.8833 },
  'pietermaritzburg': { lat: -29.6006, lng: 30.3794 },
  'port elizabeth': { lat: -33.9608, lng: 25.6022 },
  'gqeberha': { lat: -33.9608, lng: 25.6022 },
  'east london': { lat: -33.0153, lng: 27.9116 },
  'bloemfontein': { lat: -29.0852, lng: 26.1596 },
  'polokwane': { lat: -23.9045, lng: 29.4689 },
  'nelspruit': { lat: -25.4753, lng: 30.9694 },
  'mbombela': { lat: -25.4753, lng: 30.9694 },
  'rustenburg': { lat: -25.6672, lng: 27.2424 },
  'kimberley': { lat: -28.7282, lng: 24.7499 },
};

/**
 * Best-effort coordinates for a free-text place like "Pimville, Soweto".
 * Tries each comma-separated part, longest name first so "Orlando West" beats
 * a substring match on "Orlando".
 * @returns {{lat: number, lng: number}|null}
 */
export function coordsForPlace(location) {
  const text = String(location ?? '').toLowerCase().trim();
  if (!text) return null;
  const names = Object.keys(PLACES).sort((a, b) => b.length - a.length);
  for (const part of text.split(',').map((s) => s.trim()).filter(Boolean)) {
    const exact = PLACES[part];
    if (exact) return exact;
    const found = names.find((n) => part.includes(n));
    if (found) return PLACES[found];
  }
  const anywhere = names.find((n) => text.includes(n));
  return anywhere ? PLACES[anywhere] : null;
}

/**
 * Attach a real distance to a serialized listing.
 *
 * @param out    already-serialized listing (has distanceKm from the DB label)
 * @param coords the listing's own coordinates, or null
 * @param from   the viewer's coordinates, or null
 * @returns the same shape, with distanceKm measured when possible and
 *          distanceSource saying which it is — the client renders
 *          "3.4 km away" vs "≈ 3.4 km" off that, so a fallback never
 *          masquerades as a measurement.
 */
export function withDistance(out, coords, from) {
  if (from && coords) return { ...out, distanceKm: haversineKm(from, coords), distanceSource: 'measured' };
  return { ...out, distanceSource: 'listed' };
}
