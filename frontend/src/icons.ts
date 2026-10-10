/** Small inline SVG icon set (24×24, currentColor). Returned as strings for innerHTML. */

const S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"'
const wrap = (inner: string, size = 24, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false" ${extra}>${inner}</svg>`

/** A portrait label with an "up" arrow, rotated by `deg` — shows how the content will be turned. */
const rot = (deg: number) =>
  `<g transform="rotate(${deg} 12 12)"><rect x="5.5" y="3.5" width="13" height="17" rx="2" ${S}/><path d="M12 7.5l-3 4.2h6z" fill="currentColor" stroke="none"/><path d="M12 12v5" ${S}/></g>`

const ICONS: Record<string, string> = {
  rot0: rot(0), rot90: rot(90), rot180: rot(180), rot270: rot(270),
  // horizontal alignment
  alignLeft:   `<path d="M4 6h16M4 10h10M4 14h16M4 18h8" ${S}/>`,
  alignCenter: `<path d="M4 6h16M7 10h10M4 14h16M8 18h8" ${S}/>`,
  alignRight:  `<path d="M4 6h16M10 10h10M4 14h16M12 18h8" ${S}/>`,
  // vertical alignment
  alignTop:    `<rect x="4" y="3.5" width="16" height="17" rx="2" ${S}/><path d="M8 7.5h8M8 10.5h5" ${S}/>`,
  alignMiddle: `<rect x="4" y="3.5" width="16" height="17" rx="2" ${S}/><path d="M8 10.5h8M8 13.5h5" ${S}/>`,
  alignBottom: `<rect x="4" y="3.5" width="16" height="17" rx="2" ${S}/><path d="M8 13.5h8M8 16.5h5" ${S}/>`,
  // barcode families
  qr: `<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" ${S}/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" ${S}/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" ${S}/><path d="M5.8 5.8h1.9v1.9H5.8zM16.3 5.8h1.9v1.9h-1.9zM5.8 16.3h1.9v1.9H5.8z" fill="currentColor" stroke="none"/><path d="M14 14h2.5v2.5M20.5 14v1M14 20.5h2M18.5 18v2.5h2" ${S}/>`,
  code128: `<path d="M4 4v16M7 4v16M9.5 4v16M13 4v16M15 4v16M18.5 4v16M20.5 4v16" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M6.5 4v16M11.5 4v16M16.5 4v16" stroke="currentColor" stroke-width="2.6" fill="none"/>`,
  aztec: `<rect x="3.5" y="3.5" width="17" height="17" rx="1" ${S}/><rect x="7" y="7" width="10" height="10" ${S}/><rect x="10" y="10" width="4" height="4" fill="currentColor" stroke="none"/><path d="M12 3.5v3.5M12 17v3.5M3.5 12H7M17 12h3.5" ${S}/>`,
  datamatrix: `<path d="M4 4v16h16" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="square"/><path d="M8 4h2M12 4h2M16 4h2M20 4v2M20 8v2M20 12v2M20 16v2" ${S}/><path d="M9 9h2v2H9zM13 12h2v2h-2zM9 15h2v2H9zM15 8h1.6v1.6H15z" fill="currentColor" stroke="none"/>`,
  // themes
  leaf:  `<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z" ${S}/><path d="M5 19c3-5 6-8 10-10" ${S}/>`,
  sun:   `<circle cx="12" cy="12" r="4" ${S}/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" ${S}/>`,
  moon:  `<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" ${S}/>`,
  terminal: `<rect x="3" y="4.5" width="18" height="15" rx="2" ${S}/><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5" ${S}/>`,
  // ui
  info:  `<circle cx="12" cy="12" r="9" ${S}/><path d="M12 11v5.5" ${S}/><circle cx="12" cy="7.8" r="1.1" fill="currentColor" stroke="none"/>`,
  globe: `<circle cx="12" cy="12" r="9" ${S}/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" ${S}/>`,
  external: `<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" ${S}/>`,
  plus:  `<path d="M12 5v14M5 12h14" ${S}/>`,
  minus: `<path d="M5 12h14" ${S}/>`,
  fit:   `<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" ${S}/><circle cx="12" cy="12" r="2.2" ${S}/>`,
  printer: `<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2" ${S}/><rect x="7" y="14" width="10" height="6" rx="1" ${S}/>`,
  download: `<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14" ${S}/>`,
  close: `<path d="M6 6l12 12M18 6L6 18" ${S}/>`,
  search: `<circle cx="11" cy="11" r="6.5" ${S}/><path d="M16 16l4.5 4.5" ${S}/>`,
  pin:   `<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" ${S}/><circle cx="12" cy="10" r="2.3" ${S}/>`,
  mail:  `<rect x="3.5" y="5.5" width="17" height="13" rx="2" ${S}/><path d="M4 7l8 6 8-6" ${S}/>`,
}

/** GitHub mark (simple-icons, CC0) — filled, so it bypasses the stroke wrapper. */
const GITHUB = '<path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>'

/** Brand mark: a yellow chomper with two dots (echoes the Edible Makerspace logo). */
const BRAND = '<path d="M12 12L21 6.8A10.4 10.4 0 1 0 21 17.2z" fill="#F0C400"/>'

export type IconName = keyof typeof ICONS | 'github' | 'brand'

export function icon(name: IconName, size = 24): string {
  if (name === 'github') return wrap(GITHUB, size)
  if (name === 'brand') return wrap(BRAND, size)
  return wrap(ICONS[name], size)
}
