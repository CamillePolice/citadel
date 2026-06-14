const FINDING_API = 'https://svcs.ebay.com/services/search/FindingService/v1'
const TIMEOUT_MS = 15_000
const EBAY_FRANCE_SITE_ID = '71'
const LEGO_CATEGORY_ID = '19016'

export interface EbayPriceData {
  setNo: string
  condition: 'new' | 'used'
  minPrice: number
  avgPrice: number
  maxPrice: number
  qtySold: number
  currency: string
}

interface EbayItem {
  itemId?: [string]
  title?: [string]
  viewItemURL?: [string]
  listingInfo?: [{ endTime?: [string] }]
  sellingStatus: [{ currentPrice: [{ '@currencyId': string; __value__: string }]; sellingState: [string] }]
  condition?: [{ conditionId: [string] }]
}

export interface EbayListing {
  setNo: string
  condition: 'new' | 'used'
  sourceListingId: string | null
  price: number
  saleDate: string | null
  title: string | null
  listingUrl: string | null
  currency: string
}

export interface EbayResult {
  aggregates: EbayPriceData[]
  listings: EbayListing[]
}

function isNew(conditionId: string): boolean {
  return conditionId === '1000' || conditionId === '1500'
}

function stats(prices: number[]): { min: number; avg: number; max: number } | null {
  if (prices.length === 0) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const avg = Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100
  return { min, avg, max }
}

export async function fetchEbayPrice(setNo: string, appId: string): Promise<EbayResult> {
  const setBase = setNo.split('-')[0]
  const params = new URLSearchParams({
    'OPERATION-NAME': 'findCompletedItems',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': '',
    siteid: EBAY_FRANCE_SITE_ID,
    keywords: `lego ${setBase}`,
    categoryId: LEGO_CATEGORY_ID,
    'itemFilter(0).name': 'SoldItemsOnly',
    'itemFilter(0).value': 'true',
    'itemFilter(1).name': 'Currency',
    'itemFilter(1).value': 'EUR',
    'paginationInput.entriesPerPage': '100',
    sortOrder: 'EndTimeSoonest',
  })

  let res: Response
  try {
    res = await fetch(`${FINDING_API}?${params}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    console.warn(`[ebay] ${setNo} fetch error:`, (err as Error).message)
    return { aggregates: [], listings: [] }
  }

  if (!res.ok) {
    console.warn(`[ebay] ${setNo} HTTP ${res.status}`)
    return { aggregates: [], listings: [] }
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    console.warn(`[ebay] ${setNo} JSON parse error`)
    return { aggregates: [], listings: [] }
  }

  const resp = (body as Record<string, unknown[]>)['findCompletedItemsResponse']?.[0] as
    | Record<string, unknown[]>
    | undefined
  const ack = resp?.['ack']?.[0]
  if (ack !== 'Success' && ack !== 'Warning') {
    console.warn(`[ebay] ${setNo} ack=${ack}`)
    return { aggregates: [], listings: [] }
  }

  const items = (resp?.['searchResult']?.[0] as Record<string, EbayItem[]> | undefined)?.['item'] ?? []
  if (items.length === 0) {
    console.warn(`[ebay] ${setNo} no results`)
    return { aggregates: [], listings: [] }
  }

  const newPrices: number[] = []
  const usedPrices: number[] = []
  const listings: EbayListing[] = []

  for (const item of items) {
    const state = item.sellingStatus?.[0]?.sellingState?.[0]
    if (state !== 'EndedWithSales') continue

    const priceRaw = item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__
    const price = priceRaw ? parseFloat(priceRaw) : NaN
    if (!isFinite(price) || price <= 0) continue

    const condId = item.condition?.[0]?.conditionId?.[0] ?? '3000'
    const cond: 'new' | 'used' = isNew(condId) ? 'new' : 'used'
    if (cond === 'new') newPrices.push(price)
    else usedPrices.push(price)

    const endTime = item.listingInfo?.[0]?.endTime?.[0] ?? null
    listings.push({
      setNo,
      condition: cond,
      sourceListingId: item.itemId?.[0] ?? null,
      price,
      saleDate: endTime ? endTime.slice(0, 10) : null,
      title: item.title?.[0] ?? null,
      listingUrl: item.viewItemURL?.[0] ?? null,
      currency: 'EUR',
    })
  }

  const result: EbayPriceData[] = []
  const currency = 'EUR'

  const newStats = stats(newPrices)
  if (newStats) {
    result.push({ setNo, condition: 'new', ...newStats, qtySold: newPrices.length, currency })
  }

  const usedStats = stats(usedPrices)
  if (usedStats) {
    result.push({ setNo, condition: 'used', ...usedStats, qtySold: usedPrices.length, currency })
  }

  return { aggregates: result, listings }
}
