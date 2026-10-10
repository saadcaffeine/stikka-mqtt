/**
 * Known Stikka instances — shown under "Other instances" in the footer info
 * panel and in public/llms.txt / about page. `current` marks this deployment.
 * To list another instance, append to the array.
 */
export interface StikkaInstance {
  name: string
  url: string
  where: string
  current?: boolean
}

export const INSTANCES: StikkaInstance[] = [
  { name: 'Stikka SG', url: 'https://stikka.ediblemakerspace.com/', where: 'Edible Makerspace, Singapore', current: true },
  { name: 'Stikka Factory (main)', url: 'https://stikka-factory.github.io/stikka-mqtt/', where: 'The original open-source project' },
]

export const LINKS = {
  site:        'https://ediblemakerspace.com/',
  linktree:    'https://linktr.ee/ediblemakerspace',
  upstream:    'https://github.com/stikka-factory/stikka-mqtt',
  firmware:    'https://github.com/stikka-factory/stikka-esp32',
  fork:        'https://github.com/saadcaffeine/stikka-mqtt',
  printit:     'https://github.com/5shekel/printit',
} as const
