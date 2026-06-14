<script setup lang="ts">
defineProps<{ source?: string }>()
</script>

<template>
  <span
    class="group relative inline-flex cursor-help items-center rounded bg-imperial-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-imperial-muted"
    aria-label="Estimation dégradée"
  >
    estimation dégradée
    <span
      class="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden w-56 rounded border border-imperial-border bg-imperial-surface p-2 text-xs normal-case text-imperial-text shadow-lg group-hover:block"
    >
      Prix indisponible chez BrickLink. Valeur estimée via {{ source ?? 'une source de repli' }}.
    </span>
  </span>
</template>
