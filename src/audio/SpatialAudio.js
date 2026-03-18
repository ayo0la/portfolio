// Spatial audio stubs — extends AudioManager for zone-specific sounds
import { playZoneSound } from './AudioManager.js'

const zoneSoundMap = {
  midfield:       () => playZoneSound('midfield'),
  tunnel:         () => playZoneSound('tunnel'),
  lockerRoom:     () => playZoneSound('lockerRoom'),
  transferMarket: () => playZoneSound('transferMarket'),
  expansionWing:  () => playZoneSound('expansionWing'),
  archive:        () => playZoneSound('archive'),
}

export function playZoneSpatial(zoneId) {
  const fn = zoneSoundMap[zoneId]
  if (fn) fn()
}
