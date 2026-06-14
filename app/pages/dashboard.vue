<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Item } from '~/types/api'
import { useDashboardStore } from '~/stores/dashboard'
import { useItemsStore } from '~/stores/items'
import { useExport } from '~/composables/useExport'
import { formatCurrency, formatPct } from '~/utils/format'

const dashboard = useDashboardStore()
const items = useItemsStore()
const { exporting, exportXlsx } = useExport()

const showAdd = ref(false)

onMounted(() => {
  dashboard.fetchDashboard()
  items.fetchItems()
})

const d = computed(() => dashboard.data)

function onCreated() {
  dashboard.fetchDashboard(true)
  items.fetchItems(true)
}

function onSelect(item: Item) {
  navigateTo(`/sets/${item.setNo}`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Tableau de bord</h1>
      <div class="flex gap-2">
        <button
          :disabled="exporting"
          class="rounded border border-imperial-border px-3 py-2 text-sm disabled:opacity-50"
          @click="exportXlsx"
        >
          {{ exporting ? 'Export...' : 'Exporter XLSX' }}
        </button>
        <button class="rounded bg-imperial-accent px-3 py-2 text-sm font-medium text-white" @click="showAdd = true">
          + Ajouter un set
        </button>
      </div>
    </div>

    <p v-if="dashboard.error" class="rounded border border-loss/40 bg-loss/10 px-3 py-2 text-loss">
      {{ dashboard.error }}
    </p>

    <template v-if="d">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Valeur totale" :value="formatCurrency(d.totalValue)" />
        <KpiCard label="Coût total" :value="formatCurrency(d.totalCost)" />
        <KpiCard label="P&L" :value="formatCurrency(d.pnl)" :delta="d.pnl" :delta-text="formatPct(d.roi)" />
        <KpiCard label="ROI" :value="formatPct(d.roi)" :delta="d.roi" :delta-text="`${d.numItems} sets`" />
        <KpiCard label="Sets" :value="String(d.numItems)" />
        <KpiCard label="Pièces" :value="d.numPieces.toLocaleString('fr-FR')" />
        <KpiCard label="Valeur moy./set" :value="formatCurrency(d.avgValuePerItem)" />
      </div>

      <div class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
        <h2 class="mb-3 text-sm font-medium text-imperial-muted">Évolution du portefeuille</h2>
        <ChartsPortfolioChart :history="dashboard.history" />
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
          <h2 class="mb-3 text-sm font-medium text-imperial-muted">Répartition par thème</h2>
          <ChartsThemeChart :buckets="d.byTheme" />
        </div>
        <div class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
          <h2 class="mb-3 text-sm font-medium text-imperial-muted">Répartition par état</h2>
          <ChartsConditionChart :buckets="d.byCondition" />
        </div>
      </div>

      <div class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
        <h2 class="mb-3 text-sm font-medium text-imperial-muted">Top performers & flops</h2>
        <ChartsPerformersChart :performers="d.topPerformers" :flops="d.flops" />
      </div>
    </template>

    <div>
      <h2 class="mb-3 text-lg font-medium">Bibliothèque</h2>
      <LibraryTable :items="items.items" @select="onSelect" />
    </div>

    <AddSetModal v-if="showAdd" @close="showAdd = false" @created="onCreated" />
  </div>
</template>
