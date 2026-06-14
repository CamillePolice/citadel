import { eq } from 'drizzle-orm'
import { db } from '../db'
import { catalogSets } from '../db/schema'
import { fetchRebrickableSet } from '../lib/rebrickable'

export async function ensureCatalogSet(setNo: string): Promise<void> {
  const [existing] = await db
    .select({ setNo: catalogSets.setNo, name: catalogSets.name })
    .from(catalogSets)
    .where(eq(catalogSets.setNo, setNo))
    .limit(1)

  if (existing?.name) return

  const data = await fetchRebrickableSet(setNo)

  if (data) {
    await db
      .insert(catalogSets)
      .values({
        setNo: data.setNo,
        name: data.name,
        year: data.year,
        theme: data.theme != null ? String(data.theme) : null,
        pieceCount: data.numParts,
        imageUrl: data.imageUrl,
        retirementStatus: 'unknown',
      })
      .onConflictDoUpdate({
        target: catalogSets.setNo,
        set: {
          name: data.name,
          year: data.year,
          theme: data.theme != null ? String(data.theme) : null,
          pieceCount: data.numParts,
          imageUrl: data.imageUrl,
        },
      })
  } else if (!existing) {
    await db
      .insert(catalogSets)
      .values({ setNo, name: null, retirementStatus: 'unknown' })
      .onConflictDoNothing({ target: catalogSets.setNo })
  }
}
