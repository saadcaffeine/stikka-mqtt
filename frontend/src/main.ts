import './layout.css'
import './style.css'
import './components.css'
import { defaultState } from './types'
import { fetchAppInfo, fetchPrinters, fetchFonts, initTransport } from './mqtt-api'
import { initApp } from './ui'
import { loadStaticModeConfig, loadCustomFonts } from './static-config'

async function main(): Promise<void> {
  const appEl = document.getElementById('app')
  if (!appEl) return

  // index.html ships crawlable fallback content inside #app; it stays visible
  // (with a spinner) until the app below replaces it.
  appEl.classList.add('is-loading')

  const state = defaultState()
  const staticConfig = await loadStaticModeConfig()
  if (!staticConfig) {
    appEl.classList.remove('is-loading')
    appEl.textContent = 'Missing frontend/public/config.json for MQTT mode.'
    return
  }

  try {
    await initTransport(staticConfig)
  } catch (e) {
    console.warn('Could not initialize MQTT transport:', e)
    appEl.classList.remove('is-loading')
    appEl.textContent = 'Could not initialize MQTT transport. Check config.json MQTT settings.'
    return
  }

  let appName = 'Gostikka'
  let appSubtitle = ''
  let zplRawEnabled = true
  let cableLabelEnabled = false
  let textOverlayEnabled = true

  try {
    const [info, printers, fonts] = await Promise.all([fetchAppInfo(), fetchPrinters(), fetchFonts()])
    appName = info.name
    appSubtitle = info.subtitle
    zplRawEnabled = info.zplRawEnabled
    cableLabelEnabled = info.cableLabelEnabled
    textOverlayEnabled = info.textOverlayEnabled
    if (info.zplExample) state.rawZPL = info.zplExample
    if (info.cableLabelZPLTemplate) state.cableLabelZPLTemplate = info.cableLabelZPLTemplate
    state.printers = printers
    const customFonts = loadCustomFonts()
    state.fonts = [...fonts.filter(f => !customFonts.some(c => c.name === f.name)), ...customFonts]
    if (fonts.length > 0) state.fontName = fonts[0].name
  } catch (e) {
    console.warn('Could not load config from server:', e)
  }

  // <title> is set statically in index.html for search/AI crawlers; keep it.
  appEl.classList.remove('is-loading')
  await initApp(
    appEl,
    state,
    appName,
    appSubtitle,
    zplRawEnabled,
    cableLabelEnabled,
    textOverlayEnabled,
  )
}

main()
