<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import type { ConditionBucket } from '~/types/api'

const props = defineProps<{ buckets: ConditionBucket[] }>()

const label = (c: string) => (c === 'new_sealed' ? 'Neuf scellé' : 'Occasion')

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.buckets.map((b) => label(b.condition)),
  datasets: [
    {
      data: props.buckets.map((b) => b.value),
      backgroundColor: ['#3ecf8e', '#ffb454'],
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
