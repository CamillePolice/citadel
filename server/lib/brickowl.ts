import { getEnv } from '../utils/env'

const BASE_URL = 'https://api.brickowl.com/v1'

export interface BrickOwlPriceData {
  setNo: string
  boid: string
  cheapestGbp: number
  currency: 'GBP'
}

interface PricesResponse {
  lowest_listing_price?: string
  new_min?: string
  used_min?: string
}

function parseGbp(...vals: Array<string | undefined>): number | null {
  for (const v of vals) {
    if (v == null || v === '') continue
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

async function lookupBoid(setNo: string, key: string): Promise<string | null> {
  const base = setNo.split('-')[0]
  const url = `${BASE_URL}/catalog/id_lookup?key=${encodeURIComponent(key)}&id=${encodeURIComponent(base)}&type=Set`
  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    console.warn(`[brickowl] ${setNo} lookup network error:`, (err as Error).message)
    return null
  }
  if (!res.ok) {
    console.warn(`[brickowl] ${setNo} lookup HTTP ${res.status}`)
    return null
  }
  const data = (await res.json()) as { boids?: string[] }
  const boid = data.boids?.[0] ?? null
  if (!boid) console.warn(`[brickowl] ${setNo} no BOID found`)
  return boid
}

export async function fetchBrickOwlPrice(setNo: string): Promise<BrickOwlPriceData | null> {
  const env = getEnv()
  const key = env.BRICKOWL_API_KEY
  if (!key) {
    console.warn('[brickowl] BRICKOWL_API_KEY missing, skipping')
    return null
  }

  const boid = await lookupBoid(setNo, key)
  if (!boid) return null

  const url = `${BASE_URL}/catalog/prices?key=${encodeURIComponent(key)}&boid=${encodeURIComponent(boid)}&country=GB`
  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    console.warn(`[brickowl] ${setNo} prices network error:`, (err as Error).message)
    return null
  }
  if (res.status === 404) {
    console.warn(`[brickowl] ${setNo} prices not found (404)`)
    return null
  }
  if (!res.ok) {
    console.warn(`[brickowl] ${setNo} prices HTTP ${res.status}`)
    return null
  }

  const body = (await res.json()) as PricesResponse
  const cheapest = parseGbp(body.lowest_listing_price, body.used_min, body.new_min)
  if (cheapest === null) {
    console.warn(`[brickowl] ${setNo} no usable price`)
    return null
  }

  return { setNo, boid, cheapestGbp: cheapest, currency: 'GBP' }
}
