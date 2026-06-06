import cron from 'node-cron'

const schedule = process.env.CRON_SCHEDULE ?? '0 4 * * *'

console.log(`[worker] refresh-prices starting, schedule: ${schedule}`)

cron.schedule(schedule, () => {
  console.log('[worker] refresh-prices: not implemented (Phase 1)')
})
