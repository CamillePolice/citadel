import crypto from 'node:crypto'
import OAuth from 'oauth-1.0a'
import { getEnv } from '../utils/env'

const BASE_URL = 'https://api.bricklink.com/api/store/v1'

export type PriceCondition = 'new' | 'used'

export interface PriceGuideData {
  setNo: string
  condition: PriceCondition
  minPrice: number | null
  avgPrice: number | null
  maxPrice: number | null
  qtyAvgPrice: number | null
  unitQuantity: number | null
  totalQuantity: number | null
  currency: string
}

interface BricklinkPriceResponse {
  meta: { code: number; message: string; description: string }
  data?: {
    item: { no: string; type: string }
    new_or_used: 'N' | 'U'
    currency_code: string
    min_price: string
    max_price: string
    avg_price: string
    qty_avg_price: string
    unit_quantity: number
    total_quantity: number
  }
}

function buildOAuth(): OAuth {
  const env = getEnv()
  return new OAuth({
    consumer: {
      key: env.BRICKLINK_CONSUMER_KEY as string,
      secret: env.BRICKLINK_CONSUMER_SECRET as string,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64')
    },
  })
}

function parseNum(v: string | undefined): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function fetchBricklinkPrice(setNo: string, condition: PriceCondition): Promise<PriceGuideData | null> {
  const env = getEnv()
  const newOrUsed = condition === 'new' ? 'N' : 'U'
  const url = `${BASE_URL}/items/SET/${encodeURIComponent(setNo)}/price?guide_type=sold&new_or_used=${newOrUsed}`

  const oauth = buildOAuth()
  const token = {
    key: env.BRICKLINK_TOKEN as string,
    secret: env.BRICKLINK_TOKEN_SECRET as string,
  }
  const authHeader = oauth.toHeader(oauth.authorize({ url, method: 'GET' }, token))

  let res: Response
  try {
    res = await fetch(url, { method: 'GET', headers: { ...authHeader } })
  } catch (err) {
    console.warn(`[bricklink] ${setNo}/${condition} network error:`, (err as Error).message)
    return null
  }

  if (res.status === 429) {
    console.warn(`[bricklink] ${setNo}/${condition} rate limited (429), skipping`)
    return null
  }
  if (!res.ok) {
    console.warn(`[bricklink] ${setNo}/${condition} HTTP ${res.status}`)
    return null
  }

  const body = (await res.json()) as BricklinkPriceResponse
  if (body.meta.code !== 200 || !body.data) {
    console.warn(`[bricklink] ${setNo}/${condition} meta ${body.meta.code} ${body.meta.message}`)
    return null
  }

  const d = body.data
  return {
    setNo,
    condition,
    minPrice: parseNum(d.min_price),
    avgPrice: parseNum(d.avg_price),
    maxPrice: parseNum(d.max_price),
    qtyAvgPrice: parseNum(d.qty_avg_price),
    unitQuantity: d.unit_quantity ?? null,
    totalQuantity: d.total_quantity ?? null,
    currency: d.currency_code ?? 'EUR',
  }
}
