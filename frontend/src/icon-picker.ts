/**
 * icon-picker.ts — a visible, tappable replacement for <select>:
 * every option is shown at once as an icon button (radio-group semantics).
 */
import { icon, type IconName } from './icons'

export interface IconOption<T extends string> {
  value: T
  label: string          // short caption + accessible name
  icon: IconName
  title?: string         // tooltip (defaults to label)
}

export interface IconPickerOpts {
  /** Hide captions under the icons (icon-only, label kept for screen readers). */
  iconOnly?: boolean
  /** Smaller buttons, for dense rows. */
  compact?: boolean
  className?: string
}

export function iconPicker<T extends string>(
  label: string,
  options: IconOption<T>[],
  value: T,
  onChange: (v: T) => void,
  opts: IconPickerOpts = {},
): HTMLElement {
  const root = document.createElement('div')
  root.className = 'icon-field' + (opts.className ? ' ' + opts.className : '')

  const lab = document.createElement('span')
  lab.className = 'icon-field-label'
  lab.textContent = label
  const labId = 'if-' + Math.random().toString(36).slice(2)
  lab.id = labId

  const group = document.createElement('div')
  group.className = 'icon-group' + (opts.compact ? ' compact' : '') + (opts.iconOnly ? ' icon-only' : '')
  group.setAttribute('role', 'radiogroup')
  group.setAttribute('aria-labelledby', labId)

  const buttons: HTMLButtonElement[] = []
  let current = value

  const paint = (): void => {
    buttons.forEach((b, i) => {
      const on = options[i].value === current
      b.setAttribute('aria-checked', String(on))
      b.tabIndex = on ? 0 : -1
      b.classList.toggle('selected', on)
    })
  }

  const choose = (v: T, focus = false): void => {
    current = v
    paint()
    if (focus) buttons[options.findIndex(o => o.value === v)]?.focus()
    onChange(v)
  }

  options.forEach((o, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'icon-opt'
    b.setAttribute('role', 'radio')
    b.setAttribute('aria-label', o.title ?? o.label)
    b.title = o.title ?? o.label
    b.innerHTML = icon(o.icon, opts.compact ? 20 : 26) + (opts.iconOnly ? '' : `<span class="icon-opt-cap">${o.label}</span>`)
    b.addEventListener('click', () => choose(o.value))
    b.addEventListener('keydown', e => {
      const k = e.key
      if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); choose(options[(i + 1) % options.length].value, true) }
      else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); choose(options[(i - 1 + options.length) % options.length].value, true) }
    })
    buttons.push(b)
    group.append(b)
  })
  paint()

  root.append(lab, group)
  return root
}
