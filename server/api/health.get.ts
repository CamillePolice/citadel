import { pingDb } from '../db'

export default defineEventHandler(async () => {
  const dbOk = await pingDb()
  return { status: 'ok', db: dbOk }
})
