import type { AuthUser } from './auth'

declare module 'h3' {
  interface H3EventContext {
    user: AuthUser
  }
}
export {}
