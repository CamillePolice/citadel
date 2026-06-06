import ExcelJS from 'exceljs'
import { sql } from 'drizzle-orm'
import { db } from '../db'

type Num = string | number | null | undefined

function num(v: Num): number {
  if (v === null || v === undefined || v === '') return 0
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

const EUR = '#,##0.00 €'
const PCT = '0.00%'
const DATE = 'DD/MM/YYYY'

interface SealedRow {
  set_no: string
  name: string | null
  theme: string | null
  year: number | null
  piece_count: number | null
  quantity: number | null
  purchase_price: string | null
  purchase_date: string | null
  storage_location: string | null
  avg_price: string | null
  min_price: string | null
  max_price: string | null
}

interface UsedRow {
  set_no: string
  name: string | null
  completeness: string | null
  has_box: boolean | null
  has_instructions: boolean | null
  has_minifigs: boolean | null
  quantity: number | null
  purchase_price: string | null
  avg_price: string | null
  min_price: string | null
  max_price: string | null
}

interface HistoryRow {
  captured_at: string
  set_no: string
  new_price: string | null
  used_price: string | null
}

async function fetchSealed(userId: string): Promise<SealedRow[]> {
  const res = await db.execute(sql`
    SELECT
      ui.set_no,
      cs.name,
      cs.theme,
      cs.year,
      cs.piece_count,
      ui.quantity,
      ui.purchase_price,
      ui.purchase_date,
      ui.storage_location,
      ps.avg_price,
      ps.min_price,
      ps.max_price
    FROM user_items ui
    JOIN catalog_sets cs ON cs.set_no = ui.set_no
    LEFT JOIN LATERAL (
      SELECT avg_price, min_price, max_price
      FROM price_snapshots p
      WHERE p.set_no = ui.set_no
        AND p.condition = 'new'
        AND p.source = 'bricklink'
        AND p.guide_type = 'sold'
      ORDER BY p.captured_at DESC
      LIMIT 1
    ) ps ON true
    WHERE ui.user_id = ${userId}
      AND ui.condition = 'new_sealed'
    ORDER BY ui.set_no ASC
  `)
  return res as unknown as SealedRow[]
}

async function fetchUsed(userId: string): Promise<UsedRow[]> {
  const res = await db.execute(sql`
    SELECT
      ui.set_no,
      cs.name,
      ui.completeness,
      ui.has_box,
      ui.has_instructions,
      ui.has_minifigs,
      ui.quantity,
      ui.purchase_price,
      ps.avg_price,
      ps.min_price,
      ps.max_price
    FROM user_items ui
    JOIN catalog_sets cs ON cs.set_no = ui.set_no
    LEFT JOIN LATERAL (
      SELECT avg_price, min_price, max_price
      FROM price_snapshots p
      WHERE p.set_no = ui.set_no
        AND p.condition = 'used'
        AND p.source = 'bricklink'
        AND p.guide_type = 'sold'
      ORDER BY p.captured_at DESC
      LIMIT 1
    ) ps ON true
    WHERE ui.user_id = ${userId}
      AND ui.condition = 'used'
    ORDER BY ui.set_no ASC
  `)
  return res as unknown as UsedRow[]
}

async function fetchHistory(userId: string): Promise<HistoryRow[]> {
  const res = await db.execute(sql`
    SELECT
      p.captured_at,
      p.set_no,
      MAX(p.avg_price) FILTER (WHERE p.condition = 'new') AS new_price,
      MAX(p.avg_price) FILTER (WHERE p.condition = 'used') AS used_price
    FROM price_snapshots p
    WHERE p.source = 'bricklink'
      AND p.guide_type = 'sold'
      AND p.set_no IN (
        SELECT DISTINCT set_no FROM user_items WHERE user_id = ${userId}
      )
    GROUP BY p.captured_at, p.set_no
    ORDER BY p.captured_at ASC, p.set_no ASC
  `)
  return res as unknown as HistoryRow[]
}

function styleHeader(row: ExcelJS.Row): void {
  row.font = { bold: true }
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
  })
}

function applyFormats(ws: ExcelJS.Worksheet, formats: Record<number, string>): void {
  for (const [colIdx, fmt] of Object.entries(formats)) {
    ws.getColumn(Number(colIdx)).numFmt = fmt
  }
}

export async function buildWorkbook(userId: string): Promise<Buffer> {
  const [sealed, used, history] = await Promise.all([fetchSealed(userId), fetchUsed(userId), fetchHistory(userId)])

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Citadel'
  wb.created = new Date()

  const ws1 = wb.addWorksheet('Scellé-Neuf', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws1.columns = [
    { header: 'N° set', key: 'setNo', width: 12 },
    { header: 'Nom', key: 'name', width: 34 },
    { header: 'Thème', key: 'theme', width: 16 },
    { header: 'Année', key: 'year', width: 8 },
    { header: 'Pièces', key: 'pieces', width: 9 },
    { header: 'Qté', key: 'qty', width: 6 },
    { header: "Prix d'achat (€)", key: 'cost', width: 15 },
    { header: "Date d'achat", key: 'purchaseDate', width: 13 },
    { header: 'Valeur neuf moy (€)', key: 'avg', width: 18 },
    { header: 'Min (€)', key: 'min', width: 11 },
    { header: 'Max (€)', key: 'max', width: 11 },
    { header: 'Emplacement', key: 'location', width: 16 },
    { header: 'Plus-value (€)', key: 'pnl', width: 14 },
    { header: 'Plus-value (%)', key: 'pnlPct', width: 14 },
  ]
  for (const r of sealed) {
    const qty = num(r.quantity) || 1
    const value = num(r.avg_price) * qty
    const cost = num(r.purchase_price) * qty
    const pnl = value - cost
    const pnlPct = cost > 0 ? pnl / cost : 0
    ws1.addRow({
      setNo: r.set_no,
      name: r.name ?? '',
      theme: r.theme ?? '',
      year: r.year ?? null,
      pieces: r.piece_count ?? null,
      qty,
      cost: num(r.purchase_price),
      purchaseDate: r.purchase_date ? new Date(r.purchase_date) : null,
      avg: num(r.avg_price),
      min: num(r.min_price),
      max: num(r.max_price),
      location: r.storage_location ?? '',
      pnl,
      pnlPct,
    })
  }
  styleHeader(ws1.getRow(1))
  applyFormats(ws1, { 7: EUR, 8: DATE, 9: EUR, 10: EUR, 11: EUR, 13: EUR, 14: PCT })

  const ws2 = wb.addWorksheet('Occasion', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws2.columns = [
    { header: 'N° set', key: 'setNo', width: 12 },
    { header: 'Nom', key: 'name', width: 34 },
    { header: 'Complétude', key: 'completeness', width: 13 },
    { header: 'Boîte', key: 'box', width: 8 },
    { header: 'Notice', key: 'instructions', width: 8 },
    { header: 'Minifigs', key: 'minifigs', width: 9 },
    { header: 'Qté', key: 'qty', width: 6 },
    { header: "Prix d'achat (€)", key: 'cost', width: 15 },
    { header: 'Valeur occase moy (€)', key: 'avg', width: 20 },
    { header: 'Min (€)', key: 'min', width: 11 },
    { header: 'Max (€)', key: 'max', width: 11 },
    { header: 'Plus-value (€)', key: 'pnl', width: 14 },
    { header: 'Plus-value (%)', key: 'pnlPct', width: 14 },
  ]
  const yn = (b: boolean | null) => (b === true ? 'Oui' : b === false ? 'Non' : '')
  for (const r of used) {
    const qty = num(r.quantity) || 1
    const value = num(r.avg_price) * qty
    const cost = num(r.purchase_price) * qty
    const pnl = value - cost
    const pnlPct = cost > 0 ? pnl / cost : 0
    ws2.addRow({
      setNo: r.set_no,
      name: r.name ?? '',
      completeness: r.completeness ?? '',
      box: yn(r.has_box),
      instructions: yn(r.has_instructions),
      minifigs: yn(r.has_minifigs),
      qty,
      cost: num(r.purchase_price),
      avg: num(r.avg_price),
      min: num(r.min_price),
      max: num(r.max_price),
      pnl,
      pnlPct,
    })
  }
  styleHeader(ws2.getRow(1))
  applyFormats(ws2, { 8: EUR, 9: EUR, 10: EUR, 11: EUR, 12: EUR, 13: PCT })

  const ws3 = wb.addWorksheet('Historique', { views: [{ state: 'frozen', ySplit: 1 }] })
  ws3.columns = [
    { header: 'Date', key: 'date', width: 13 },
    { header: 'N° set', key: 'setNo', width: 12 },
    { header: 'Prix neuf (€)', key: 'new', width: 14 },
    { header: 'Prix occasion (€)', key: 'used', width: 16 },
  ]
  for (const r of history) {
    ws3.addRow({
      date: r.captured_at ? new Date(r.captured_at) : null,
      setNo: r.set_no,
      new: r.new_price === null ? null : num(r.new_price),
      used: r.used_price === null ? null : num(r.used_price),
    })
  }
  styleHeader(ws3.getRow(1))
  applyFormats(ws3, { 1: DATE, 3: EUR, 4: EUR })

  const ws4 = wb.addWorksheet('Synthèse', { views: [{ state: 'frozen', ySplit: 1 }] })

  const lines = [
    ...sealed.map((r) => {
      const qty = num(r.quantity) || 1
      const value = num(r.avg_price) * qty
      const cost = num(r.purchase_price) * qty
      return { name: r.name ?? r.set_no, value, cost, pieces: num(r.piece_count) * qty }
    }),
    ...used.map((r) => {
      const qty = num(r.quantity) || 1
      const value = num(r.avg_price) * qty
      const cost = num(r.purchase_price) * qty
      return { name: r.name ?? r.set_no, value, cost, pieces: 0 }
    }),
  ]

  const totalValue = lines.reduce((s, l) => s + l.value, 0)
  const totalCost = lines.reduce((s, l) => s + l.cost, 0)
  const pnl = totalValue - totalCost
  const pnlPct = totalCost > 0 ? pnl / totalCost : 0
  const roi = totalCost > 0 ? totalValue / totalCost : 0
  const nbSets = sealed.length + used.length
  const nbPieces = lines.reduce((s, l) => s + l.pieces, 0)
  const avgPerSet = nbSets > 0 ? totalValue / nbSets : 0

  const ranked = lines
    .map((l) => ({ name: l.name, pct: l.cost > 0 ? (l.value - l.cost) / l.cost : 0 }))
    .sort((a, b) => b.pct - a.pct)
  const top5 = ranked.slice(0, 5)
  const flop5 = ranked.slice(-5).reverse()

  ws4.getColumn(1).width = 26
  ws4.getColumn(2).width = 18

  const kpiHeader = ws4.addRow(['Indicateur', 'Valeur'])
  styleHeader(kpiHeader)

  const addKpi = (label: string, value: number, fmt: string) => {
    const row = ws4.addRow([label, value])
    row.getCell(2).numFmt = fmt
  }
  addKpi('Valeur totale (€)', totalValue, EUR)
  addKpi('Coût total (€)', totalCost, EUR)
  addKpi('Plus-value (€)', pnl, EUR)
  addKpi('Plus-value (%)', pnlPct, PCT)
  addKpi('ROI', roi, '0.00')
  addKpi('Nb sets', nbSets, '0')
  addKpi('Nb pièces', nbPieces, '0')
  addKpi('Valeur moy / set (€)', avgPerSet, EUR)

  ws4.addRow([])
  const topHeader = ws4.addRow(['Top 5 performers', 'Plus-value (%)'])
  styleHeader(topHeader)
  for (const t of top5) {
    const row = ws4.addRow([t.name, t.pct])
    row.getCell(2).numFmt = PCT
  }

  ws4.addRow([])
  const flopHeader = ws4.addRow(['Top 5 flops', 'Plus-value (%)'])
  styleHeader(flopHeader)
  for (const f of flop5) {
    const row = ws4.addRow([f.name, f.pct])
    row.getCell(2).numFmt = PCT
  }

  const out = await wb.xlsx.writeBuffer()
  return Buffer.from(out as ArrayBuffer)
}
