import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let _db: DrizzleDb | null = null

function getDb(): DrizzleDb {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    const client = postgres(url)
    _db = drizzle(client, { schema, casing: 'snake_case' })
  }
  return _db
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop: string | symbol) {
    const target = getDb()
    const value = (target as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(target) : value
  },
})

export async function pingDb(): Promise<boolean> {
  try {
    await getDb().execute('SELECT 1' as unknown as Parameters<DrizzleDb['execute']>[0])
    return true
  } catch {
    return false
  }
}
