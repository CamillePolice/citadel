<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import type { PortfolioHistoryPoint } from '~/types/api'
import { formatDate } from '~/utils/format'

const props = defineProps<{ history: PortfolioHistoryPoint[] }>()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.history.map((p) => formatDate(p.date)),
  datasets: [
    {
      label: 'Valeur',
      data: props.history.map((p) => p.totalValue),
      borderColor: '#7c5cff',
      backgroundColor: 'rgba(124,92,255,0.25)',
      borderWidth: 2,
      fill: true,
      tension: 0.25,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
    {
      label: 'Coût',
      data: props.history.map((p) => p.totalCost),
      borderColor: '#f0506e',
      borderDash: [4, 4],
      borderWidth: 2,
      fill: false,
      tension: 0.25,
      pointRadius: 3,
    },
  ],
}))

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (ctx) =>
          `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      ticks: {
        callback: (v) =>
          Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
      },
    },
  },
}
</script>

<template>
  <div class="h-64">
    <Line :data="chartData" :options="options" />
  </div>
</template>
