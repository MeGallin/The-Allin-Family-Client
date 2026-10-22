import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from 'lucide-react'

/** Open-Meteo WMO interpretation codes; unknown conditions never masquerade as sunshine. */
export function weatherCondition(code: number) {
  if (code === 0) return { label: 'Clear sky', icon: Sun }
  if (code === 1 || code === 2) return { label: 'Partly cloudy', icon: CloudSun }
  if (code === 3) return { label: 'Overcast', icon: Cloud }
  if (code === 45 || code === 48) return { label: 'Fog', icon: CloudFog }
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: CloudDrizzle }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', icon: CloudRain }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', icon: CloudSnow }
  if ([95, 96, 99].includes(code)) return { label: 'Thunderstorms', icon: CloudLightning }
  return { label: 'Conditions unavailable', icon: Cloud }
}
