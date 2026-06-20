<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { formatCurrency, formatDate } from '~/utils/format'

interface PriceSource {
  source: string
  condition: string
  guideType: string
  avgPrice: number | null
  minPrice: number | null
  maxPrice: number | null
  unitQuantity: number | null
  sourceUrl: string | null
  capturedAt: string
}

const props = defineProps<{ setNo: string }>()

const sources = ref<PriceSource[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const sourceLabels: Record<string, string> = {
  bricklink: 'BrickLink',
  brickowl: 'BrickOwl',
  avenuedelabrique: 'Avenue de la Brique',
  ebay: 'eBay',
}

const guideLabels: Record<string, string> = {
  sold: 'vendu',
  stock: 'en vente',
  listing: 'annonce',
}

const conditionLabels: Record<string, string> = {
  new: 'Neuf',
  used: 'Occasion',
}

function sourceLink(s: PriceSource): string | null {
  if (s.sourceUrl) return s.sourceUrl
  const base = props.setNo.split('-')[0]
  if (s.source === 'bricklink') return `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${base}-1`
  if (s.source === 'brickowl') return `https://www.brickowl.com/search/catalog?query=${base}`
  return null
}

onMounted(async () => {
  loading.value = true
  try {
    sources.value = await $fetch<PriceSource[]>(`/api/sets/${props.setNo}/price-sources`)
  } catch {
    error.value = 'Sources indisponibles'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
    <h2 class="mb-3 text-sm font-medium text-imperial-muted">Sources de prix utilisées</h2>

    <p v-if="error" class="text-sm text-imperial-muted">{{ error }}</p>
    <p v-else-if="loading" class="text-sm text-imperial-muted">Chargement…</p>
    <p v-else-if="sources.length === 0" class="text-sm text-imperial-muted">Aucune donnée disponible</p>

    <table v-else class="w-full text-sm">
      <thead>
        <tr class="text-left text-xs text-imperial-muted">
          <th class="py-1">Source</th>
          <th class="py-1">Type</th>
          <th class="py-1">État</th>
          <th class="py-1 text-right">Moy.</th>
          <th class="py-1 text-right">Min</th>
          <th class="py-1 text-right">Max</th>
          <th class="py-1 text-right">Qté</th>
          <th class="py-1 text-right">Mis à jour</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="s in sources"
          :key="`${s.source}-${s.condition}-${s.guideType}`"
          class="border-t border-imperial-border/50"
        >
          <td class="py-1.5 font-medium">
            <a
              v-if="sourceLink(s)"
              :href="sourceLink(s)!"
              target="_blank"
              rel="noopener noreferrer"
              class="text-imperial-accent hover:underline"
              >{{ sourceLabels[s.source] ?? s.source }}</a
            >
            <span v-else>{{ sourceLabels[s.source] ?? s.source }}</span>
          </td>
          <td class="py-1.5 capitalize text-imperial-muted">{{ guideLabels[s.guideType] ?? s.guideType }}</td>
          <td class="py-1.5">{{ conditionLabels[s.condition] ?? s.condition }}</td>
          <td class="py-1.5 text-right font-semibold">{{ formatCurrency(s.avgPrice) }}</td>
          <td class="py-1.5 text-right text-imperial-muted">{{ formatCurrency(s.minPrice) }}</td>
          <td class="py-1.5 text-right text-imperial-muted">{{ formatCurrency(s.maxPrice) }}</td>
          <td class="py-1.5 text-right text-imperial-muted">{{ s.unitQuantity ?? '—' }}</td>
          <td class="py-1.5 text-right text-imperial-muted">{{ formatDate(s.capturedAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
