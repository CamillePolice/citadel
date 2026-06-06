<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import type { PriceHistoryPoint } from '~/types/api'
import { formatDate } from '~/utils/format'

const props = defineProps<{ points: PriceHistoryPoint[] }>()

const sorted = computed(() => [...props.points].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)))
const labels = computed(() => [...new Set(sorted.value.map((p) => p.capturedAt))].map(formatDate))

const chartData = computed<ChartData<'line'>>(() => {
  const series = (cond: 'new' | 'used', color: string) => ({
    label: cond === 'new' ? 'Neuf' : 'Occasion',
    data: sorted.value.filter((p) => p.condition === cond).map((p) => p.avgPrice ?? null),
    borderColor: color,
    fill: false,
    tension: 0.25,
    spanGaps: true,
  })
  return { labels: labels.value, datasets: [series('new', '#3ecf8e'), series('used', '#7c5cff')] }
})

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  scales: { x: { grid: { display: false } } },
}
</script>

<template>
  <div class="h-64">
    <Line :data="chartData" :options="options" />
  </div>
</template>
