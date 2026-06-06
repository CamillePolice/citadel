import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BRICKLINK_CONSUMER_KEY: z.string().optional(),
  BRICKLINK_CONSUMER_SECRET: z.string().optional(),
  BRICKLINK_TOKEN: z.string().optional(),
  BRICKLINK_TOKEN_SECRET: z.string().optional(),
  REBRICKABLE_API_KEY: z.string().optional(),
  BRICKOWL_API_KEY: z.string().optional(),
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

const WORKER_REQUIRED: Array<keyof Env> = [
  'BRICKLINK_CONSUMER_KEY',
  'BRICKLINK_CONSUMER_SECRET',
  'BRICKLINK_TOKEN',
  'BRICKLINK_TOKEN_SECRET',
  'REBRICKABLE_API_KEY',
]

export function validateWorkerEnv(): Env {
  const env = getEnv()
  const missing = WORKER_REQUIRED.filter((k) => !env[k])
  if (missing.length > 0) {
    throw new Error(`Worker env missing required vars: ${missing.join(', ')}`)
  }
  if (!env.BRICKOWL_API_KEY) {
    console.warn('[env] BRICKOWL_API_KEY not set — BrickOwl fallback disabled')
  }
  return env
}
