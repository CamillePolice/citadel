<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Item } from '~/types/api'
import { formatCurrency, formatPct, pnlClass } from '~/utils/format'

const props = defineProps<{ items: Item[]; pageSize?: number }>()
const emit = defineEmits<{ (e: 'select', item: Item): void }>()

type SortKey = 'name' | 'theme' | 'currentValue' | 'pnl' | 'pnlPct'
const sortKey = ref<SortKey>('currentValue')
const sortDir = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const size = computed(() => props.pageSize ?? 20)

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'desc'
  }
  page.value = 1
}

const sorted = computed(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.items].sort((a, b) => {
    const av = a[sortKey.value]
    const bv = b[sortKey.value]
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / size.value)))
const paged = computed(() => {
  const start = (page.value - 1) * size.value
  return sorted.value.slice(start, start + size.value)
})

const columns: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: 'name', label: 'Set' },
  { key: 'theme', label: 'Thème' },
  { key: 'currentValue', label: 'Valeur', numeric: true },
  { key: 'pnl', label: 'P&L', numeric: true },
  { key: 'pnlPct', label: 'P&L %', numeric: true },
]
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-imperial-border">
    <table class="min-w-full text-sm">
      <thead class="bg-imperial-surface text-imperial-muted">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            class="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left font-medium"
            :class="col.numeric ? 'text-right' : 'text-left'"
            @click="toggleSort(col.key)"
          >
            {{ col.label }}
            <span v-if="sortKey === col.key">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in paged"
          :key="item.id"
          class="cursor-pointer border-t border-imperial-border hover:bg-imperial-surface"
          @click="emit('select', item)"
        >
          <td class="px-3 py-2">
            <span class="font-medium text-imperial-text">{{ item.name ?? item.setNo }}</span>
            <span class="ml-1 text-xs text-imperial-muted">{{ item.setNo }}</span>
          </td>
          <td class="px-3 py-2 text-imperial-muted">{{ item.theme ?? '—' }}</td>
          <td class="whitespace-nowrap px-3 py-2 text-right">
            {{ formatCurrency(item.currentValue) }}
            <DegradedBadge v-if="item.degraded" :source="item.priceSource" class="ml-1" />
          </td>
          <td class="whitespace-nowrap px-3 py-2 text-right" :class="pnlClass(item.pnl)">
            {{ formatCurrency(item.pnl) }}
          </td>
          <td class="whitespace-nowrap px-3 py-2 text-right" :class="pnlClass(item.pnlPct)">
            {{ formatPct(item.pnlPct) }}
          </td>
        </tr>
        <tr v-if="paged.length === 0">
          <td colspan="5" class="px-3 py-6 text-center text-imperial-muted">Aucun set</td>
        </tr>
      </tbody>
    </table>
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between border-t border-imperial-border px-3 py-2 text-sm text-imperial-muted"
    >
      <button :disabled="page === 1" class="disabled:opacity-40" @click="page--">Précédent</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button :disabled="page === totalPages" class="disabled:opacity-40" @click="page++">Suivant</button>
    </div>
  </div>
</template>
