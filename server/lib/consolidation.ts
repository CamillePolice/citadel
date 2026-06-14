import type { PriceGuideData, BricklinkListing } from './bricklink'
import type { BrickOwlPriceData } from './brickowl'
import type { EbayPriceData, EbayResult, EbayListing } from './ebay'

export interface ConsolidatedPrice {
  setNo: string
  condition: 'new' | 'used'
  source: 'bricklink' | 'brickowl' | 'avenuedelabrique' | 'ebay'
  guideType: 'sold' | 'listing'
  currency: 'EUR'
  originalCurrency: string | null
  fxRate: number | null
  avgPrice: number | null
  minPrice: number | null
  maxPrice: number | null
  qtySold: number | null
  unitQuantity: number | null
  degraded: boolean
}

interface ConsolidateInput {
  setNo: string
  bricklinkNew: PriceGuideData | null
  bricklinkUsed: PriceGuideData | null
  brickowl: BrickOwlPriceData | null
  ebay: EbayResult
  gbpToEur: number
}

function fromBricklink(d: PriceGuideData): ConsolidatedPrice {
  return {
    setNo: d.setNo,
    condition: d.condition,
    source: 'bricklink',
    guideType: 'sold',
    currency: 'EUR',
    originalCurrency: d.currency,
    fxRate: null,
    avgPrice: d.avgPrice,
    minPrice: d.minPrice,
    maxPrice: d.maxPrice,
    qtySold: d.totalQuantity,
    unitQuantity: d.unitQuantity,
    degraded: false,
  }
}

function fromBrickowl(setNo: string, owl: BrickOwlPriceData, gbpToEur: number): ConsolidatedPrice {
  const eur = Math.round(owl.cheapestGbp * gbpToEur * 100) / 100
  return {
    setNo,
    condition: 'used',
    source: 'brickowl',
    guideType: 'listing',
    currency: 'EUR',
    originalCurrency: 'GBP',
    fxRate: gbpToEur,
    avgPrice: eur,
    minPrice: eur,
    maxPrice: eur,
    qtySold: null,
    unitQuantity: null,
    degraded: true,
  }
}

function hasUsablePrice(d: PriceGuideData | null): d is PriceGuideData {
  return d !== null && d.avgPrice !== null && d.avgPrice > 0
}

function fromEbay(d: EbayPriceData): ConsolidatedPrice {
  return {
    setNo: d.setNo,
    condition: d.condition,
    source: 'ebay',
    guideType: 'sold',
    currency: 'EUR',
    originalCurrency: 'EUR',
    fxRate: null,
    avgPrice: d.avgPrice,
    minPrice: d.minPrice,
    maxPrice: d.maxPrice,
    qtySold: d.qtySold,
    unitQuantity: d.qtySold,
    degraded: false,
  }
}

export function consolidate(input: ConsolidateInput): ConsolidatedPrice[] {
  const out: ConsolidatedPrice[] = []

  if (hasUsablePrice(input.bricklinkNew)) out.push(fromBricklink(input.bricklinkNew))
  if (hasUsablePrice(input.bricklinkUsed)) out.push(fromBricklink(input.bricklinkUsed))

  for (const e of input.ebay.aggregates) {
    if (e.avgPrice > 0) out.push(fromEbay(e))
  }

  const haveUsed = out.some((p) => p.condition === 'used')
  if (!haveUsed && input.brickowl) {
    out.push(fromBrickowl(input.setNo, input.brickowl, input.gbpToEur))
  }

  return out
}

export interface ConsolidatedListing {
  setNo: string
  condition: 'new' | 'used'
  source: 'bricklink' | 'ebay'
  sourceListingId: string | null
  price: number
  currency: 'EUR'
  saleDate: string | null
  listingUrl: string | null
  title: string | null
}

interface ListingsInput {
  setNo: string
  bricklink: BricklinkListing[]
  ebay: EbayListing[]
}

export function consolidateListings(input: ListingsInput): ConsolidatedListing[] {
  const out: ConsolidatedListing[] = []
  for (const b of input.bricklink) {
    if (b.price > 0) {
      out.push({
        setNo: input.setNo,
        condition: b.condition,
        source: 'bricklink',
        sourceListingId: null,
        price: b.price,
        currency: 'EUR',
        saleDate: b.saleDate,
        listingUrl: null,
        title: null,
      })
    }
  }
  for (const e of input.ebay) {
    if (e.price > 0) {
      out.push({
        setNo: input.setNo,
        condition: e.condition,
        source: 'ebay',
        sourceListingId: e.sourceListingId,
        price: e.price,
        currency: 'EUR',
        saleDate: e.saleDate,
        listingUrl: e.listingUrl,
        title: e.title,
      })
    }
  }
  return out
}
