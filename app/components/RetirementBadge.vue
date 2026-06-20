<script setup lang="ts">
import type { RetirementStatus } from '~/types/api'

const props = defineProps<{ status: RetirementStatus }>()

const config: Record<Exclude<RetirementStatus, 'unknown'>, { label: string; class: string }> = {
  available: { label: 'Disponible', class: 'text-gain bg-gain/10 border-gain/30' },
  retiring_soon: { label: 'Fin de commercialisation', class: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  retired: { label: 'Retiré', class: 'text-loss bg-loss/10 border-loss/30' },
}
</script>

<template>
  <span
    v-if="props.status !== 'unknown'"
    class="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
    :class="config[props.status].class"
  >
    {{ config[props.status].label }}
  </span>
</template>
