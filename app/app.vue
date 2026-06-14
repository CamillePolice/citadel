<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '~/stores/user'

const user = useUserStore()
onMounted(() => user.fetchMe())
</script>

<template>
  <div class="min-h-full bg-imperial-bg text-imperial-text">
    <header class="border-b border-imperial-border bg-imperial-surface">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NuxtLink to="/dashboard" class="text-lg font-semibold text-imperial-accent">Citadel</NuxtLink>
        <div class="flex items-center gap-4">
          <NuxtLink to="/aide" class="text-sm text-imperial-muted hover:text-imperial-text">Aide</NuxtLink>
          <span class="text-sm text-imperial-muted">{{ user.displayName }}</span>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 py-6">
      <NuxtPage />
    </main>
  </div>
</template>
