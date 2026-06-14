export interface AuthUser {
  id: string
  authentikUid: string
  email: string | null
  displayName: string | null
  groups: string[]
  isAdmin: boolean
}
