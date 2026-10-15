# SG Stikka Factory

Singapore instance of the open-source **Stikka** sticker/label machine, run at the [Edible Makerspace](https://linktr.ee/ediblemakerspace). Fork of [stikka-factory/stikka-mqtt](https://github.com/stikka-factory/stikka-mqtt).

Design a label in your browser, pick a printer anywhere on the map, press print. The browser renders the label, sends it over MQTT, and a small ESP32 bridge plugged into the printer's USB port prints it.

- Live site: **https://stikka.ediblemakerspace.com**
- Bridge firmware (fork): [saadcaffeine/stikka-esp32](https://github.com/saadcaffeine/stikka-esp32)
- Upstream project: [stikka-factory/stikka-mqtt](https://github.com/stikka-factory/stikka-mqtt)

## How it works

```
Browser  ──►  MQTT broker (HiveMQ)  ──►  ESP32-S3 bridge  ──USB──►  Printer
  │              /<printer>/command/        /<printer>/status/ (retained)
  └── Supabase: shared printer list, fonts, print statistics
```

1. Each printer has an ESP32-S3 bridge. It publishes its status on `/<printer>/status/` and listens for jobs on `/<printer>/command/`.
2. Printers that are online appear in the picker. A printer drops off the list after 5 minutes without a status message.
3. All image work (text, dithering, barcodes, Brother QL rasterising) happens in the browser. The firmware only forwards bytes.

### Supported boards

- ESP32-S3 DevKitC-1 **N16R8** ([example listing](https://www.aliexpress.com/item/1005012092039320.html)). Get the N16R8 variant: images need the PSRAM.

### Supported printers

| Printer | Method | Notes |
|---|---|---|
| Zebra / ZPL | Network | Printer on the same network as the ESP32 (not recommended) |
| Zebra / ZPL | USB | Printer's USB-B port plugged into the ESP32 |
| Brother QL | USB | Printer's USB-B port plugged into the ESP32. QL-500/550 need legacy mode, see below |
| Seiko SLP | USB | Printer's USB-B port plugged into the ESP32 |

## What this fork changes

### Frontend
- **Singapore defaults and branding:** Singapore is the default location, with an Edible Makerspace theme, footer and SEO tags.
- **Printer picker:** map picker, icon pickers, colour-coded printer chips, "last seen" times, a boot spinner, and a picker that stays greyed out until statuses have loaded.
- **Layout:** collapsible sections, side-by-side picker and preview, a print button that fits mobile screens, heavy libraries lazy-loaded.
- **Brother QL-500/550 support:** an opt-in legacy command set (below).

### Brother QL-500 / QL-550 (legacy raster mode)

Older QL models reject the newer command set that this project normally sends: auto-cut, "switch to raster mode", mode setting, expanded mode and compression. They respond by **blinking the green LED quickly and printing nothing**, even though the job arrives and the USB transfer succeeds.

Legacy mode builds the reduced stream the QL-500 accepts (print-information header, margins, uncompressed raster rows, print command). It is opt-in per printer and stored in your browser, because the shared printer list does not carry a printer model. In the browser console on the site:

```js
// printer names are comma-separated and case-insensitive
localStorage.setItem('stikka.qlLegacyPrinters', 'SG-stikka-factory')
```

Optional: override the media header sent to the printer (width x length in mm, length 0 = continuous roll). This changes only what the printer is told about the loaded media, not the label size you design:

```js
localStorage.setItem('stikka.qlMedia', 'SG-stikka-factory=62x0')
```

Verified on: Brother QL-500, DK-22205 (62 mm continuous), ESP32-S3 over USB. Set the bridge's label size to match the roll (62 x 0 for DK-22205), and keep Auto-cut off: the QL-500 has no cutter.

Both keys are per browser. Clear them with `localStorage.removeItem(...)`.

## Add a printer

1. Bridge the two open solder jumpers on the ESP32 board.
2. Plug into the USB port labelled **COM** to flash.
3. Flash from the ESP32 Flasher tab on the site (or any Chromium-based browser with Web Serial).
4. If the ESP32 doesn't know a network it creates one named `Stikka-XXXXXX`. Join it with password `stikkaesp32` and open the setup page (usually `http://192.168.4.1`).
5. Follow the setup: Wi-Fi, MQTT (the shared broker is pre-filled) and printer type. The board reboots after saving.
6. Give the printer a unique name. The default is ignored.
7. Afterwards the bridge's web UI is at `http://<name>.local/` (slugified: `Test_Brother` becomes `test-brother.local`).

Updating: use the Firmware page on the bridge's own web UI, or re-flash from the Flasher tab. Removing: just unplug it; it disappears after 5 minutes.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Printer's green LED blinks quickly, nothing prints (QL-500/550) | Needs legacy mode (see above) |
| Job accepted but label is blank or the wrong size | Bridge label size doesn't match the loaded roll |
| Job fails with "printer stopped accepting data" | Printer out of labels, cover open or wrong roll. Fix it and print again; the next job is not blocked |
| Bridge log shows `0x10c` after a failed job | Older firmware: reboot the bridge. Current fork firmware recovers by itself |
| Bridge Config "Save" did nothing | Firmware older than the fork's fix: update the firmware |
| Printer missing from the picker | No status for 5 minutes: check bridge power, Wi-Fi and the status pills on its web UI |

## Development and deployment

The frontend is a Vite + TypeScript app in `frontend/`, deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`. Configuration (`config.json`) is generated at deploy time from repository variables and secrets. See [README_DETAILS.md](README_DETAILS.md) for architecture, frontend configuration and the Supabase schema.

Note: the Pages build checks out the firmware from `stikka-factory/stikka-esp32` to produce the web flasher binaries. To flash this fork's firmware from the site, change the `repository:` value of that checkout step to `saadcaffeine/stikka-esp32`.

## Credits

Based on [Stikka](https://github.com/stikka-factory/stikka-mqtt) by the stikka-factory contributors. Fork maintained by [Saad Chinoy](https://github.com/saadcaffeine) for the Singapore instance.
