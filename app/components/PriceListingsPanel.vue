<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { PriceListingsResponse } from '~/types/api'
import { formatCurrency, formatDate } from '~/utils/format'

const props = defineProps<{ setNo: string }>()

const data = ref<PriceListingsResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const page = ref(1)
const pageSize = 25
const source = ref<'' | 'bricklink' | 'ebay'>('')
const condition = ref<'' | 'new' | 'used'>('')

const totalPages = computed(() => (data.value ? Math.max(1, Math.ceil(data.value.total / pageSize)) : 1))

const sourceLabels: Record<string, string> = { bricklink: 'BrickLink', ebay: 'eBay' }

async function load() {
  loading.value = true
  error.value = null
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) })
    if (source.value) params.set('source', source.value)
    if (condition.value) params.set('condition', condition.value)
    data.value = await $fetch<PriceListingsResponse>(`/api/sets/${props.setNo}/listings?${params}`)
  } catch {
    error.value = 'Transactions indisponibles'
  } finally {
    loading.value = false
  }
}

watch([source, condition], () => {
  page.value = 1
  load()
})

function goPrev() {
  if (page.value > 1) {
    page.value--
    load()
  }
}
function goNext() {
  if (page.value < totalPages.value) {
    page.value++
    load()
  }
}

onMounted(load)
</script>

<template>
  <div class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-sm font-medium text-imperial-muted">Transactions individuelles</h2>
      <div class="flex gap-2">
        <select v-model="source" class="rounded border border-imperial-border bg-imperial-bg px-2 py-1 text-sm">
          <option value="">Toutes sources</option>
          <option value="bricklink">BrickLink</option>
          <option value="ebay">eBay</option>
        </select>
        <select v-model="condition" class="rounded border border-imperial-border bg-imperial-bg px-2 py-1 text-sm">
          <option value="">Tout état</option>
          <option value="new">Neuf</option>
          <option value="used">Occasion</option>
        </select>
      </div>
    </div>

    <p v-if="error" class="text-sm text-imperial-muted">{{ error }}</p>
    <p v-else-if="loading && !data" class="text-sm text-imperial-muted">Chargement…</p>
    <p v-else-if="data && data.items.length === 0" class="text-sm text-imperial-muted">Aucune transaction disponible</p>

    <template v-else-if="data">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-imperial-muted">
            <th class="py-1">Date</th>
            <th class="py-1">Source</th>
            <th class="py-1">État</th>
            <th class="py-1 text-right">Prix</th>
            <th class="py-1">Annonce</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in data.items" :key="l.id" class="border-t border-imperial-border/50">
            <td class="py-1">{{ l.saleDate ? formatDate(l.saleDate) : '—' }}</td>
            <td class="py-1">{{ sourceLabels[l.source] ?? l.source }}</td>
            <td class="py-1">{{ l.condition === 'new' ? 'Neuf' : 'Occasion' }}</td>
            <td class="py-1 text-right">{{ formatCurrency(l.price) }}</td>
            <td class="py-1">
              <a
                v-if="l.listingUrl"
                :href="l.listingUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-imperial-accent hover:underline"
                :title="l.title ?? ''"
              >
                Voir
              </a>
              <span v-else class="text-imperial-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-3 flex items-center justify-between text-sm">
        <span class="text-imperial-muted">{{ data.total }} transactions</span>
        <div class="flex items-center gap-2">
          <button
            :disabled="page <= 1"
            class="rounded border border-imperial-border px-2 py-1 disabled:opacity-40"
            @click="goPrev"
          >
            Précédent
          </button>
          <span class="text-imperial-muted">{{ page }} / {{ totalPages }}</span>
          <button
            :disabled="page >= totalPages"
            class="rounded border border-imperial-border px-2 py-1 disabled:opacity-40"
            @click="goNext"
          >
            Suivant
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
