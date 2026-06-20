<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { StorageSpaceDetail, StorageSpaceType } from '~/types/api'

const route = useRoute()
const id = computed(() => route.params.id as string)

const space = ref<StorageSpaceDetail | null>(null)
const loading = ref(false)
const editing = ref(false)
const editForm = ref({
  name: '',
  type: 'shelf' as StorageSpaceType,
  rows: null as number | null,
  cols: null as number | null,
  description: '',
})
const saving = ref(false)

const typeLabels: Record<StorageSpaceType, string> = { shelf: 'Étagère', drawer: 'Tiroir', box: 'Boîte', room: 'Pièce' }
const typeIcons: Record<StorageSpaceType, string> = { shelf: '🗄️', drawer: '🗃️', box: '📦', room: '🏠' }

const isGrid = computed(() => space.value && space.value.rows && space.value.cols)
const unplacedItems = computed(
  () => space.value?.items.filter((i) => i.storageRow == null || i.storageCol == null) ?? [],
)

async function load() {
  loading.value = true
  try {
    space.value = await $fetch<StorageSpaceDetail>(`/api/storage/${id.value}`)
    editForm.value = {
      name: space.value.name,
      type: space.value.type,
      rows: space.value.rows,
      cols: space.value.cols,
      description: space.value.description ?? '',
    }
  } finally {
    loading.value = false
  }
}

async function saveEdit() {
  if (!space.value) return
  saving.value = true
  try {
    await $fetch(`/api/storage/${id.value}`, {
      method: 'PATCH',
      body: {
        name: editForm.value.name,
        type: editForm.value.type,
        rows: editForm.value.rows,
        cols: editForm.value.cols,
        description: editForm.value.description || null,
      },
    })
    editing.value = false
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <NuxtLink to="/storage" class="text-sm text-imperial-muted hover:text-imperial-text">← Espaces</NuxtLink>

    <p v-if="loading" class="text-sm text-imperial-muted">Chargement…</p>

    <template v-else-if="space">
      <div class="rounded-lg border border-imperial-border bg-imperial-surface p-5">
        <div v-if="!editing" class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <span class="text-3xl">{{ typeIcons[space.type] }}</span>
            <div>
              <h1 class="text-2xl font-semibold">{{ space.name }}</h1>
              <p class="text-sm text-imperial-muted">
                {{ typeLabels[space.type] }}
                <span v-if="space.rows && space.cols"> · {{ space.rows }} rangées × {{ space.cols }} colonnes</span>
                · {{ space.itemCount }} set{{ space.itemCount !== 1 ? 's' : '' }}
              </p>
              <p v-if="space.description" class="mt-1 text-sm text-imperial-muted">{{ space.description }}</p>
            </div>
          </div>
          <button class="rounded border border-imperial-border px-3 py-1.5 text-sm" @click="editing = true">
            Modifier
          </button>
        </div>

        <div v-else class="space-y-3">
          <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
            <input
              v-model="editForm.name"
              class="col-span-2 rounded border border-imperial-border bg-imperial-bg px-3 py-2 text-sm"
            />
            <select
              v-model="editForm.type"
              class="rounded border border-imperial-border bg-imperial-bg px-3 py-2 text-sm"
            >
              <option v-for="(label, val) in typeLabels" :key="val" :value="val">{{ label }}</option>
            </select>
            <input
              v-model="editForm.description"
              placeholder="Description"
              class="col-span-2 rounded border border-imperial-border bg-imperial-bg px-3 py-2 text-sm"
            />
            <div class="flex gap-2">
              <input
                v-model.number="editForm.rows"
                type="number"
                placeholder="Rangées"
                min="1"
                max="50"
                class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-2 text-sm"
              />
              <input
                v-model.number="editForm.cols"
                type="number"
                placeholder="Colonnes"
                min="1"
                max="50"
                class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-2 text-sm"
              />
            </div>
          </div>
          <div class="flex gap-2">
            <button
              :disabled="saving"
              class="rounded bg-imperial-accent px-4 py-2 text-sm text-white disabled:opacity-50"
              @click="saveEdit"
            >
              {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
            <button class="rounded border border-imperial-border px-4 py-2 text-sm" @click="editing = false">
              Annuler
            </button>
          </div>
        </div>
      </div>

      <div v-if="isGrid" class="rounded-lg border border-imperial-border bg-imperial-surface p-4">
        <h2 class="mb-3 text-sm font-medium text-imperial-muted">Disposition</h2>
        <StorageGrid :rows="space.rows!" :cols="space.cols!" :items="space.items" />
      </div>

      <div
        v-if="unplacedItems.length > 0 || !isGrid"
        class="rounded-lg border border-imperial-border bg-imperial-surface p-4"
      >
        <h2 class="mb-3 text-sm font-medium text-imperial-muted">
          {{ isGrid ? 'Sets non placés dans la grille' : 'Sets stockés ici' }}
        </h2>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            v-for="item in isGrid ? unplacedItems : space.items"
            :key="item.id"
            :to="`/sets/${item.setNo}`"
            class="flex items-center gap-2 rounded border border-imperial-border bg-imperial-bg px-3 py-2 text-sm hover:border-imperial-accent/50"
          >
            <img v-if="item.imageUrl" :src="item.imageUrl" class="h-8 w-8 object-contain" />
            <span>{{ item.name ?? item.setNo }}</span>
          </NuxtLink>
        </div>
        <p v-if="(isGrid ? unplacedItems : space.items).length === 0" class="text-sm text-imperial-muted">Aucun set.</p>
      </div>
    </template>

    <p v-else class="text-sm text-imperial-muted">Espace introuvable.</p>
  </div>
</template>
