import { eq } from 'drizzle-orm'
import { db } from '../db'
import { catalogSets } from '../db/schema'

export async function ensureCatalogSet(setNo: string): Promise<void> {
  const [existing] = await db
    .select({ setNo: catalogSets.setNo })
    .from(catalogSets)
    .where(eq(catalogSets.setNo, setNo))
    .limit(1)

  if (existing) return

  // TODO(Phase 1): replace placeholder insert with enrichCatalogSet(setNo)
  // from server/lib/rebrickable.ts once that module exports it.
  await db
    .insert(catalogSets)
    .values({ setNo, name: null, retirementStatus: 'unknown' })
    .onConflictDoNothing({ target: catalogSets.setNo })
}
