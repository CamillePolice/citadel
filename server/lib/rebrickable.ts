import { getEnv } from '../utils/env'

const BASE_URL = 'https://rebrickable.com/api/v3/lego'

export interface CatalogSetData {
  setNo: string
  name: string | null
  year: number | null
  theme: number | null
  numParts: number | null
  imageUrl: string | null
}

interface RebrickableSetResponse {
  set_num: string
  name?: string
  year?: number
  theme_id?: number
  num_parts?: number
  set_img_url?: string
}

export async function fetchRebrickableSet(setNo: string): Promise<CatalogSetData | null> {
  const env = getEnv()
  const key = env.REBRICKABLE_API_KEY
  if (!key) {
    console.warn('[rebrickable] REBRICKABLE_API_KEY missing, skipping')
    return null
  }

  const url = `${BASE_URL}/sets/${encodeURIComponent(setNo)}/`
  let res: Response
  try {
    res = await fetch(url, { headers: { Authorization: `key ${key}` } })
  } catch (err) {
    console.warn(`[rebrickable] ${setNo} network error:`, (err as Error).message)
    return null
  }
  if (res.status === 404) {
    console.warn(`[rebrickable] ${setNo} not found (404)`)
    return null
  }
  if (!res.ok) {
    console.warn(`[rebrickable] ${setNo} HTTP ${res.status}`)
    return null
  }

  const d = (await res.json()) as RebrickableSetResponse
  return {
    setNo: d.set_num,
    name: d.name ?? null,
    year: d.year ?? null,
    theme: d.theme_id ?? null,
    numParts: d.num_parts ?? null,
    imageUrl: d.set_img_url ?? null,
  }
}
