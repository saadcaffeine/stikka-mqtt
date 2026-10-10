/**
 * printer-chips.ts — compact, always-visible printer chooser (flag + name +
 * status dot per printer) used by the Raw ZPL and Cable Label tabs in place
 * of a <select>. The Label tab uses the full map picker instead.
 */
import type { PrinterInfo } from './types'
import { resolveLocation } from './locations'
import * as api from './mqtt-api'
import { printerBadge, printerStyle } from './printer-style'

export interface PrinterChips {
  element: HTMLElement
  render(printers: PrinterInfo[], selectedIndex: number, onPick: (printerIndex: number) => void, emptyText?: string): void
}

export function createPrinterChips(): PrinterChips {
  const root = document.createElement('div')
  root.className = 'printer-chips'
  root.setAttribute('role', 'radiogroup')
  root.setAttribute('aria-label', 'Printer')

  function render(printers: PrinterInfo[], selected: number, onPick: (i: number) => void, emptyText = 'No printers available'): void {
    root.replaceChildren()
    if (!printers.length) {
      const p = document.createElement('span')
      p.className = 'printer-chips-empty'
      p.textContent = emptyText
      root.append(p)
      return
    }
    for (const p of printers) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'printer-chip' + (p.index === selected ? ' selected' : '')
      b.setAttribute('role', 'radio')
      b.setAttribute('aria-checked', String(p.index === selected))
      const meta = api.getMQTTPrinterMetaByIndex(p.index)
      const st = !meta ? 'unknown' : !meta.online ? 'offline' : meta.busy ? 'busy' : 'online'
      const place = resolveLocation(p.location, p.name)
      if (place?.cc) {
        const img = document.createElement('img')
        img.className = 'flag'
        img.alt = ''
        img.width = 24; img.height = 16
        img.src = `${import.meta.env.BASE_URL}flags/${place.cc.toLowerCase()}.svg`
        img.addEventListener('error', () => img.remove())
        b.append(img)
      }
      const dot = document.createElement('i')
      dot.className = `dot dot-${st}`
      const name = document.createElement('span')
      name.className = 'printer-chip-name'
      name.textContent = p.name
      b.style.setProperty('--printer-color', printerStyle(p.name).color)
      b.append(printerBadge(p.name, 18), dot, name)
      if (place) {
        const loc = document.createElement('span')
        loc.className = 'printer-chip-loc'
        loc.textContent = place.label
        b.append(loc)
      }
      b.title = `${p.name}${p.location ? ' — ' + p.location : ''} (${st})`
      b.addEventListener('click', () => onPick(p.index))
      root.append(b)
    }
  }
  return { element: root, render }
}
