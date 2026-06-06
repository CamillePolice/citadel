import { db } from '../db'
import { users } from '../db/schema'
import { isAdmin } from '../utils/auth'

export default defineEventHandler(async (event) => {
  if (event.path === '/api/health') return

  const config = useRuntimeConfig()

  let authentikUid = getHeader(event, config.authHeaderUid) ?? null

  if (!authentikUid) {
    if (process.env.NODE_ENV === 'development' && process.env.DEV_AUTHENTIK_UID) {
      authentikUid = process.env.DEV_AUTHENTIK_UID
    } else {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }

  const email = getHeader(event, config.authHeaderEmail) ?? null
  const displayName = getHeader(event, config.authHeaderUsername) ?? null
  const groupsRaw = getHeader(event, config.authHeaderGroups) ?? ''
  const groups = groupsRaw
    .split(/[,|]/)
    .map((g) => g.trim())
    .filter(Boolean)

  const [row] = await db
    .insert(users)
    .values({ authentikUid, email, displayName })
    .onConflictDoUpdate({
      target: users.authentikUid,
      set: { email, displayName },
    })
    .returning()

  event.context.user = {
    id: row.id,
    authentikUid: row.authentikUid,
    email: row.email,
    displayName: row.displayName,
    groups,
    isAdmin: isAdmin(groups, config.adminGroup),
  }
})
