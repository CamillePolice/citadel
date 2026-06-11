<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import type { PriceHistoryPoint } from '~/types/api'

const props = defineProps<{ points: PriceHistoryPoint[] }>()

const SOURCE_COLORS: Record<string, string> = {
  'bricklink:new': '#3ecf8e',
  'bricklink:used': '#7c5cff',
  'brickowl:new': '#3b82f6',
  'avenuedelabrique:new': '#f97316',
}

const SOURCE_LABELS: Record<string, string> = {
  'bricklink:new': 'BrickLink Neuf (vendu)',
  'bricklink:used': 'BrickLink Occasion (vendu)',
  'brickowl:new': 'BrickOwl',
  'avenuedelabrique:new': 'Avenue de la Brique',
}

const sorted = computed(() => [...props.points].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)))

const labels = computed(() => [...new Set(sorted.value.map((p) => p.capturedAt))])

const chartData = computed<ChartData<'line'>>(() => {
  const keys = [...new Set(sorted.value.map((p) => `${p.source}:${p.condition}`))]

  const datasets = keys.map((key) => {
    const [source, condition] = key.split(':')
    const pts = sorted.value.filter((p) => p.source === source && p.condition === condition)
    const byDate = new Map(pts.map((p) => [p.capturedAt, p.avgPrice ?? null]))

    return {
      label: SOURCE_LABELS[key] ?? key,
      data: labels.value.map((d) => byDate.get(d) ?? null),
      borderColor: SOURCE_COLORS[key] ?? '#8b81a8',
      backgroundColor: (SOURCE_COLORS[key] ?? '#8b81a8') + '22',
      fill: false,
      tension: 0.2,
      spanGaps: true,
      pointRadius: pts.length === 1 ? 5 : 3,
    }
  })

  const avgData = labels.value.map((date) => {
    const vals = sorted.value
      .filter((p) => p.capturedAt === date && p.avgPrice != null)
      .map((p) => p.avgPrice as number)
    if (vals.length === 0) return null
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
  })

  datasets.push({
    label: 'Moyenne toutes sources',
    data: avgData,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
    borderDash: [6, 3],
    borderWidth: 2,
    fill: false,
    tension: 0.3,
    spanGaps: true,
    pointRadius: 2,
  } as never)

  return { labels: labels.value, datasets }
})

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y != null ? ctx.parsed.y.toFixed(2) + ' €' : '—'}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      ticks: { callback: (v) => v + ' €' },
    },
  },
}
</script>

<template>
  <div v-if="points.length === 0" class="flex h-48 items-center justify-center text-sm text-imperial-muted">
    Aucune donnée de prix disponible
  </div>
  <div v-else class="h-72">
    <Line :data="chartData" :options="options" />
  </div>
</template>
