import { defineStore } from 'pinia'
import type { Item, CreateItemPayload, UpdateItemPayload } from '~/types/api'

interface ItemsState {
  items: Item[]
  loaded: boolean
  loading: boolean
  error: string | null
}

export const useItemsStore = defineStore('items', {
  state: (): ItemsState => ({
    items: [],
    loaded: false,
    loading: false,
    error: null,
  }),
  getters: {
    byId:
      (s) =>
      (id: string): Item | undefined =>
        s.items.find((i) => i.id === id),
    bySetNo:
      (s) =>
      (setNo: string): Item | undefined =>
        s.items.find((i) => i.setNo === setNo),
  },
  actions: {
    async fetchItems(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      this.error = null
      try {
        this.items = await $fetch<Item[]>('/api/items')
        this.loaded = true
      } catch {
        this.error = 'Impossible de charger la collection'
      } finally {
        this.loading = false
      }
    },
    async addItem(payload: CreateItemPayload): Promise<Item> {
      const created = await $fetch<Item>('/api/items', { method: 'POST', body: payload })
      this.items.push(created)
      return created
    },
    async updateItem(id: string, payload: UpdateItemPayload): Promise<Item> {
      const updated = await $fetch<Item>(`/api/items/${id}`, { method: 'PATCH', body: payload })
      const idx = this.items.findIndex((i) => i.id === id)
      if (idx !== -1) this.items[idx] = updated
      return updated
    },
    async deleteItem(id: string): Promise<void> {
      await $fetch(`/api/items/${id}`, { method: 'DELETE' })
      this.items = this.items.filter((i) => i.id !== id)
    },
  },
})
