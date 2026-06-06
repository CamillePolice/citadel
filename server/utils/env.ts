import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BRICKLINK_CONSUMER_KEY: z.string().optional(),
  BRICKLINK_CONSUMER_SECRET: z.string().optional(),
  BRICKLINK_TOKEN: z.string().optional(),
  BRICKLINK_TOKEN_SECRET: z.string().optional(),
  REBRICKABLE_API_KEY: z.string().optional(),
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
