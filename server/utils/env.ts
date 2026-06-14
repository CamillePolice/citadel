import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REBRICKABLE_API_KEY: z.string().optional(),
  BRICKOWL_API_KEY: z.string().optional(),
  EBAY_APP_ID: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

let _env: Env | null = null

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env)
    if (!result.success) {
      const missing = result.error.issues.map((i) => i.message).join(', ')
      throw new Error(`Invalid environment: ${missing}`)
    }
    _env = result.data
  }
  return _env
}

export function validateWorkerEnv(): Env {
  const env = getEnv()

  if (!env.REBRICKABLE_API_KEY) {
    console.warn('[env] REBRICKABLE_API_KEY not set — catalog enrichment disabled')
  }
  if (!env.BRICKOWL_API_KEY) {
    console.warn('[env] BRICKOWL_API_KEY not set — BrickOwl disabled')
  }
  if (!env.EBAY_APP_ID) {
    console.warn('[env] EBAY_APP_ID not set — eBay disabled')
  }

  return env
}
