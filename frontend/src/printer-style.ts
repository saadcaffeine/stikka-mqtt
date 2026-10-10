/**
 * printer-style.ts — a stable colour + glyph for every printer name, and
 * small helpers for friendly relative times.
 *
 * The identity is derived from the name alone (FNV-1a hash), so a printer
 * looks the same for everyone, on every device, with no stored state. Colours
 * are all dark enough for white text (WCAG AA on the Print button).
 */

export interface PrinterStyle { color: string; glyph: string; glyphName: string }

const COLORS = [
  '#C23B28', // brick
  '#1F7A5C', // green
  '#2457A6', // blue
  '#7B3FA0', // purple
  '#B25E09', // amber
  '#0E7C86', // teal
  '#C2185B', // pink
  '#5B6B16', // olive
  '#3F51B5', // indigo
  '#6D4C41', // brown
  '#455A64', // slate
]

const S = 'fill="currentColor"'
const GLYPHS: Record<string, string> = {
  star:    `<path ${S} d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"/>`,
  bolt:    `<path ${S} d="M13.5 2L5 13.5h5.5L9.5 22 19 9.5h-5.8z"/>`,
  heart:   `<path ${S} d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>`,
  moon:    `<path ${S} d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>`,
  sun:     `<circle ${S} cx="12" cy="12" r="4.5"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>`,
  drop:    `<path ${S} d="M12 2.5C8 8 5.5 11 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 11 16 8 12 2.5z"/>`,
  diamond: `<path ${S} d="M12 2l9 10-9 10-9-10z"/>`,
  leaf:    `<path ${S} d="M20 4C9 4 4 9.5 4 15c0 1.8.5 3.2 1.200 4.200C6.5 15 9.5 11.5 14 9.5c-3.500 2.800-5.8 6-6.8 10.2C8 20.200 9 20.500 10 20.500c6 0 10-5 10-16.5z"/>`,
  flame:   `<path ${S} d="M12 2c1 4 5.5 6 5.5 11.5a5.5 5.5 0 0 1-11 0c0-2 .8-3.4 2-4.700.2 1.600.9 2.5 1.8 2.900C10 8.5 10.5 5 12 2z"/>`,
  cloud:   `<path ${S} d="M7 19a5 5 0 0 1-.7-9.95A6 6 0 0 1 17.8 9.5 4.800 4.800 0 0 1 17.5 19z"/>`,
  bell:    `<path ${S} d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.800A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3.500a1.500 1.500 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/>`,
  hex:     `<path ${S} d="M12 2l8.7 5v10L12 22l-8.7-5V7z"/>`,
}
const GLYPH_NAMES = Object.keys(GLYPHS)

function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

const cache = new Map<string, PrinterStyle>()

export function printerGlyphSvg(glyphName: string, size = 18): string {
  return `<svg class="printer-glyph" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${GLYPHS[glyphName] ?? ''}</svg>`
}

export function printerStyle(name: string): PrinterStyle {
  let st = cache.get(name)
  if (!st) {
    const h = fnv1a(name.trim().toLowerCase())
    // Independent hashes for colour and glyph (murmur3-style finaliser), so
    // two names that share a colour rarely share a symbol too.
    const mix = (x: number): number => {
      x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b) >>> 0
      x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35) >>> 0
      return (x ^ (x >>> 16)) >>> 0
    }
    const glyphName = GLYPH_NAMES[mix(h ^ 0x9e3779b9) % GLYPH_NAMES.length]
    st = { color: COLORS[mix(h) % COLORS.length], glyph: glyphName, glyphName }
    cache.set(name, st)
  }
  return st
}

/** A round colour badge holding the printer's glyph. */
export function printerBadge(name: string, size = 22): HTMLElement {
  const st = printerStyle(name)
  const b = document.createElement('span')
  b.className = 'printer-badge'
  b.style.setProperty('--printer-color', st.color)
  b.style.width = b.style.height = `${size}px`
  b.innerHTML = printerGlyphSvg(st.glyphName, Math.round(size * 0.62))
  b.title = name
  return b
}

/** "just now", "42 s ago", "5 min ago", "3 h ago", "2 d ago". */
export function timeAgo(ms: number | null | undefined, now = Date.now()): string {
  if (!ms) return 'unknown'
  const s = Math.max(0, Math.round((now - ms) / 1000))
  if (s < 10) return 'just now'
  if (s < 60) return `${s} s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const hr = Math.round(m / 60)
  if (hr < 48) return `${hr} h ago`
  return `${Math.round(hr / 24)} d ago`
}

/** Short form without "ago": "42 s", "5 min", "3 h". */
export function duration(ms: number | null | undefined, now = Date.now()): string {
  const t = timeAgo(ms, now)
  return t === 'just now' ? 'a few seconds' : t.replace(' ago', '')
}

/** Pick the printer to select by default: Singapore first, then any online one. */
export function pickDefaultPrinter(
  printers: { name: string; location: string }[],
  isOnline: (i: number) => boolean,
  isSingapore: (p: { name: string; location: string }) => boolean,
): number {
  if (!printers.length) return -1
  const sg = printers.map((p, i) => i).filter(i => isSingapore(printers[i]))
  const sgOnline = sg.find(isOnline)
  if (sgOnline !== undefined) return sgOnline
  const online = printers.findIndex((_, i) => isOnline(i))
  if (sg.length && online < 0) return sg[0]
  if (online >= 0) return online
  return 0
}
