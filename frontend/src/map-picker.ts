/**
 * map-picker.ts — pick a printer on a simplified world map.
 *
 * Each printer's free-text `location` (set in its ESP32 web UI) is resolved
 * to coordinates (see locations.ts) and drawn as a little flag on a pole.
 * Printers in the same place share one pin; pins that would overlap at the
 * current zoom merge into a numbered cluster. Printers whose location can't
 * be resolved are listed under "Location not set". Below the map, every
 * printer is a large tappable card, so the map is never the only way in.
 */
import {
  MAP_W, MAP_H, MAP_SCALE, MAP_TX, MAP_TY, WORLD_LAND_PATH, WORLD_GRATICULE_PATH,
} from './world-map-data'
import { resolveLocation, type ResolvedPlace } from './locations'
import type { PrinterInfo } from './types'
import type { PrinterMeta } from './mqtt-api'
import { printerBadge, printerStyle, timeAgo, duration } from './printer-style'
import { icon } from './icons'

const NS = 'http://www.w3.org/2000/svg'

type Status = 'online' | 'busy' | 'offline' | 'unknown'

export interface MapPickerOptions {
  getMeta(printerIndex: number): PrinterMeta | null
  isDummy(name: string): boolean
  onSelect(printerIndex: number): void
}

export interface MapPicker {
  element: HTMLElement
  /** Grey the picker out and show a spinner while printer statuses load. */
  setLoading(on: boolean): void
  update(printers: PrinterInfo[], selectedIndex: number): void
}

// d3's Natural Earth projection, inlined so the page needs no map library.
function project(lat: number, lon: number): [number, number] {
  const l = lon * Math.PI / 180, p = lat * Math.PI / 180
  const p2 = p * p, p4 = p2 * p2
  const X = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)))
  const Y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
  return [MAP_TX + MAP_SCALE * X, MAP_TY - MAP_SCALE * Y]
}

function s<K extends keyof SVGElementTagNameMap>(
  tag: K, attrs: Record<string, string | number> = {}, ...kids: (SVGElement | string)[]
): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  for (const k of kids) e.append(typeof k === 'string' ? document.createTextNode(k) : k)
  return e
}

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, cls = '', ...kids: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  for (const k of kids) e.append(typeof k === 'string' ? document.createTextNode(k) : k)
  return e
}

const flagSrc = (cc: string): string => `${import.meta.env.BASE_URL}flags/${cc.toLowerCase()}.svg`

interface Entry { p: PrinterInfo; i: number; status: Status; meta: PrinterMeta | null }
interface Group { key: string; place: ResolvedPlace | null; entries: Entry[]; x: number; y: number; status: Status }
interface Cluster { groups: Group[]; x: number; y: number; count: number; status: Status }

const STATUS_RANK: Record<Status, number> = { online: 3, busy: 2, offline: 1, unknown: 0 }
const STATUS_TEXT: Record<Status, string> = { online: 'Online', busy: 'Busy', offline: 'Offline', unknown: 'Waiting for status' }

function bestStatus(list: Status[]): Status {
  return list.reduce<Status>((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a), 'unknown')
}

export function createMapPicker(opts: MapPickerOptions): MapPicker {
  let groups: Group[] = []
  let selectedIndex = -1
  let focusKey: string | null = null   // which group's cards are expanded

  // ── DOM skeleton ──────────────────────────────────────────────────────────
  const root = h('section', 'map-picker')
  root.setAttribute('aria-label', 'Choose a printer')

  const summary = h('div', 'map-summary')
  const mapWrap = h('div', 'map-wrap')

  const svg = s('svg', {
    viewBox: `0 0 ${MAP_W} ${MAP_H}`, class: 'map-svg', role: 'group',
    'aria-label': 'World map of Stikka printer locations',
  })
  const landG = s('g')
  landG.append(
    s('rect', { x: 0, y: 0, width: MAP_W, height: MAP_H, class: 'map-ocean' }),
    s('path', { d: WORLD_GRATICULE_PATH, class: 'map-grid' }),
    s('path', { d: WORLD_LAND_PATH, class: 'map-land' }),
  )
  const pinsG = s('g', { class: 'map-pins' })
  svg.append(landG, pinsG)

  const zoomBar = h('div', 'map-zoom')
  const mkZoomBtn = (name: 'plus' | 'minus' | 'fit', label: string, fn: () => void): HTMLButtonElement => {
    const b = h('button', 'map-zoom-btn')
    b.type = 'button'
    b.title = label
    b.setAttribute('aria-label', label)
    b.innerHTML = icon(name, 18)
    b.addEventListener('click', fn)
    return b
  }
  zoomBar.append(
    mkZoomBtn('plus', 'Zoom in', () => zoomBy(0.5)),
    mkZoomBtn('minus', 'Zoom out', () => zoomBy(2)),
    mkZoomBtn('fit', 'Zoom to printers', () => fitPins()),
  )

  const legend = h('div', 'map-legend')
  legend.innerHTML =
    '<span><i class="dot dot-online"></i>Online</span>' +
    '<span><i class="dot dot-busy"></i>Busy</span>' +
    '<span><i class="dot dot-offline"></i>Offline</span>'

  mapWrap.append(svg, zoomBar, legend)
  const cardsEl = h('div', 'map-cards')
  // Collapse toggle: hides the map + cards so the editor gets the space.
  const COLLAPSE_KEY = 'stikka.picker.collapsed'
  const toggle = h('button', 'map-toggle') as HTMLButtonElement
  toggle.type = 'button'
  const bar = h('div', 'map-summary-bar', summary, toggle)
  const body = h('div', 'map-body', mapWrap, cardsEl)
  root.append(bar, body)
  let collapsed = false
  try { collapsed = localStorage.getItem(COLLAPSE_KEY) === '1' } catch { /* ignore */ }
  const applyCollapsed = (): void => {
    root.classList.toggle('collapsed', collapsed)
    body.hidden = collapsed
    toggle.setAttribute('aria-expanded', String(!collapsed))
    toggle.innerHTML = `<span class="map-toggle-label">${collapsed ? 'Change printer' : 'Hide'}</span>${icon(collapsed ? 'plus' : 'minus', 16)}`
    toggle.title = collapsed ? 'Show the printer map' : 'Collapse the printer map'
  }
  toggle.addEventListener('click', () => {
    collapsed = !collapsed
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') } catch { /* ignore */ }
    applyCollapsed()
    if (!collapsed) requestAnimationFrame(() => renderPins())
  })
  applyCollapsed()

  const loadingEl = h('div', 'map-loading', h('span', 'spinner spinner-lg'), h('span', 'map-loading-text', 'Checking which printers are online…'))
  loadingEl.setAttribute('role', 'status')
  loadingEl.hidden = true
  root.append(loadingEl)
  function setLoading(on: boolean): void {
    root.classList.toggle('is-loading', on)
    root.setAttribute('aria-busy', String(on))
    loadingEl.hidden = !on
    toggle.disabled = on
  }

  // ── viewBox (zoom / pan) ──────────────────────────────────────────────────
  const ASPECT = MAP_H / MAP_W
  let vb = { x: 0, y: 0, w: MAP_W }
  let tween = 0

  const clampVB = (v: { x: number; y: number; w: number }) => {
    const w = Math.min(MAP_W, Math.max(90, v.w))
    const hgt = w * ASPECT
    return {
      w,
      x: Math.min(MAP_W - w, Math.max(0, v.x)),
      y: Math.min(MAP_H - hgt, Math.max(0, v.y)),
    }
  }
  const applyVB = (): void => {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.w * ASPECT}`)
    svg.classList.toggle('zoomed', vb.w < MAP_W - 1)
    renderPins()
  }
  const animateTo = (target: { x: number; y: number; w: number }): void => {
    const from = { ...vb }, to = clampVB(target)
    cancelAnimationFrame(tween)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { vb = to; applyVB(); return }
    const t0 = performance.now(), dur = 380
    const step = (now: number): void => {
      const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3)
      vb = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e }
      applyVB()
      if (t < 1) tween = requestAnimationFrame(step)
    }
    tween = requestAnimationFrame(step)
  }
  const zoomBy = (factor: number): void => {
    const w = vb.w * factor, cx = vb.x + vb.w / 2, cy = vb.y + (vb.w * ASPECT) / 2
    animateTo({ x: cx - w / 2, y: cy - (w * ASPECT) / 2, w })
  }
  const fitBox = (pts: Array<[number, number]>, minW = 260): void => {
    if (!pts.length) { animateTo({ x: 0, y: 0, w: MAP_W }); return }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
    const pad = 70
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad
    const minY = Math.min(...ys) - pad * 1.6, maxY = Math.max(...ys) + pad * 0.6
    const w = Math.max(minW, maxX - minX, (maxY - minY) / ASPECT)
    animateTo({ x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - (w * ASPECT) / 2, w })
  }
  // Zoom just far enough that the pins inside a cluster stop merging.
  function zoomToSeparate(c: Cluster): void {
    let minD = Infinity
    for (let a = 0; a < c.groups.length; a++) {
      for (let b = a + 1; b < c.groups.length; b++) {
        const d = Math.hypot(c.groups[a].x - c.groups[b].x, c.groups[a].y - c.groups[b].y)
        if (d > 0.01) minD = Math.min(minD, d)
      }
    }
    if (!Number.isFinite(minD) || vb.w <= 92) {          // can't separate further: show their printers instead
      focusKey = c.groups[0].key
      renderCards()
      return
    }
    const px = svg.clientWidth || 360
    const w = Math.max(90, Math.min(MAP_W, (minD / (CLUSTER_PX * 1.5)) * px))
    animateTo({ x: c.x - w / 2, y: c.y - (w * ASPECT) / 2, w })
  }
  const fitPins = (): void => fitBox(groups.filter(g => g.place).map(g => [g.x, g.y] as [number, number]))

  // drag to pan (pointer capture only starts after a small move, so pin clicks still work)
  let drag: { px: number; py: number; vx: number; vy: number; moved: boolean } | null = null
  svg.addEventListener('pointerdown', e => {
    if (vb.w >= MAP_W - 1) return
    drag = { px: e.clientX, py: e.clientY, vx: vb.x, vy: vb.y, moved: false }
  })
  svg.addEventListener('pointermove', e => {
    if (!drag) return
    const dx = e.clientX - drag.px, dy = e.clientY - drag.py
    if (!drag.moved && Math.hypot(dx, dy) < 5) return
    if (!drag.moved) { drag.moved = true; svg.setPointerCapture(e.pointerId); svg.classList.add('panning') }
    const u = vb.w / (svg.clientWidth || 360)
    vb = clampVB({ x: drag.vx - dx * u, y: drag.vy - dy * u, w: vb.w })
    applyVB()
  })
  const endDrag = (): void => { drag = null; svg.classList.remove('panning') }
  svg.addEventListener('pointerup', endDrag)
  svg.addEventListener('pointercancel', endDrag)

  // ── pins ──────────────────────────────────────────────────────────────────
  const PIN_PX = 1                                   // pin art is drawn in screen px
  const unit = (): number => vb.w / (svg.clientWidth || 360) * PIN_PX
  const CLUSTER_PX = 26

  function cluster(): Cluster[] {
    const u = unit(), placed = groups.filter(g => g.place)
    const out: Cluster[] = []
    for (const g of placed) {
      const hit = out.find(c => Math.hypot(c.x - g.x, c.y - g.y) < CLUSTER_PX * u)
      if (hit) {
        hit.groups.push(g)
        hit.count += g.entries.length
        hit.x = hit.groups.reduce((a, b) => a + b.x, 0) / hit.groups.length
        hit.y = hit.groups.reduce((a, b) => a + b.y, 0) / hit.groups.length
        hit.status = bestStatus([hit.status, g.status])
      } else {
        out.push({ groups: [g], x: g.x, y: g.y, count: g.entries.length, status: g.status })
      }
    }
    return out
  }

  function renderPins(): void {
    const u = unit()
    pinsG.replaceChildren()
    const isSel = (c: Cluster): boolean => c.groups.some(g => g.entries.some(e => e.i === selectedIndex))
    // SVG has no z-index: draw the selected pin last so it sits on top.
    const ordered = cluster().sort((a, b) => Number(isSel(a)) - Number(isSel(b)))
    for (const c of ordered) {
      const sel = isSel(c)
      const solo = c.groups.length === 1
      const first = c.groups[0]
      const names = c.groups.map(g => g.place!.label).join(', ')
      const g = s('g', {
        class: `map-pin st-${c.status}${sel ? ' selected' : ''}`,
        transform: `translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) scale(${u.toFixed(4)})`,
        tabindex: 0, role: 'button',
        'aria-label': `${names}: ${c.count} printer${c.count === 1 ? '' : 's'}, ${STATUS_TEXT[c.status].toLowerCase()}`,
      })
      g.append(s('title', {}, `${names} — ${c.count} printer${c.count === 1 ? '' : 's'}`))
      if (sel) g.append(s('circle', { class: 'pin-ping', r: 6 }))
      g.append(s('line', { class: 'pin-pole', x1: 0, y1: 0, x2: 0, y2: -30 }))
      if (solo && first.place!.cc) {
        g.append(
          s('rect', { class: 'pin-flag-bg', x: -1, y: -31, width: 28, height: 20, rx: 3 }),
          Object.assign(s('image', { href: flagSrc(first.place!.cc), x: 1, y: -29, width: 24, height: 16, preserveAspectRatio: 'none' }), {}),
          s('rect', { class: 'pin-flag-edge', x: 1, y: -29, width: 24, height: 16, rx: 1 }),
        )
        g.querySelector('image')?.addEventListener('error', ev => (ev.target as SVGElement).remove())
      } else {
        g.append(s('path', { class: 'pin-pennant', d: 'M0 -31h22l-5 8 5 8H0z' }))
      }
      g.append(s('circle', { class: 'pin-base', r: 4.5 }))
      if (c.count > 1) {
        g.append(
          s('circle', { class: 'pin-badge', cx: 26, cy: -31, r: 9 }),
          s('text', { class: 'pin-badge-text', x: 26, y: -27.5 }, String(c.count)),
        )
      }
      const activate = (e: Event): void => {
        e.stopPropagation()
        if (solo) {
          focusKey = first.key
          const mine = first.entries.find(en => en.i === selectedIndex) ?? first.entries[0]
          if (mine.i !== selectedIndex) opts.onSelect(mine.i)
          else renderCards()
        } else {
          zoomToSeparate(c)
        }
      }
      g.addEventListener('click', activate)
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e) } })
      pinsG.append(g)
    }
  }

  // ── summary + cards ───────────────────────────────────────────────────────
  const statusPill = (st: Status): HTMLElement => {
    const sp = h('span', `status-pill st-${st}`)
    sp.append(h('i', `dot dot-${st}`), STATUS_TEXT[st])
    return sp
  }
  const labelShape = (p: PrinterInfo): string =>
    p.label.length > 0 ? `${p.label.isRound ? 'ø' : ''}${p.label.width}×${p.label.length} mm` : `${p.label.width} mm endless`
  const flagImg = (cc: string): HTMLElement => {
    if (!cc) { const f = h('span', 'flag flag-none'); f.innerHTML = icon('pin', 16); return f }
    const img = h('img', 'flag') as HTMLImageElement
    img.src = flagSrc(cc); img.alt = ''; img.width = 24; img.height = 16; img.loading = 'lazy'
    img.addEventListener('error', () => img.replaceWith(h('span', 'flag flag-none', cc)))
    return img
  }

  /** "Seen 12 s ago · online for 3 min" — empty for the dummy/unknown printer. */
  const timingText = (e: Entry): string => {
    if (!e.meta || e.status === 'unknown') return ''
    const seen = `seen ${timeAgo(e.meta.lastSeen)}`
    if (!e.meta.statusSince) return seen
    const label = e.status === 'offline' ? 'offline for' : e.status === 'busy' ? 'busy for' : 'online for'
    return `${seen} · ${label} ${duration(e.meta.statusSince)}`
  }

  const timeEls: Array<[HTMLElement, Entry]> = []

  function renderSummary(): void {
    summary.replaceChildren()
    const sel = groups.flatMap(g => g.entries).find(e => e.i === selectedIndex)
    const grp = groups.find(g => g.entries.some(e => e.i === selectedIndex))
    if (!sel || !grp) {
      summary.append(h('div', 'map-summary-empty', 'No printer selected yet — pick a flag on the map.'))
      return
    }
    summary.append(
      h('span', 'map-summary-kicker', 'Printing to'),
      flagImg(grp.place?.cc ?? ''),
      printerBadge(sel.p.name, 24),
      h('strong', 'map-summary-name', sel.p.name),
      h('span', 'map-summary-loc', grp.place ? grp.place.label : (sel.p.location || 'location not set')),
      statusPill(sel.status),
    )
    const timing = timingText(sel)
    if (timing) summary.append(h('span', 'map-summary-time', timing))
  }

  function renderCards(): void {
    const keep = cardsEl.scrollTop
    cardsEl.replaceChildren()
    timeEls.length = 0
    if (!groups.length) {
      cardsEl.append(h('p', 'map-empty',
        'No printers are online right now. Printers appear here a few seconds after they connect.'))
      return
    }
    const ordered = [...groups].sort((a, b) => {
      if (a.key === focusKey) return -1
      if (b.key === focusKey) return 1
      if (!a.place !== !b.place) return a.place ? -1 : 1
      return (a.place?.label ?? '').localeCompare(b.place?.label ?? '')
    })
    for (const g of ordered) {
      const sec = h('div', 'map-group' + (g.key === focusKey ? ' focus' : ''))
      const head = h('div', 'map-group-head',
        flagImg(g.place?.cc ?? ''),
        h('span', 'map-group-title', g.place ? g.place.label : 'Location not set'),
        h('span', 'map-group-count', `${g.entries.length} printer${g.entries.length === 1 ? '' : 's'}`),
      )
      sec.append(head)
      const list = h('div', 'map-card-list')
      for (const e of g.entries) {
        const b = h('button', 'printer-card' + (e.i === selectedIndex ? ' selected' : ''))
        b.type = 'button'
        b.setAttribute('aria-pressed', String(e.i === selectedIndex))
        const sub = [e.p.type.toUpperCase(), labelShape(e.p), e.p.location && g.place && e.p.location !== g.place.label ? e.p.location : '']
          .filter(Boolean).join(' · ')
        b.style.setProperty('--printer-color', printerStyle(e.p.name).color)
        const top = h('span', 'printer-card-top', printerBadge(e.p.name, 22), h('span', 'printer-card-name', e.p.name))
        b.append(top, h('span', 'printer-card-sub', sub), statusPill(e.status))
        const timing = timingText(e)
        if (timing) {
          const te = h('span', 'printer-card-time', timing)
          timeEls.push([te, e])
          b.append(te)
        }
        b.addEventListener('click', () => { focusKey = g.key; opts.onSelect(e.i) })
        list.append(b)
      }
      sec.append(list)
      cardsEl.append(sec)
    }
    cardsEl.scrollTop = keep
  }

  // ── public update ─────────────────────────────────────────────────────────
  function update(printers: PrinterInfo[], selIdx: number): void {
    selectedIndex = selIdx
    const byKey = new Map<string, Group>()
    printers.forEach((p, i) => {
      const meta = opts.getMeta(i)
      const status: Status = opts.isDummy(p.name) ? 'unknown'
        : !meta ? 'unknown' : !meta.online ? 'offline' : meta.busy ? 'busy' : 'online'
      const place = opts.isDummy(p.name) ? null : resolveLocation(p.location, p.name)
      const key = place ? place.key : 'unplaced'
      let g = byKey.get(key)
      if (!g) {
        const [x, y] = place ? project(place.lat, place.lon) : [0, 0]
        g = { key, place, entries: [], x, y, status: 'unknown' }
        byKey.set(key, g)
      }
      g.entries.push({ p, i, status, meta })
    })
    groups = [...byKey.values()]
    groups.forEach(g => { g.status = bestStatus(g.entries.map(e => e.status)) })

    const selGroup = groups.find(g => g.entries.some(e => e.i === selIdx))
    if (selGroup) focusKey = selGroup.key
    else if (!groups.some(g => g.key === focusKey)) focusKey = groups[0]?.key ?? null

    renderSummary()
    renderPins()
    renderCards()
  }

  new ResizeObserver(() => renderPins()).observe(svg)
  // Keep the relative times ("seen 12 s ago") fresh without re-rendering cards.
  window.setInterval(() => {
    if (!root.isConnected) return
    for (const [el, e] of timeEls) el.textContent = timingText(e)
    renderSummary()
  }, 10_000)
  return { element: root, update, setLoading }
}
