const BASE = 'https://www.avenuedelabrique.com'
const UA = 'Mozilla/5.0 (compatible; CitadelBot/1.0; +https://github.com/CamillePolice/citadel)'
const TIMEOUT_MS = 15_000

// set number base (no -1 suffix) → product page URL
const productUrlCache = new Map<string, string | null>()
// sitemap URL → fetched flag
let fullIndex: Map<string, string> | null = null
let indexBuilding: Promise<Map<string, string>> | null = null

async function getText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xml,text/xml' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    return r.ok ? r.text() : null
  } catch {
    return null
  }
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
}

async function buildIndex(): Promise<Map<string, string>> {
  if (fullIndex) return fullIndex
  if (indexBuilding) return indexBuilding

  indexBuilding = (async () => {
    const index = new Map<string, string>()

    const indexXml = await getText(`${BASE}/sitemap.xml`)
    if (!indexXml) return index

    const subSitemaps = extractLocs(indexXml).filter(
      (u) => u.includes('/sitemaps/lego-') || u.match(/\/sitemaps\/lego[^-]/),
    )

    const results = await Promise.allSettled(subSitemaps.map((u) => getText(u)))

    for (const result of results) {
      if (result.status !== 'fulfilled' || !result.value) continue
      for (const loc of extractLocs(result.value)) {
        // URL pattern: /category/SETNUMBER-slug/p{id}
        const m = loc.match(/\/(\d+)-[^/]+\/p\d+$/)
        if (m && !index.has(m[1])) {
          index.set(m[1], loc)
        }
      }
    }

    fullIndex = index
    return index
  })()

  return indexBuilding
}

async function findProductUrl(setNo: string): Promise<string | null> {
  const base = setNo.split('-')[0]
  if (productUrlCache.has(base)) return productUrlCache.get(base)!

  const index = await buildIndex()
  const url = index.get(base) ?? null
  productUrlCache.set(base, url)
  return url
}

function parseMinPrice(html: string): number | null {
  // schema.org microdata: <span itemprop="lowPrice">NNN.NN</span>
  const m = html.match(/itemprop="lowPrice"\s*>([^<]+)</)
  if (!m) return null
  const price = parseFloat(m[1].trim().replace(',', '.'))
  return isNaN(price) || price <= 0 ? null : price
}

export interface AdlbResult {
  minPrice: number
  productUrl: string
}

export async function fetchAdlbPrice(setNo: string): Promise<AdlbResult | null> {
  const productUrl = await findProductUrl(setNo)
  if (!productUrl) return null

  const html = await getText(productUrl)
  if (!html) return null

  const minPrice = parseMinPrice(html)
  if (minPrice === null) return null

  return { minPrice, productUrl }
}
