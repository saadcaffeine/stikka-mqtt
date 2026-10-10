/**
 * locations.ts — turns a printer's free-text `location` (set in the ESP32
 * web UI) into map coordinates + a country code for its flag.
 *
 * Resolution order:
 *   1. Explicit coordinates:  "Makerspace @1.3521,103.8198"  or  "1.35, 103.82"
 *      (optional "cc:SG" token overrides the flag)
 *   2. A known city / country name appearing anywhere in the text
 *      ("Edible Makerspace, Singapore", "Hamburg Hackspace", "CCH – Berlin")
 *
 * Anything else is "unplaced" and listed beside the map instead of pinned.
 * To add a place, append a row to PLACES: [name, aliases, lat, lon, cc].
 */

export interface ResolvedPlace {
  /** Stable grouping key — printers sharing it are drawn as one pin. */
  key: string
  /** Human label, e.g. "Singapore" */
  label: string
  lat: number
  lon: number
  /** ISO 3166-1 alpha-2, upper-case; '' when unknown */
  cc: string
}

type Row = [name: string, aliases: string, lat: number, lon: number, cc: string]

// aliases: comma-separated extra spellings (matched as whole words, accent-insensitive)
const PLACES: Row[] = [
  // ── Home instance ──
  ['Singapore', 'sg,edible makerspace,ediblemakerspace,ems,stikka sg', 1.3521, 103.8198, 'SG'],
  // ── Germany / DACH ──
  ['Hamburg', 'cch,chaos computer club hamburg', 53.5511, 9.9937, 'DE'],
  ['Berlin', '', 52.52, 13.405, 'DE'], ['Munich', 'muenchen,münchen', 48.1351, 11.582, 'DE'],
  ['Leipzig', 'cce', 51.3397, 12.3731, 'DE'], ['Cologne', 'koeln,köln', 50.9375, 6.9603, 'DE'],
  ['Frankfurt', '', 50.1109, 8.6821, 'DE'], ['Stuttgart', '', 48.7758, 9.1829, 'DE'],
  ['Dresden', '', 51.0504, 13.7373, 'DE'], ['Bremen', '', 53.0793, 8.8017, 'DE'],
  ['Hannover', 'hanover', 52.3759, 9.732, 'DE'], ['Nuremberg', 'nuernberg,nürnberg', 49.4521, 11.0767, 'DE'],
  ['Düsseldorf', 'dusseldorf,duesseldorf', 51.2277, 6.7735, 'DE'], ['Karlsruhe', '', 49.0069, 8.4037, 'DE'],
  ['Darmstadt', '', 49.8728, 8.6512, 'DE'], ['Dortmund', '', 51.5136, 7.4653, 'DE'],
  ['Kiel', '', 54.3233, 10.1228, 'DE'], ['Freiburg', '', 47.999, 7.8421, 'DE'],
  ['Vienna', 'wien', 48.2082, 16.3738, 'AT'], ['Graz', '', 47.0707, 15.4395, 'AT'],
  ['Zurich', 'zuerich,zürich', 47.3769, 8.5417, 'CH'], ['Bern', '', 46.948, 7.4474, 'CH'],
  ['Basel', '', 47.5596, 7.5886, 'CH'], ['Geneva', 'geneve,genève', 46.2044, 6.1432, 'CH'],
  // ── Rest of Europe ──
  ['Amsterdam', '', 52.3676, 4.9041, 'NL'], ['Rotterdam', '', 51.9244, 4.4777, 'NL'], ['Eindhoven', '', 51.4416, 5.4697, 'NL'],
  ['Brussels', 'bruxelles', 50.8503, 4.3517, 'BE'], ['Ghent', 'gent', 51.0543, 3.7174, 'BE'],
  ['Paris', '', 48.8566, 2.3522, 'FR'], ['Lyon', '', 45.764, 4.8357, 'FR'], ['Marseille', '', 43.2965, 5.3698, 'FR'], ['Toulouse', '', 43.6047, 1.4442, 'FR'],
  ['London', '', 51.5074, -0.1278, 'GB'], ['Manchester', '', 53.4808, -2.2426, 'GB'], ['Edinburgh', '', 55.9533, -3.1883, 'GB'],
  ['Glasgow', '', 55.8642, -4.2518, 'GB'], ['Bristol', '', 51.4545, -2.5879, 'GB'], ['Cambridge', '', 52.2053, 0.1218, 'GB'],
  ['Dublin', '', 53.3498, -6.2603, 'IE'],
  ['Copenhagen', 'kobenhavn,københavn', 55.6761, 12.5683, 'DK'], ['Stockholm', '', 59.3293, 18.0686, 'SE'], ['Gothenburg', 'goteborg', 57.7089, 11.9746, 'SE'],
  ['Oslo', '', 59.9139, 10.7522, 'NO'], ['Helsinki', '', 60.1699, 24.9384, 'FI'], ['Reykjavik', 'reykjavík', 64.1466, -21.9426, 'IS'],
  ['Madrid', '', 40.4168, -3.7038, 'ES'], ['Barcelona', '', 41.3874, 2.1686, 'ES'], ['Valencia', '', 39.4699, -0.3763, 'ES'],
  ['Lisbon', 'lisboa', 38.7223, -9.1393, 'PT'], ['Porto', '', 41.1579, -8.6291, 'PT'],
  ['Rome', 'roma', 41.9028, 12.4964, 'IT'], ['Milan', 'milano', 45.4642, 9.19, 'IT'], ['Turin', 'torino', 45.0703, 7.6869, 'IT'], ['Bologna', '', 44.4949, 11.3426, 'IT'],
  ['Prague', 'praha', 50.0755, 14.4378, 'CZ'], ['Brno', '', 49.1951, 16.6068, 'CZ'], ['Bratislava', '', 48.1486, 17.1077, 'SK'],
  ['Warsaw', 'warszawa', 52.2297, 21.0122, 'PL'], ['Krakow', 'kraków,cracow', 50.0647, 19.945, 'PL'],
  ['Budapest', '', 47.4979, 19.0402, 'HU'], ['Ljubljana', '', 46.0569, 14.5058, 'SI'], ['Zagreb', '', 45.815, 15.9819, 'HR'],
  ['Belgrade', 'beograd', 44.7866, 20.4489, 'RS'], ['Bucharest', 'bucuresti', 44.4268, 26.1025, 'RO'], ['Sofia', '', 42.6977, 23.3219, 'BG'],
  ['Athens', 'athina', 37.9838, 23.7275, 'GR'], ['Istanbul', '', 41.0082, 28.9784, 'TR'], ['Ankara', '', 39.9334, 32.8597, 'TR'],
  ['Tallinn', '', 59.437, 24.7536, 'EE'], ['Riga', '', 56.9496, 24.1052, 'LV'], ['Vilnius', '', 54.6872, 25.2797, 'LT'],
  ['Kyiv', 'kiev', 50.4501, 30.5234, 'UA'], ['Moscow', 'moskva', 55.7558, 37.6173, 'RU'], ['Saint Petersburg', 'st petersburg', 59.9343, 30.3351, 'RU'],
  // ── North America ──
  ['New York', 'nyc,brooklyn,manhattan', 40.7128, -74.006, 'US'], ['San Francisco', 'sf,bay area,oakland,berkeley', 37.7749, -122.4194, 'US'],
  ['Los Angeles', '', 34.0522, -118.2437, 'US'], ['Seattle', '', 47.6062, -122.3321, 'US'], ['Portland', '', 45.5152, -122.6784, 'US'],
  ['Chicago', '', 41.8781, -87.6298, 'US'], ['Boston', '', 42.3601, -71.0589, 'US'], ['Austin', '', 30.2672, -97.7431, 'US'],
  ['Denver', '', 39.7392, -104.9903, 'US'], ['Washington', 'washington dc', 38.9072, -77.0369, 'US'], ['Miami', '', 25.7617, -80.1918, 'US'],
  ['Atlanta', '', 33.749, -84.388, 'US'], ['Pittsburgh', '', 40.4406, -79.9959, 'US'], ['Philadelphia', '', 39.9526, -75.1652, 'US'],
  ['Toronto', '', 43.6532, -79.3832, 'CA'], ['Vancouver', '', 49.2827, -123.1207, 'CA'], ['Montreal', 'montréal', 45.5017, -73.5673, 'CA'],
  ['Mexico City', 'cdmx,ciudad de mexico', 19.4326, -99.1332, 'MX'], ['Guadalajara', '', 20.6597, -103.3496, 'MX'],
  // ── Latin America ──
  ['Bogotá', 'bogota', 4.711, -74.0721, 'CO'], ['Medellín', 'medellin', 6.2442, -75.5812, 'CO'], ['Lima', '', -12.0464, -77.0428, 'PE'],
  ['São Paulo', 'sao paulo', -23.5505, -46.6333, 'BR'], ['Rio de Janeiro', 'rio', -22.9068, -43.1729, 'BR'], ['Buenos Aires', '', -34.6037, -58.3816, 'AR'],
  ['Santiago', '', -33.4489, -70.6693, 'CL'], ['Montevideo', '', -34.9011, -56.1645, 'UY'], ['Quito', '', -0.1807, -78.4678, 'EC'],
  // ── Africa / Middle East ──
  ['Cairo', '', 30.0444, 31.2357, 'EG'], ['Lagos', '', 6.5244, 3.3792, 'NG'], ['Accra', '', 5.6037, -0.187, 'GH'], ['Nairobi', '', -1.2921, 36.8219, 'KE'],
  ['Kigali', '', -1.9441, 30.0619, 'RW'], ['Addis Ababa', '', 8.9806, 38.7578, 'ET'], ['Cape Town', '', -33.9249, 18.4241, 'ZA'], ['Johannesburg', '', -26.2041, 28.0473, 'ZA'],
  ['Casablanca', '', 33.5731, -7.5898, 'MA'], ['Tunis', '', 36.8065, 10.1815, 'TN'], ['Dakar', '', 14.7167, -17.4677, 'SN'],
  ['Tel Aviv', '', 32.0853, 34.7818, 'IL'], ['Dubai', '', 25.2048, 55.2708, 'AE'], ['Abu Dhabi', '', 24.4539, 54.3773, 'AE'], ['Riyadh', '', 24.7136, 46.6753, 'SA'], ['Tehran', '', 35.6892, 51.389, 'IR'],
  // ── Asia ──
  ['Tokyo', '', 35.6762, 139.6503, 'JP'], ['Osaka', '', 34.6937, 135.5023, 'JP'], ['Kyoto', '', 35.0116, 135.7681, 'JP'],
  ['Seoul', '', 37.5665, 126.978, 'KR'], ['Beijing', '', 39.9042, 116.4074, 'CN'], ['Shanghai', '', 31.2304, 121.4737, 'CN'], ['Shenzhen', '', 22.5431, 114.0579, 'CN'],
  ['Hong Kong', 'hk', 22.3193, 114.1694, 'HK'], ['Taipei', '', 25.033, 121.5654, 'TW'],
  ['Bangkok', '', 13.7563, 100.5018, 'TH'], ['Chiang Mai', '', 18.7883, 98.9853, 'TH'], ['Hanoi', '', 21.0278, 105.8342, 'VN'], ['Ho Chi Minh City', 'saigon', 10.8231, 106.6297, 'VN'],
  ['Kuala Lumpur', 'kl', 3.139, 101.6869, 'MY'], ['Penang', '', 5.4164, 100.3327, 'MY'], ['Jakarta', '', -6.2088, 106.8456, 'ID'], ['Bali', 'denpasar', -8.4095, 115.1889, 'ID'],
  ['Manila', '', 14.5995, 120.9842, 'PH'], ['Phnom Penh', '', 11.5564, 104.9282, 'KH'], ['Yangon', '', 16.8409, 96.1735, 'MM'],
  ['Delhi', 'new delhi', 28.6139, 77.209, 'IN'], ['Mumbai', '', 19.076, 72.8777, 'IN'], ['Bangalore', 'bengaluru', 12.9716, 77.5946, 'IN'], ['Kolkata', 'calcutta', 22.5726, 88.3639, 'IN'],
  ['Dhaka', '', 23.8103, 90.4125, 'BD'], ['Karachi', '', 24.8607, 67.0011, 'PK'], ['Colombo', '', 6.9271, 79.8612, 'LK'], ['Kathmandu', '', 27.7172, 85.324, 'NP'],
  // ── Oceania ──
  ['Sydney', '', -33.8688, 151.2093, 'AU'], ['Melbourne', '', -37.8136, 144.9631, 'AU'], ['Brisbane', '', -27.4698, 153.0251, 'AU'], ['Perth', '', -31.9505, 115.8605, 'AU'],
  ['Auckland', '', -36.8485, 174.7633, 'NZ'], ['Wellington', '', -41.2866, 174.7756, 'NZ'],
]

// Country names → rough centre, used only when no city matched.
const COUNTRIES: Row[] = [
  ['Germany', 'deutschland', 51.1, 10.4, 'DE'], ['Austria', 'osterreich,österreich', 47.5, 14.5, 'AT'], ['Switzerland', 'schweiz,suisse', 46.8, 8.2, 'CH'],
  ['Netherlands', 'holland,nederland', 52.2, 5.3, 'NL'], ['Belgium', '', 50.6, 4.7, 'BE'], ['France', '', 46.6, 2.4, 'FR'],
  ['United Kingdom', 'uk,great britain,england,scotland,wales', 54.0, -2.5, 'GB'], ['Ireland', '', 53.2, -8.0, 'IE'],
  ['Denmark', '', 56.0, 9.5, 'DK'], ['Sweden', '', 62.0, 15.0, 'SE'], ['Norway', '', 61.0, 9.0, 'NO'], ['Finland', '', 64.0, 26.0, 'FI'], ['Iceland', '', 64.9, -18.5, 'IS'],
  ['Spain', '', 40.0, -3.7, 'ES'], ['Portugal', '', 39.6, -8.0, 'PT'], ['Italy', 'italia', 42.8, 12.5, 'IT'], ['Greece', '', 39.0, 22.0, 'GR'], ['Poland', 'polska', 52.0, 19.4, 'PL'],
  ['Czechia', 'czech republic', 49.8, 15.5, 'CZ'], ['Hungary', '', 47.2, 19.5, 'HU'], ['Romania', '', 45.9, 25.0, 'RO'], ['Ukraine', '', 49.0, 31.4, 'UA'], ['Turkey', 'türkiye,turkiye', 39.0, 35.2, 'TR'],
  ['United States', 'usa,united states of america,america', 39.8, -98.6, 'US'], ['Canada', '', 56.1, -106.3, 'CA'], ['Mexico', 'méxico', 23.6, -102.5, 'MX'],
  ['Brazil', 'brasil', -10.8, -52.9, 'BR'], ['Argentina', '', -34.6, -64.0, 'AR'], ['Chile', '', -35.7, -71.5, 'CL'], ['Colombia', '', 4.6, -74.1, 'CO'], ['Peru', '', -9.2, -75.0, 'PE'],
  ['Egypt', '', 26.8, 30.8, 'EG'], ['Nigeria', '', 9.1, 8.7, 'NG'], ['Ghana', '', 7.9, -1.0, 'GH'], ['Kenya', '', 0.0, 37.9, 'KE'], ['Rwanda', '', -1.9, 29.9, 'RW'],
  ['Ethiopia', '', 9.1, 40.5, 'ET'], ['South Africa', '', -29.0, 24.0, 'ZA'], ['Morocco', '', 31.8, -7.1, 'MA'],
  ['Israel', '', 31.0, 34.9, 'IL'], ['United Arab Emirates', 'uae', 24.0, 54.0, 'AE'], ['Saudi Arabia', '', 24.0, 45.0, 'SA'], ['India', '', 21.0, 78.0, 'IN'],
  ['Japan', '', 36.2, 138.3, 'JP'], ['South Korea', 'korea', 36.5, 127.9, 'KR'], ['China', '', 35.9, 104.2, 'CN'], ['Taiwan', '', 23.7, 121.0, 'TW'],
  ['Thailand', '', 15.9, 100.99, 'TH'], ['Vietnam', '', 14.1, 108.3, 'VN'], ['Malaysia', '', 4.2, 102.0, 'MY'], ['Indonesia', '', -2.5, 118.0, 'ID'], ['Philippines', '', 12.9, 121.8, 'PH'],
  ['Australia', '', -25.3, 133.8, 'AU'], ['New Zealand', 'nz,aotearoa', -41.0, 174.0, 'NZ'],
]

function norm(s: string): string {
  return ' ' + s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim() + ' '
}

interface Index { alias: string; place: ResolvedPlace }
function buildIndex(rows: Row[]): Index[] {
  const out: Index[] = []
  for (const [name, aliases, lat, lon, cc] of rows) {
    const place: ResolvedPlace = { key: `${cc}:${name}`.toLowerCase(), label: name, lat, lon, cc }
    for (const a of [name, ...aliases.split(',').filter(Boolean)]) out.push({ alias: norm(a), place })
  }
  // Longest alias first so "new york" beats "york", "hong kong" beats "kong".
  return out.sort((a, b) => b.alias.length - a.alias.length)
}
const CITY_INDEX = buildIndex(PLACES)
const COUNTRY_INDEX = buildIndex(COUNTRIES)

const COORD_RE = /@?\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;/ ]\s*(-?\d{1,3}(?:\.\d+)?)/
const CC_RE = /\bcc:([a-z]{2})\b/i

function nearestCountryCode(lat: number, lon: number): string {
  let best = '', bestD = 600 // km
  for (const [, , la, lo, cc] of [...PLACES, ...COUNTRIES]) {
    const dLat = (la - lat) * 111
    const dLon = (lo - lon) * 111 * Math.cos(((la + lat) / 2) * Math.PI / 180)
    const d = Math.hypot(dLat, dLon)
    if (d < bestD) { bestD = d; best = cc }
  }
  return best
}

/** Resolve free text to a place, or null if nothing recognisable. */
export function resolveLocation(...texts: string[]): ResolvedPlace | null {
  for (const raw of texts) {
    const text = (raw ?? '').trim()
    if (!text) continue

    const coord = COORD_RE.exec(text)
    if (coord) {
      const lat = parseFloat(coord[1]), lon = parseFloat(coord[2])
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        const ccTok = CC_RE.exec(text)
        const label = text.replace(COORD_RE, '').replace(CC_RE, '').replace(/[@,;\s]+$/, '').trim()
        return {
          key: `ll:${lat.toFixed(2)},${lon.toFixed(2)}`,
          label: label || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
          lat, lon,
          cc: ccTok ? ccTok[1].toUpperCase() : nearestCountryCode(lat, lon),
        }
      }
    }

    const n = norm(text)
    for (const idx of [CITY_INDEX, COUNTRY_INDEX]) {
      for (const { alias, place } of idx) {
        if (n.includes(alias)) return place
      }
    }
  }
  return null
}
