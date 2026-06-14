<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { PriceHistoryPoint } from '~/types/api'
import { useItemsStore } from '~/stores/items'
import { formatCurrency, formatPct, formatDate, pnlClass } from '~/utils/format'

const route = useRoute()
const setNo = computed(() => route.params.setNo as string)
const items = useItemsStore()

const prices = ref<PriceHistoryPoint[]>([])
const pricesError = ref<string | null>(null)
const showEdit = ref(false)
const deleting = ref(false)

const item = computed(() => items.bySetNo(setNo.value))

onMounted(async () => {
  await items.fetchItems()
  try {
    prices.value = await $fetch<PriceHistoryPoint[]>(`/api/sets/${setNo.value}/prices`)
  } catch {
    pricesError.value = 'Historique de prix indisponible'
  }
})

async function onDelete() {
  if (!item.value) return
  if (!confirm('Supprimer ce set de la collection ?')) return
  deleting.value = true
  try {
    await items.deleteItem(item.value.id)
    await navigateTo('/dashboard')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <NuxtLink to="/dashboard" class="text-sm text-imperial-muted hover:text-imperial-text">← Retour</NuxtLink>

    <template v-if="item">
      <div class="flex flex-col gap-4 rounded-lg border border-imperial-border bg-imperial-surface p-5 md:flex-row">
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          :alt="item.name ?? item.setNo"
          class="h-32 w-32 rounded object-contain"
        />
        <div class="flex-1">
          <h1 class="text-2xl font-semibold">{{ item.name ?? item.setNo }}</h1>
          <p class="text-imperial-muted">{{ item.theme }} · {{ item.setNo }}</p>
          <div class="mt-3 flex flex-wrap gap-6">
            <div>
              <p class="text-xs text-imperial-muted">Valeur</p>
              <p class="text-lg font-semibold">
                {{ formatCurrency(item.currentValue) }}
                <DegradedBadge v-if="item.degraded" :source="item.priceSource" class="ml-1" />
              </p>
            </div>
            <div>
              <p class="text-xs text-imperial-muted">P&L</p>
              <p class="text-lg font-semibold" :class="pnlClass(item.pnl)">
                {{ formatCurrency(item.pnl) }} ({{ formatPct(item.pnlPct) }})
              </p>
            </div>
            <div>
              <p class="text-xs text-imperial-muted">Acheté</p>
              <p class="text-lg">{{ formatCurrency(item.purchasePrice) }} · {{ formatDate(item.purchaseDate) }}</p>
            </div>
          </div>
        </div>
        <div class="flex gap-2 md:flex-col">
          <button class="rounded border border-imperial-border px-3 py-2 text-sm" @click="showEdit = true">
            Modifier
          </button>
          <button
            :disabled="deleting"
            class="rounded border border-loss/40 px-3 py-2 text-sm text-loss disabled:opacity-50"
            @click="onDelete"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
        <h2 class="mb-3 text-sm font-medium text-imperial-muted">Historique de prix</h2>
        <p v-if="pricesError" class="text-sm text-imperial-muted">{{ pricesError }}</p>
        <ChartsPriceHistoryChart v-else :points="prices" />
      </div>

      <PriceListingsPanel :set-no="setNo" />

      <EditItemModal v-if="showEdit" :item="item" @close="showEdit = false" @saved="showEdit = false" />
    </template>

    <p v-else class="text-imperial-muted">Set introuvable dans votre collection.</p>
  </div>
</template>
