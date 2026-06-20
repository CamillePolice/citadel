<script setup lang="ts">
import { changelog } from '~/data/changelog'
import { formatDate } from '~/utils/format'

const typeConfig = {
  feature: { label: 'Nouveauté', class: 'bg-gain/10 text-gain border-gain/30' },
  fix: { label: 'Correction', class: 'bg-imperial-border/20 text-imperial-muted border-imperial-border/40' },
  improvement: { label: 'Amélioration', class: 'bg-imperial-accent/10 text-imperial-accent border-imperial-accent/30' },
}
</script>

<template>
  <div class="space-y-8 max-w-2xl">
    <h1 class="text-2xl font-semibold">Changelog</h1>

    <div
      v-for="entry in changelog"
      :key="entry.version"
      class="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-imperial-border"
    >
      <div
        class="absolute left-0 top-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-imperial-accent border-2 border-imperial-bg"
      />

      <div class="mb-3 flex items-baseline gap-3">
        <span class="text-lg font-semibold">v{{ entry.version }}</span>
        <span class="text-sm text-imperial-muted">{{ formatDate(entry.date) }}</span>
      </div>

      <ul class="space-y-2">
        <li v-for="(change, i) in entry.changes" :key="i" class="flex items-start gap-2 text-sm">
          <span
            class="mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium"
            :class="typeConfig[change.type].class"
          >
            {{ typeConfig[change.type].label }}
          </span>
          <span>{{ change.description }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
