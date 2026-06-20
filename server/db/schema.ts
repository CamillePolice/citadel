import { pgEnum, pgTable, text, uuid, numeric, integer, boolean, date, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const conditionItemEnum = pgEnum('condition_item', ['new_sealed', 'used'])
export const conditionPriceEnum = pgEnum('condition_price', ['new', 'used'])
export const completenessEnum = pgEnum('completeness', ['complete', 'incomplete', 'na'])
export const priceSourceEnum = pgEnum('price_source', ['bricklink', 'brickowl', 'avenuedelabrique', 'ebay'])
export const guideTypeEnum = pgEnum('guide_type', ['sold', 'stock', 'listing'])
export const retirementStatusEnum = pgEnum('retirement_status', ['available', 'retiring_soon', 'retired', 'unknown'])

export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  authentikUid: text('authentik_uid').unique().notNull(),
  email: text('email'),
  displayName: text('display_name'),
  currency: text('currency').default('EUR'),
  createdAt: text('created_at').default(sql`now()`),
})

export const catalogSets = pgTable('catalog_sets', {
  setNo: text('set_no').primaryKey(),
  name: text('name'),
  year: integer('year'),
  theme: text('theme'),
  subtheme: text('subtheme'),
  pieceCount: integer('piece_count'),
  minifigCount: integer('minifig_count'),
  retailPrice: numeric('retail_price'),
  imageUrl: text('image_url'),
  bricklinkUrl: text('bricklink_url'),
  retirementStatus: retirementStatusEnum('retirement_status').default('unknown'),
  retirementDate: date('retirement_date'),
  lastEnrichedAt: text('last_enriched_at'),
})

export const userItems = pgTable('user_items', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  setNo: text('set_no')
    .notNull()
    .references(() => catalogSets.setNo),
  condition: conditionItemEnum('condition'),
  quantity: integer('quantity').default(1),
  completeness: completenessEnum('completeness'),
  hasBox: boolean('has_box'),
  hasInstructions: boolean('has_instructions'),
  hasMinifigs: boolean('has_minifigs'),
  purchasePrice: numeric('purchase_price'),
  purchaseDate: date('purchase_date'),
  storageLocation: text('storage_location'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`now()`),
  updatedAt: text('updated_at').default(sql`now()`),
})

export const priceSnapshots = pgTable(
  'price_snapshots',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    setNo: text('set_no')
      .notNull()
      .references(() => catalogSets.setNo),
    condition: conditionPriceEnum('condition').notNull(),
    source: priceSourceEnum('source').notNull(),
    guideType: guideTypeEnum('guide_type').notNull(),
    currency: text('currency').default('EUR'),
    originalCurrency: text('original_currency'),
    fxRate: numeric('fx_rate'),
    avgPrice: numeric('avg_price'),
    minPrice: numeric('min_price'),
    maxPrice: numeric('max_price'),
    qtySold: numeric('qty_sold'),
    unitQuantity: integer('unit_quantity'),
    capturedAt: date('captured_at').notNull(),
  },
  (t) => ({
    uniqueSnapshot: uniqueIndex('price_snapshots_unique').on(t.setNo, t.condition, t.source, t.guideType, t.capturedAt),
  }),
)

export const priceListings = pgTable(
  'price_listings',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    setNo: text('set_no')
      .notNull()
      .references(() => catalogSets.setNo),
    condition: conditionPriceEnum('condition').notNull(),
    source: priceSourceEnum('source').notNull(),
    sourceListingId: text('source_listing_id'),
    price: numeric('price').notNull(),
    currency: text('currency').default('EUR'),
    saleDate: date('sale_date'),
    listingUrl: text('listing_url'),
    title: text('title'),
    capturedAt: date('captured_at').notNull(),
  },
  (t) => ({
    uniqueListing: uniqueIndex('price_listings_unique').on(t.setNo, t.source, t.condition, t.sourceListingId),
    setSourceIdx: index('price_listings_set_source_idx').on(t.setNo, t.source),
  }),
)

export const workerRuns = pgTable('worker_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at'),
  ok: integer('ok'),
  failed: integer('failed'),
  errors: text('errors'),
})

export const portfolioSnapshots = pgTable(
  'portfolio_snapshots',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    capturedAt: date('captured_at').notNull(),
    totalValue: numeric('total_value'),
    totalCost: numeric('total_cost'),
    numItems: integer('num_items'),
  },
  (t) => ({
    uniqueUserDate: uniqueIndex('portfolio_snapshots_unique').on(t.userId, t.capturedAt),
  }),
)
