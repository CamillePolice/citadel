import { defineStore } from 'pinia'
import type { Dashboard, PortfolioHistoryPoint } from '~/types/api'

interface DashboardState {
  data: Dashboard | null
  history: PortfolioHistoryPoint[]
  loaded: boolean
  loading: boolean
  error: string | null
}

export const useDashboardStore = defineStore('dashboard', {
  state: (): DashboardState => ({
    data: null,
    history: [],
    loaded: false,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchDashboard(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      this.error = null
      try {
        const [data, history] = await Promise.all([
          $fetch<Dashboard>('/api/dashboard'),
          $fetch<PortfolioHistoryPoint[]>('/api/dashboard/history'),
        ])
        this.data = data
        this.history = history
        this.loaded = true
      } catch {
        this.error = 'Impossible de charger le tableau de bord'
      } finally {
        this.loading = false
      }
    },
  },
})
