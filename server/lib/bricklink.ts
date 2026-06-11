const BASE_URL = 'https://www.bricklink.com/catalogPG.asp'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const TIMEOUT_MS = 20_000

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

interface StatBlock {
  timesSold: number | null
  totalQty: number | null
  minPrice: number | null
  avgPrice: number | null
  qtyAvgPrice: number | null
  maxPrice: number | null
}

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(/,/g, ''))
  return isFinite(n) && n > 0 ? n : null
}

function parseIntSafe(s: string): number | null {
  const n = Number.parseInt(s.replace(/,/g, ''), 10)
  return isFinite(n) && n >= 0 ? n : null
}

function extractStatBlocks(section: string): StatBlock[] {
  const blocks: StatBlock[] = []
  // Each block is a <TABLE ... CLASS="fv"> containing price rows
  const blockRe = /CLASS="fv">([\s\S]*?)<\/TABLE>/g
  let m: RegExpExecArray | null
  while ((m = blockRe.exec(section)) !== null) {
    const b = m[1]
    const get = (label: string) => {
      const r = new RegExp(label + '[^<]*<\\/TD><TD[^>]*><B>([^<]+)<\\/B>')
      const match = b.match(r)
      return match ? match[1].trim() : null
    }
    const minRaw = get('Min Price:')
    const avgRaw = get('Avg Price:')
    const qtyAvgRaw = get('Qty Avg Price:')
    const maxRaw = get('Max Price:')
    const soldRaw = get('Times Sold:') ?? get('Total Lots:')
    const qtyRaw = get('Total Qty:')

    const stripCurrency = (v: string | null) => (v ? v.replace(/[A-Z]{3}[&nbsp;\s;]*/g, '').trim() : null)

    blocks.push({
      timesSold: soldRaw ? parseIntSafe(soldRaw) : null,
      totalQty: qtyRaw ? parseIntSafe(qtyRaw) : null,
      minPrice: minRaw ? parseNum(stripCurrency(minRaw) ?? '') : null,
      avgPrice: avgRaw ? parseNum(stripCurrency(avgRaw) ?? '') : null,
      qtyAvgPrice: qtyAvgRaw ? parseNum(stripCurrency(qtyAvgRaw) ?? '') : null,
      maxPrice: maxRaw ? parseNum(stripCurrency(maxRaw) ?? '') : null,
    })
  }
  return blocks
}

async function fetchHtml(setNo: string): Promise<string | null> {
  const url = `${BASE_URL}?S=${encodeURIComponent(setNo)}&colorID=0&moneyType=EUR`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Encoding': 'identity',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) {
      console.warn(`[bricklink] ${setNo} HTTP ${res.status}`)
      return null
    }
    return res.text()
  } catch (err) {
    console.warn(`[bricklink] ${setNo} fetch error:`, (err as Error).message)
    return null
  }
}

function detectCurrency(html: string): string {
  const m = html.match(/([A-Z]{3})&nbsp;[\d,]+\.\d{2}/)
  return m ? m[1] : 'EUR'
}

const pageCache = new Map<string, { html: string; ts: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

async function getHtml(setNo: string): Promise<string | null> {
  const cached = pageCache.get(setNo)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.html
  const html = await fetchHtml(setNo)
  if (html) pageCache.set(setNo, { html, ts: Date.now() })
  return html
}

export async function fetchBricklinkPrice(setNo: string, condition: PriceCondition): Promise<PriceGuideData | null> {
  const html = await getHtml(setNo)
  if (!html) return null

  const soldMarker = 'Last 6 Months Sales:'
  const soldIdx = html.indexOf(soldMarker)
  if (soldIdx === -1) {
    console.warn(`[bricklink] ${setNo}: "Last 6 Months Sales" section not found`)
    return null
  }

  // Section spans from the marker to the next major section break (~10KB should be enough)
  const section = html.slice(soldIdx, soldIdx + 10_000)
  const blocks = extractStatBlocks(section)

  // blocks[0]=New sold, blocks[1]=Used sold, blocks[2]=New listing, blocks[3]=Used listing
  const block = condition === 'new' ? blocks[0] : blocks[1]
  if (!block) {
    console.warn(`[bricklink] ${setNo}/${condition}: stat block not found (got ${blocks.length} blocks)`)
    return null
  }

  const currency = detectCurrency(section)

  return {
    setNo,
    condition,
    minPrice: block.minPrice,
    avgPrice: block.avgPrice,
    maxPrice: block.maxPrice,
    qtyAvgPrice: block.qtyAvgPrice,
    unitQuantity: block.timesSold,
    totalQuantity: block.totalQty,
    currency,
  }
}
