import { buildWorkbook } from '../../lib/excel'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  const buffer = await buildWorkbook(user.id)

  const today = new Date().toISOString().slice(0, 10)
  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="citadel-export-${today}.xlsx"`)
  setHeader(event, 'Content-Length', buffer.length)

  return buffer
})
