<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{ error: NuxtError }>()

function handleClear() {
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-imperial-bg text-imperial-text">
    <h1 class="text-4xl font-bold text-imperial-accent">{{ error.statusCode }}</h1>
    <p class="mt-2 text-imperial-muted">
      {{ error.statusCode === 401 ? 'Non authentifié' : error.message || 'Une erreur est survenue' }}
    </p>
    <button class="mt-4 rounded bg-imperial-accent px-4 py-2 font-medium text-white" @click="handleClear">
      Retour au tableau de bord
    </button>
  </div>
</template>
