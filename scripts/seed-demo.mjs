/**
 * Seed script — demo data Star Wars pour Citadel POC
 * Usage: node scripts/seed-demo.mjs
 */
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://citadel:change-me-strong@127.0.0.1:5434/citadel'
const DEV_UID = process.env.DEV_AUTHENTIK_UID ?? 'dev-user-1'

const sql = postgres(DATABASE_URL)

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

const CATALOG = [
  { set_no: '75192-1', name: 'Faucon Millénium',              theme: 'Star Wars', year: 2017, piece_count: 7541,  retail_price: '849.99', retirement_status: 'retired' },
  { set_no: '75313-1', name: 'AT-AT',                         theme: 'Star Wars', year: 2021, piece_count: 6785,  retail_price: '849.99', retirement_status: 'retired' },
  { set_no: '75252-1', name: 'Destroyer Stellaire Impérial',  theme: 'Star Wars', year: 2019, piece_count: 4784,  retail_price: '699.99', retirement_status: 'retired' },
  { set_no: '75331-1', name: 'Le Razor Crest',                theme: 'Star Wars', year: 2022, piece_count: 6187,  retail_price: '599.99', retirement_status: 'retired' },
  { set_no: '75309-1', name: 'Republic Gunship',              theme: 'Star Wars', year: 2021, piece_count: 3292,  retail_price: '349.99', retirement_status: 'retired' },
  { set_no: '75275-1', name: 'Chasseur A-Wing',               theme: 'Star Wars', year: 2019, piece_count: 1673,  retail_price: '199.99', retirement_status: 'retired' },
  { set_no: '75367-1', name: 'Croiseur d\'attaque Venator',   theme: 'Star Wars', year: 2023, piece_count: 5374,  retail_price: '499.99', retirement_status: 'retiring_soon' },
]

// ─── User items ───────────────────────────────────────────────────────────────

const ITEMS = [
  { set_no: '75192-1', condition: 'new_sealed', quantity: 1, completeness: 'complete', has_box: true,  has_instructions: true,  purchase_price: '749.00',  purchase_date: '2022-11-28', storage_location: 'Cave box A1', notes: 'Acheté pendant les soldes Black Friday' },
  { set_no: '75313-1', condition: 'new_sealed', quantity: 1, completeness: 'complete', has_box: true,  has_instructions: true,  purchase_price: '779.99',  purchase_date: '2022-01-20', storage_location: 'Cave box A2', notes: 'Set phare UCS 2021' },
  { set_no: '75252-1', condition: 'new_sealed', quantity: 2, completeness: 'complete', has_box: true,  has_instructions: true,  purchase_price: '549.99',  purchase_date: '2021-12-15', storage_location: 'Cave box B1', notes: 'x2 stratégie long terme — stock avant retraite' },
  { set_no: '75331-1', condition: 'used',       quantity: 1, completeness: 'complete', has_box: false, has_instructions: true,  purchase_price: '389.99',  purchase_date: '2023-09-14', storage_location: 'Cave box A3', notes: 'Occasion BrickLink — sans boîte, complet, excellent état' },
  { set_no: '75309-1', condition: 'new_sealed', quantity: 2, completeness: 'complete', has_box: true,  has_instructions: true,  purchase_price: '299.99',  purchase_date: '2022-06-10', storage_location: 'Cave box B2', notes: 'x2 Republic Gunship — set Clone Wars iconique' },
  { set_no: '75275-1', condition: 'used',       quantity: 1, completeness: 'complete', has_box: false, has_instructions: false, purchase_price: '119.99',  purchase_date: '2023-03-22', storage_location: 'Salon étagère', notes: 'Occasion — A-Wing monté et démonté, pièces complètes' },
  { set_no: '75367-1', condition: 'new_sealed', quantity: 1, completeness: 'complete', has_box: true,  has_instructions: true,  purchase_price: '449.99',  purchase_date: '2024-10-15', storage_location: null, notes: 'Venator UCS — achat à la sortie, retraite annoncée 2025' },
]

// ─── Prix BrickLink (historique 30 jours) — tous sets retirés en forte hausse ─

const PRICE_HISTORY = {
  '75192-1': {
    new:  [850, 875, 890, 912],
    used: [590, 605, 618, 632],
    adlb: [919.99, 935.00, 949.99, 965.00],
  },
  '75313-1': {
    new:  [890, 912, 928, 948],
    used: [640, 655, 670, 685],
    adlb: [949.99, 969.99, 985.00, 999.99],
  },
  '75252-1': {
    new:  [720, 738, 752, 768],
    used: [495, 508, 520, 534],
    adlb: [775.00, 789.99, 799.99, 815.00],
  },
  '75331-1': {
    new:  [620, 638, 652, 668],
    used: [430, 442, 454, 465],
    adlb: [689.99, 709.99, 729.99, 749.99],
  },
  '75309-1': {
    new:  [385, 398, 412, 425],
    used: [268, 278, 288, 296],
    adlb: [439.99, 449.99, 459.99, 479.99],
  },
  '75275-1': {
    new:  [235, 242, 249, 256],
    used: [165, 170, 175, 180],
    adlb: [265.00, 275.00, 279.99, 285.00],
  },
  '75367-1': {
    new:  [485, 492, 498, 505],
    used: [380, 385, 390, 396],
    adlb: [499.99, 499.99, 489.99, 479.99],
  },
}

const SNAPSHOT_DATES = [daysAgo(30), daysAgo(14), daysAgo(7), daysAgo(0)]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Looking up dev user...')
  const [user] = await sql`SELECT id FROM users WHERE authentik_uid = ${DEV_UID}`
  if (!user) {
    console.error(`❌ User '${DEV_UID}' not found. Visit /dashboard once to provision.`)
    process.exit(1)
  }
  const userId = user.id
  console.log(`✓ User: ${userId}`)

  console.log('\n🧹 Clearing existing demo data...')
  await sql`DELETE FROM portfolio_snapshots WHERE user_id = ${userId}`
  await sql`DELETE FROM user_items WHERE user_id = ${userId}`
  await sql`DELETE FROM price_snapshots`
  await sql`DELETE FROM catalog_sets`
  console.log('✓ Cleared')

  console.log('\n📦 Inserting catalog sets...')
  for (const c of CATALOG) {
    await sql`
      INSERT INTO catalog_sets (set_no, name, theme, year, piece_count, retail_price, retirement_status)
      VALUES (${c.set_no}, ${c.name}, ${c.theme}, ${c.year}, ${c.piece_count}, ${c.retail_price}, ${c.retirement_status})
      ON CONFLICT DO NOTHING
    `
  }
  console.log(`✓ ${CATALOG.length} sets`)

  console.log('\n🛒 Inserting user items...')
  for (const item of ITEMS) {
    await sql`
      INSERT INTO user_items (user_id, set_no, condition, quantity, completeness, has_box, has_instructions, has_minifigs, purchase_price, purchase_date, storage_location, notes)
      VALUES (
        ${userId}, ${item.set_no}, ${item.condition}, ${item.quantity},
        ${item.completeness}, ${item.has_box}, ${item.has_instructions}, true,
        ${item.purchase_price}, ${item.purchase_date},
        ${item.storage_location}, ${item.notes}
      )
    `
  }
  console.log(`✓ ${ITEMS.length} items`)

  console.log('\n💰 Inserting price snapshots...')
  let snapCount = 0
  for (const [setNo, prices] of Object.entries(PRICE_HISTORY)) {
    for (let i = 0; i < SNAPSHOT_DATES.length; i++) {
      const date = SNAPSHOT_DATES[i]

      if (prices.new[i] != null) {
        await sql`
          INSERT INTO price_snapshots (set_no, condition, source, guide_type, currency, avg_price, min_price, max_price, qty_sold, captured_at)
          VALUES (${setNo},'new','bricklink','sold','EUR',
            ${prices.new[i]}, ${(prices.new[i] * 0.78).toFixed(2)}, ${(prices.new[i] * 1.28).toFixed(2)},
            ${Math.floor(Math.random() * 25 + 8)}, ${date})
          ON CONFLICT DO NOTHING
        `
        snapCount++
      }

      if (prices.used[i] != null) {
        await sql`
          INSERT INTO price_snapshots (set_no, condition, source, guide_type, currency, avg_price, min_price, max_price, qty_sold, captured_at)
          VALUES (${setNo},'used','bricklink','sold','EUR',
            ${prices.used[i]}, ${(prices.used[i] * 0.72).toFixed(2)}, ${(prices.used[i] * 1.28).toFixed(2)},
            ${Math.floor(Math.random() * 35 + 12)}, ${date})
          ON CONFLICT DO NOTHING
        `
        snapCount++
      }

      if (prices.adlb && prices.adlb[i] != null) {
        await sql`
          INSERT INTO price_snapshots (set_no, condition, source, guide_type, currency, avg_price, min_price, max_price, captured_at)
          VALUES (${setNo},'new','avenuedelabrique','listing','EUR',
            ${prices.adlb[i]}, ${prices.adlb[i]}, ${prices.adlb[i]}, ${date})
          ON CONFLICT DO NOTHING
        `
        snapCount++
      }
    }
  }
  console.log(`✓ ${snapCount} snapshots`)

  console.log('\n📈 Computing portfolio snapshots...')
  for (const date of SNAPSHOT_DATES) {
    await sql`
      INSERT INTO portfolio_snapshots (user_id, captured_at, total_value, total_cost, num_items)
      SELECT
        ui.user_id,
        ${date}::date,
        COALESCE(SUM(ps.avg_price * ui.quantity), 0),
        COALESCE(SUM(ui.purchase_price::numeric * ui.quantity), 0),
        COUNT(*)
      FROM user_items ui
      LEFT JOIN LATERAL (
        SELECT p.avg_price FROM price_snapshots p
        WHERE p.set_no = ui.set_no
          AND p.condition = (CASE WHEN ui.condition = 'new_sealed' THEN 'new' ELSE 'used' END)::condition_price
          AND p.source = 'bricklink'
          AND p.captured_at <= ${date}::date
          AND p.avg_price IS NOT NULL
        ORDER BY p.captured_at DESC LIMIT 1
      ) ps ON TRUE
      WHERE ui.user_id = ${userId}
      GROUP BY ui.user_id
      ON CONFLICT (user_id, captured_at) DO UPDATE SET
        total_value = EXCLUDED.total_value,
        total_cost  = EXCLUDED.total_cost,
        num_items   = EXCLUDED.num_items
    `
  }
  console.log(`✓ ${SNAPSHOT_DATES.length} portfolio snapshots`)

  console.log('\n✅ Demo seed complete!\n')
  const summary = await sql`
    SELECT
      (SELECT COUNT(*) FROM user_items WHERE user_id = ${userId}) AS items,
      (SELECT COUNT(*) FROM price_snapshots) AS snapshots,
      (SELECT SUM(purchase_price::numeric * quantity) FROM user_items WHERE user_id = ${userId}) AS total_cost,
      (SELECT SUM(ps.avg_price * ui.quantity)
       FROM user_items ui
       LEFT JOIN LATERAL (
         SELECT p.avg_price FROM price_snapshots p
         WHERE p.set_no = ui.set_no
           AND p.condition = (CASE WHEN ui.condition = 'new_sealed' THEN 'new' ELSE 'used' END)::condition_price
           AND p.source = 'bricklink'
         ORDER BY p.captured_at DESC LIMIT 1
       ) ps ON TRUE
       WHERE ui.user_id = ${userId}
      ) AS total_value
  `
  const cost = Number(summary[0].total_cost).toFixed(2)
  const value = Number(summary[0].total_value).toFixed(2)
  const roi = ((Number(value) - Number(cost)) / Number(cost) * 100).toFixed(1)
  console.log(`   ${summary[0].items} sets · ${summary[0].snapshots} snapshots`)
  console.log(`   coût ${cost}€ → valeur ${value}€ → ROI +${roi}%`)

  await sql.end()
}

main().catch(err => { console.error(err); process.exit(1) })
