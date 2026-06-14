<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import type { Item } from '~/types/api'

const props = defineProps<{ performers: Item[]; flops: Item[] }>()

const rows = computed(() => {
  const combined = [...props.performers, ...props.flops]
  const seen = new Set<string>()
  return combined
    .filter((i) => {
      if (seen.has(i.id)) return false
      seen.add(i.id)
      return true
    })
    .sort((a, b) => b.pnlPct - a.pnlPct)
})

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: rows.value.map((i) => i.name ?? i.setNo),
  datasets: [
    {
      label: 'P&L %',
      data: rows.value.map((i) => i.pnlPct),
      backgroundColor: rows.value.map((i) => (i.pnlPct >= 0 ? '#3ecf8e' : '#f0506e')),
    },
  ],
}))

const options: ChartOptions<'bar'> = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
}
</script>

<template>
  <div class="h-80">
    <Bar :data="chartData" :options="options" />
  </div>
</template>
