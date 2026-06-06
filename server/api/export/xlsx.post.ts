export default defineEventHandler((event) => {
  requireUser(event)
  throw createError({ statusCode: 501, statusMessage: 'Not implemented (Phase 2)' })
})
