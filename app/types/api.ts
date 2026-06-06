export type ConditionItem = 'new_sealed' | 'used'
export type Completeness = 'complete' | 'incomplete' | 'na'
export type PriceSource = 'bricklink' | 'brickowl'
export type RetirementStatus = 'available' | 'retiring_soon' | 'retired' | 'unknown'

export interface User {
  id: string
  authentikUid: string
  email: string | null
  displayName: string | null
  isAdmin: boolean
}

export interface Item {
  id: string
  setNo: string
  name: string | null
  theme: string | null
  imageUrl: string | null
  condition: ConditionItem | null
  quantity: number
  completeness: Completeness | null
  purchasePrice: number | null
  purchaseDate: string | null
  storageLocation: string | null
  notes: string | null
  currentValue: number
  pnl: number
  pnlPct: number
  priceSource: PriceSource
  degraded: boolean
}

export interface ThemeBucket {
  theme: string
  value: number
  count: number
}

export interface ConditionBucket {
  condition: ConditionItem
  value: number
  count: number
}

export interface Dashboard {
  totalValue: number
  totalCost: number
  pnl: number
  roi: number
  numItems: number
  numPieces: number
  avgValuePerItem: number
  byTheme: ThemeBucket[]
  byCondition: ConditionBucket[]
  topPerformers: Item[]
  flops: Item[]
}

export interface PortfolioHistoryPoint {
  date: string
  totalValue: number
  totalCost: number
}

export interface CatalogSet {
  setNo: string
  name: string | null
  year: number | null
  theme: string | null
  subtheme: string | null
  pieceCount: number | null
  minifigCount: number | null
  retailPrice: number | null
  imageUrl: string | null
  retirementStatus: RetirementStatus
}

export interface PriceHistoryPoint {
  capturedAt: string
  condition: 'new' | 'used'
  source: PriceSource
  avgPrice: number | null
  minPrice: number | null
  maxPrice: number | null
}

export interface CreateItemPayload {
  setNo: string
  condition: ConditionItem
  quantity: number
  completeness: Completeness
  hasBox?: boolean
  hasInstructions?: boolean
  hasMinifigs?: boolean
  purchasePrice: number | null
  purchaseDate: string | null
  storageLocation: string | null
  notes: string | null
}

export type UpdateItemPayload = Partial<Omit<CreateItemPayload, 'setNo'>>
