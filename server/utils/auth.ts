import type { H3Event } from 'h3'
import type { AuthUser } from '../types/auth'

export function isAdmin(groups: string[], adminGroup: string): boolean {
  return groups.includes(adminGroup)
}

export function requireUser(event: H3Event): AuthUser {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}
