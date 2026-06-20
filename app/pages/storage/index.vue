<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { StorageSpace, StorageSpaceType } from '~/types/api'

const spaces = ref<StorageSpace[]>([])
const loading = ref(false)
const showCreate = ref(false)
const form = ref({
  name: '',
  type: 'shelf' as StorageSpaceType,
  rows: null as number | null,
  cols: null as number | null,
  description: '',
})
const saving = ref(false)
const deletingId = ref<string | null>(null)

const typeLabels: Record<StorageSpaceType, string> = { shelf: 'Étagère', drawer: 'Tiroir', box: 'Boîte', room: 'Pièce' }
const typeIcons: Record<StorageSpaceType, string> = { shelf: '🗄️', drawer: '🗃️', box: '📦', room: '🏠' }

async function load() {
  loading.value = true
  try {
    spaces.value = await $fetch<StorageSpace[]>('/api/storage')
  } finally {
    loading.value = false
  }
}

async function create() {
  saving.value = true
  try {
    await $fetch('/api/storage', {
      method: 'POST',
      body: {
        name: form.value.name,
        type: form.value.type,
        rows: form.value.rows,
        cols: form.value.cols,
        description: form.value.description || null,
      },
    })
    form.value = { name: '', type: 'shelf', rows: null, cols: null, description: '' }
    showCreate.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function deleteSpace(id: string, itemCount: number) {
  if (itemCount > 0) {
    alert("Retirez d'abord les sets de cet espace.")
    return
  }
  if (!confirm('Supprimer cet espace ?')) return
  deletingId.value = id
  try {
    await $fetch(`/api/storage/${id}`, { method: 'DELETE' })
    await load()
  } finally {
    deletingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Espaces de stockage</h1>
      <button
        class="rounded border border-imperial-border px-3 py-2 text-sm hover:bg-imperial-surface"
        @click="showCreate = !showCreate"
      >
        + Nouvel espace
      </button>
    </div>

    <div v-if="showCreate" class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
      <h2 class="mb-3 text-sm font-medium text-imperial-muted">Créer un espace</h2>
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <input
          v-model="form.name"
          placeholder="Nom"
          class="col-span-2 rounded border border-imperial-border bg-imperial-bg px-3 py-2 text-sm"
        />
        <select v-model="form.type" class="rounded border border-imperial-border bg-imperial-bg px-3 py-2 text-sm">
          <option v-for="(label, val) in typeLabels" :key="val" :value="val">{{ label }}</option>
        </select>
        <input
          v-model="form.description"
          placeholder="Description (optionnel)"
          class="col-span-2 rounded border border-imperial-border bg-imperial-bg px-3 py-2 text-sm"
        />
        <div class="flex gap-2">
          <input
            v-model.number="form.rows"
            type="number"
            placeholder="Rangées"
            min="1"
            max="50"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-2 text-sm"
          />
          <input
            v-model.number="form.cols"
            type="number"
            placeholder="Colonnes"
            min="1"
            max="50"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-2 text-sm"
          />
        </div>
      </div>
      <p class="mt-1 text-xs text-imperial-muted">Rangées × Colonnes : optionnel, pour activer la grille visuelle</p>
      <div class="mt-3 flex gap-2">
        <button
          :disabled="!form.name || saving"
          class="rounded bg-imperial-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          @click="create"
        >
          {{ saving ? 'Création…' : 'Créer' }}
        </button>
        <button class="rounded border border-imperial-border px-4 py-2 text-sm" @click="showCreate = false">
          Annuler
        </button>
      </div>
    </div>

    <p v-if="loading" class="text-sm text-imperial-muted">Chargement…</p>
    <p v-else-if="spaces.length === 0" class="text-sm text-imperial-muted">
      Aucun espace. Créez-en un pour organiser votre collection.
    </p>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="s in spaces"
        :key="s.id"
        :to="`/storage/${s.id}`"
        class="group relative flex flex-col gap-2 rounded-lg border border-imperial-border bg-imperial-surface p-4 hover:border-imperial-accent/50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ typeIcons[s.type] }}</span>
            <div>
              <p class="font-medium">{{ s.name }}</p>
              <p class="text-xs text-imperial-muted">
                {{ typeLabels[s.type] }}<span v-if="s.rows && s.cols"> · {{ s.rows }}×{{ s.cols }}</span>
              </p>
            </div>
          </div>
          <button
            class="hidden group-hover:block rounded px-2 py-1 text-xs text-loss hover:bg-loss/10"
            :disabled="deletingId === s.id"
            @click.prevent="deleteSpace(s.id, s.itemCount)"
          >
            ×
          </button>
        </div>
        <p v-if="s.description" class="text-xs text-imperial-muted">{{ s.description }}</p>
        <p class="text-sm">{{ s.itemCount }} set{{ s.itemCount !== 1 ? 's' : '' }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
