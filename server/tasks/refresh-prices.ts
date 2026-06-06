import cron from 'node-cron'
import { sql, eq } from 'drizzle-orm'
import { db } from '../db'
import { catalogSets, priceSnapshots } from '../db/schema'
import { validateWorkerEnv } from '../utils/env'
import { fetchBricklinkPrice } from '../lib/bricklink'
import { fetchBrickOwlPrice } from '../lib/brickowl'
import { fetchRebrickableSet } from '../lib/rebrickable'
import { getGbpToEurRate, resetFxCache } from '../lib/fx'
import { consolidate, type ConsolidatedPrice } from '../lib/consolidation'

const schedule = process.env.CRON_SCHEDULE ?? '0 4 * * *'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

async function getOwnedSetNos(): Promise<string[]> {
  const rows = await db.execute<{ set_no: string }>(sql`SELECT DISTINCT set_no FROM user_items`)
  return Array.from(rows).map((r) => r.set_no)
}

async function ensureCatalogInDb(setNo: string): Promise<void> {
  const existing = await db
    .select({ setNo: catalogSets.setNo })
    .from(catalogSets)
    .where(eq(catalogSets.setNo, setNo))
    .limit(1)

  if (existing.length > 0) return

  const data = await fetchRebrickableSet(setNo)
  if (!data) {
    console.warn(`[worker] ${setNo}: no Rebrickable data, inserting stub catalog row`)
    await db.insert(catalogSets).values({ setNo }).onConflictDoNothing()
    return
  }

  await db
    .insert(catalogSets)
    .values({
      setNo: data.setNo,
      name: data.name,
      year: data.year,
      theme: data.theme != null ? String(data.theme) : null,
      pieceCount: data.numParts,
      imageUrl: data.imageUrl,
    })
    .onConflictDoNothing()
}

async function upsertPriceSnapshot(p: ConsolidatedPrice, capturedAt: string): Promise<void> {
  await db
    .insert(priceSnapshots)
    .values({
      setNo: p.setNo,
      condition: p.condition,
      source: p.source,
      guideType: p.guideType,
      currency: p.currency,
      originalCurrency: p.originalCurrency,
      fxRate: p.fxRate != null ? String(p.fxRate) : null,
      avgPrice: p.avgPrice != null ? String(p.avgPrice) : null,
      minPrice: p.minPrice != null ? String(p.minPrice) : null,
      maxPrice: p.maxPrice != null ? String(p.maxPrice) : null,
      qtySold: p.qtySold != null ? String(p.qtySold) : null,
      unitQuantity: p.unitQuantity,
      capturedAt,
    })
    .onConflictDoUpdate({
      target: [
        priceSnapshots.setNo,
        priceSnapshots.condition,
        priceSnapshots.source,
        priceSnapshots.guideType,
        priceSnapshots.capturedAt,
      ],
      set: {
        currency: p.currency,
        originalCurrency: p.originalCurrency,
        fxRate: p.fxRate != null ? String(p.fxRate) : null,
        avgPrice: p.avgPrice != null ? String(p.avgPrice) : null,
        minPrice: p.minPrice != null ? String(p.minPrice) : null,
        maxPrice: p.maxPrice != null ? String(p.maxPrice) : null,
        qtySold: p.qtySold != null ? String(p.qtySold) : null,
        unitQuantity: p.unitQuantity,
      },
    })
}

async function recomputePortfolios(capturedAt: string): Promise<void> {
  await db.execute(sql`
    INSERT INTO portfolio_snapshots (user_id, captured_at, total_value, total_cost, num_items)
    SELECT
      ui.user_id,
      ${capturedAt}::date AS captured_at,
      COALESCE(SUM(ps.avg_price * ui.quantity), 0) AS total_value,
      COALESCE(SUM(ui.purchase_price * ui.quantity), 0) AS total_cost,
      COALESCE(SUM(ui.quantity), 0) AS num_items
    FROM user_items ui
    LEFT JOIN LATERAL (
      SELECT p.avg_price
      FROM price_snapshots p
      WHERE p.set_no = ui.set_no
        AND p.condition = (CASE WHEN ui.condition = 'new_sealed' THEN 'new' ELSE 'used' END)::condition_price
        AND p.avg_price IS NOT NULL
      ORDER BY p.captured_at DESC, (p.source = 'bricklink') DESC
      LIMIT 1
    ) ps ON TRUE
    GROUP BY ui.user_id
    ON CONFLICT (user_id, captured_at)
    DO UPDATE SET
      total_value = EXCLUDED.total_value,
      total_cost = EXCLUDED.total_cost,
      num_items = EXCLUDED.num_items
  `)
}

export async function runRefresh(): Promise<void> {
  const startedAt = Date.now()
  console.log('[worker] refresh-prices: run start')
  validateWorkerEnv()
  resetFxCache()

  const capturedAt = todayIso()
  const setNos = await getOwnedSetNos()
  console.log(`[worker] ${setNos.length} owned sets to refresh`)

  if (setNos.length === 0) {
    console.log('[worker] no owned sets, nothing to do')
    return
  }

  const gbpToEur = await getGbpToEurRate()
  let ok = 0
  let failed = 0

  for (const setNo of setNos) {
    try {
      await ensureCatalogInDb(setNo)

      const [blNew, blUsed, owl] = await Promise.all([
        fetchBricklinkPrice(setNo, 'new'),
        fetchBricklinkPrice(setNo, 'used'),
        fetchBrickOwlPrice(setNo),
      ])

      const prices = consolidate({
        setNo,
        bricklinkNew: blNew,
        bricklinkUsed: blUsed,
        brickowl: owl,
        gbpToEur,
      })

      if (prices.length === 0) {
        console.warn(`[worker] ${setNo}: no usable price from any source`)
        failed++
        continue
      }

      for (const p of prices) {
        await upsertPriceSnapshot(p, capturedAt)
      }
      ok++
    } catch (err) {
      console.error(`[worker] ${setNo} failed:`, (err as Error).message)
      failed++
    }
  }

  try {
    await recomputePortfolios(capturedAt)
    console.log('[worker] portfolio snapshots recomputed')
  } catch (err) {
    console.error('[worker] portfolio recompute failed:', (err as Error).message)
  }

  const secs = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`[worker] refresh-prices: done in ${secs}s (ok=${ok} failed=${failed})`)
}

console.log(`[worker] refresh-prices scheduled: ${schedule}`)
cron.schedule(schedule, () => {
  runRefresh().catch((err) => console.error('[worker] scheduled run crashed:', err))
})

const isMain = process.argv[1]?.endsWith('refresh-prices.ts')
if (isMain) {
  runRefresh().catch((err) => {
    console.error('[worker] manual run crashed:', err)
    process.exitCode = 1
  })
}
