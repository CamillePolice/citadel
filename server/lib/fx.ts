const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=GBP&to=EUR'
const FALLBACK_GBP_EUR = 1.17

let cachedRate: number | null = null

interface FrankfurterResponse {
  rates?: { EUR?: number }
}

export async function getGbpToEurRate(): Promise<number> {
  if (cachedRate !== null) return cachedRate
  try {
    const res = await fetch(FRANKFURTER_URL)
    if (!res.ok) throw new Error(`frankfurter HTTP ${res.status}`)
    const data = (await res.json()) as FrankfurterResponse
    const rate = data.rates?.EUR
    if (typeof rate !== 'number' || rate <= 0) throw new Error('frankfurter: missing EUR rate')
    cachedRate = rate
    console.log(`[fx] GBP->EUR rate ${rate}`)
    return rate
  } catch (err) {
    console.warn(`[fx] fetch failed, using fallback ${FALLBACK_GBP_EUR}:`, (err as Error).message)
    cachedRate = FALLBACK_GBP_EUR
    return FALLBACK_GBP_EUR
  }
}

export function resetFxCache(): void {
  cachedRate = null
}
