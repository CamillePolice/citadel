<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import type { ThemeBucket } from '~/types/api'

const props = defineProps<{ buckets: ThemeBucket[] }>()

const palette = ['#7c5cff', '#3ecf8e', '#f0506e', '#ffb454', '#54c7ec', '#a48fff', '#8b81a8']

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.buckets.map((b) => b.theme),
  datasets: [
    {
      data: props.buckets.map((b) => b.value),
      backgroundColor: props.buckets.map((_, i) => palette[i % palette.length]),
      borderColor: '#241f33',
      borderWidth: 2,
    },
  ],
}))

const options: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'right' } },
}
</script>

<template>
  <div class="h-64">
    <Doughnut :data="chartData" :options="options" />
  </div>
</template>
