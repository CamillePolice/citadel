import { defineStore } from 'pinia'
import type { User } from '~/types/api'

interface UserState {
  user: User | null
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    loading: false,
    error: null,
  }),
  getters: {
    isAdmin: (s): boolean => s.user?.isAdmin ?? false,
    displayName: (s): string => s.user?.displayName ?? s.user?.email ?? 'Utilisateur',
  },
  actions: {
    async fetchMe() {
      this.loading = true
      this.error = null
      try {
        this.user = await $fetch<User>('/api/me')
      } catch {
        this.error = 'Impossible de charger le profil'
        this.user = null
      } finally {
        this.loading = false
      }
    },
  },
})
