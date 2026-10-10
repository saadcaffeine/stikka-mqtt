/**
 * footer.ts — page footer with an info button that opens a project-info dialog.
 */
import { icon } from './icons'
import { INSTANCES, LINKS } from './instances'

function a(href: string, text: string, ext = true): HTMLAnchorElement {
  const e = document.createElement('a')
  e.href = href
  e.textContent = text
  if (ext) { e.target = '_blank'; e.rel = 'noopener noreferrer' }
  return e
}

function li(...nodes: (Node | string)[]): HTMLLIElement {
  const e = document.createElement('li')
  e.append(...nodes)
  return e
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  e.append(...kids)
  return e
}

export function buildFooter(appName: string): HTMLElement {
  // ── Info dialog ──
  const dlg = document.createElement('dialog')
  dlg.className = 'info-dialog'
  dlg.setAttribute('aria-labelledby', 'info-title')

  const closeBtn = el('button', 'icon-btn info-close')
  closeBtn.type = 'button'
  closeBtn.setAttribute('aria-label', 'Close')
  closeBtn.innerHTML = icon('close', 20)
  closeBtn.addEventListener('click', () => dlg.close())

  const title = el('h2', 'info-title', `About ${appName}`)
  title.id = 'info-title'

  const instList = el('ul', 'info-list')
  for (const i of INSTANCES) {
    instList.append(li(
      i.current ? el('strong', '', i.name) : a(i.url, i.name),
      ` — ${i.where}`,
      ...(i.current ? [el('span', 'chip', 'you are here')] : []),
    ))
  }

  const body = el('div', 'info-body',
    el('p', '',
      `${appName} is the Singapore node of Stikka — an open-source way to print stickers and labels `,
      'on label printers anywhere in the world, straight from your browser. It is hosted by ',
      a(LINKS.site, 'Edible Makerspace'),
      ', an open-source, DIY bio-hacker makerspace exploring food futures.'),
    el('h3', '', 'How it works'),
    (() => {
      const ol = el('ol', 'info-list')
      ol.append(
        li('Design a label — image, text, QR or barcode. Everything is rendered in your browser.'),
        li('Pick a printer on the map. Each printer is an ESP32 board wired to a label printer, announcing itself over MQTT.'),
        li('Press print. The finished label travels over MQTT to that printer; there is no server in between.'),
      )
      return ol
    })(),
    el('h3', '', 'Put your own printer on the map'),
    el('p', '',
      'Flash the ESP32 bridge from the ESP32 Flasher tab, open its setup page and set a printer name and fill in the ',
      el('strong', '', 'Details (optional)'),
      ' box under it, which the map reads as the location (a city or country name works, or "My Space @1.35,103.82" for an exact spot). It shows up here with its flag within a minute.'),
    el('h3', '', 'Instances'),
    instList,
    el('h3', '', 'Links'),
    (() => {
      const ul = el('ul', 'info-list')
      ul.append(
        li(a(LINKS.upstream, 'stikka-mqtt on GitHub'), ' — the web app (upstream project)'),
        li(a(LINKS.fork, 'This instance\'s source'), ' — Singapore fork'),
        li(a(LINKS.firmware, 'stikka-esp32'), ' — printer bridge firmware'),
        li(a(LINKS.site, 'ediblemakerspace.com'), ' — the makerspace'),
        li(a(LINKS.linktree, 'Edible Makerspace link tree')),
      )
      return ul
    })(),
    el('p', 'info-credits',
      'Stikka-NG builds on ',
      a(LINKS.printit, 'printit'),
      '. Map: Natural Earth (public domain). Flags: country-flag-icons (MIT).'),
  )
  dlg.append(closeBtn, title, body)
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close() })

  // ── Footer bar ──
  const infoBtn = el('button', 'footer-btn')
  infoBtn.type = 'button'
  infoBtn.setAttribute('aria-label', 'Project info')
  infoBtn.title = 'Project info'
  infoBtn.innerHTML = icon('info', 20) + '<span>Info</span>'
  infoBtn.addEventListener('click', () => dlg.showModal())

  const iconLink = (href: string, name: Parameters<typeof icon>[0], label: string): HTMLAnchorElement => {
    const l = el('a', 'footer-btn') as HTMLAnchorElement
    l.href = href; l.target = '_blank'; l.rel = 'noopener noreferrer'
    l.setAttribute('aria-label', label); l.title = label
    l.innerHTML = icon(name, 20) + `<span>${label}</span>`
    return l
  }

  const year = new Date().getFullYear()
  const footer = el('footer', 'app-footer')
  footer.append(
    el('div', 'footer-inner',
      el('span', 'footer-copy',
        `© ${year} ${appName} · hosted by `,
        a(LINKS.site, 'Edible Makerspace'),
      ),
      el('nav', 'footer-nav',
        infoBtn,
        iconLink(LINKS.upstream, 'github', 'GitHub'),
        iconLink(LINKS.site, 'globe', 'Edible Makerspace'),
      ),
    ),
    dlg,
  )
  return footer
}
