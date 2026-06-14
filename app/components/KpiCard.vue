<script setup lang="ts">
import { computed } from 'vue'
import { pnlClass } from '~/utils/format'

const props = defineProps<{
  label: string
  value: string
  delta?: number | null
  deltaText?: string
}>()

const deltaClass = computed(() => pnlClass(props.delta ?? null))
const showDelta = computed(() => props.delta !== undefined && props.delta !== null)
</script>

<template>
  <div class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
    <p class="text-xs uppercase tracking-wide text-imperial-muted">{{ label }}</p>
    <p class="mt-1 text-2xl font-semibold text-imperial-text">{{ value }}</p>
    <p v-if="showDelta" class="mt-1 text-sm font-medium" :class="deltaClass">
      {{ deltaText }}
    </p>
  </div>
</template>
