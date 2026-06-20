<script setup lang="ts">
import { reactive, ref, onMounted, computed, watch } from 'vue'
import type { Item, UpdateItemPayload, ConditionItem, Completeness, StorageSpace } from '~/types/api'
import { useItemsStore } from '~/stores/items'

const props = defineProps<{ item: Item }>()
const emit = defineEmits<{ (e: 'close' | 'saved'): void }>()
const items = useItemsStore()

const saving = ref(false)
const error = ref<string | null>(null)

const storageSpaces = ref<StorageSpace[]>([])
const selectedSpaceId = ref<string | null>(props.item.storageSpaceId ?? null)
const selectedRow = ref<number | null>(props.item.storageRow ?? null)
const selectedCol = ref<number | null>(props.item.storageCol ?? null)
const showGrid = ref(false)

const selectedSpace = computed(() => storageSpaces.value.find((s) => s.id === selectedSpaceId.value) ?? null)
const spaceIsGrid = computed(() => selectedSpace.value?.rows && selectedSpace.value?.cols)

watch(selectedSpaceId, () => {
  selectedRow.value = null
  selectedCol.value = null
  showGrid.value = false
})

const form = reactive<UpdateItemPayload>({
  condition: props.item.condition ?? 'new_sealed',
  quantity: props.item.quantity,
  completeness: props.item.completeness ?? 'na',
  hasBox: props.item.hasBox ?? true,
  hasInstructions: props.item.hasInstructions ?? true,
  hasMinifigs: props.item.hasMinifigs ?? true,
  purchasePrice: props.item.purchasePrice,
  purchaseDate: props.item.purchaseDate,
  storageLocation: props.item.storageLocation,
  notes: props.item.notes,
})

const conditions: { value: ConditionItem; label: string }[] = [
  { value: 'new_sealed', label: 'Neuf scellé' },
  { value: 'used', label: 'Occasion' },
]
const completenessOpts: { value: Completeness; label: string }[] = [
  { value: 'complete', label: 'Complet' },
  { value: 'incomplete', label: 'Incomplet' },
  { value: 'na', label: 'N/A' },
]

function onCellClick(row: number, col: number) {
  selectedRow.value = row
  selectedCol.value = col
  showGrid.value = false
}

function clearPosition() {
  selectedRow.value = null
  selectedCol.value = null
}

async function save() {
  saving.value = true
  error.value = null
  try {
    await items.updateItem(props.item.id, {
      ...form,
      storageSpaceId: selectedSpaceId.value,
      storageRow: selectedRow.value,
      storageCol: selectedCol.value,
    })
    emit('saved')
    emit('close')
  } catch {
    error.value = 'Échec de la modification'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  storageSpaces.value = await $fetch<StorageSpace[]>('/api/storage')
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="emit('close')">
    <div
      class="w-full max-w-lg overflow-y-auto rounded-lg border border-imperial-border bg-imperial-surface p-5 max-h-[90vh]"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Modifier · {{ item.name ?? item.setNo }}</h2>
        <button class="text-imperial-muted hover:text-imperial-text" @click="emit('close')">✕</button>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-imperial-muted">État</label>
          <select
            v-model="form.condition"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
          >
            <option v-for="c in conditions" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-imperial-muted">Complétude</label>
          <select
            v-model="form.completeness"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
          >
            <option v-for="c in completenessOpts" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-imperial-muted">Quantité</label>
          <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
          />
        </div>
        <div>
          <label class="block text-xs text-imperial-muted">Prix d'achat (€)</label>
          <input
            v-model.number="form.purchasePrice"
            type="number"
            step="0.01"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
          />
        </div>
        <div>
          <label class="block text-xs text-imperial-muted">Date d'achat</label>
          <input
            v-model="form.purchaseDate"
            type="date"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
          />
        </div>
        <div>
          <label class="block text-xs text-imperial-muted">Label libre (optionnel)</label>
          <input
            v-model="form.storageLocation"
            type="text"
            placeholder="ex: boîte bleue"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
          />
        </div>
      </div>

      <div class="mt-3">
        <label class="block text-xs text-imperial-muted">Espace de stockage</label>
        <select
          v-model="selectedSpaceId"
          class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5 text-sm"
        >
          <option :value="null">— Aucun espace —</option>
          <option v-for="s in storageSpaces" :key="s.id" :value="s.id">
            {{ s.name }} ({{ s.type }}<template v-if="s.rows && s.cols"> · {{ s.rows }}×{{ s.cols }}</template
            >)
          </option>
        </select>

        <template v-if="selectedSpaceId && spaceIsGrid">
          <div class="mt-2 flex items-center gap-2">
            <span class="text-xs text-imperial-muted">
              Position :
              <span v-if="selectedRow != null && selectedCol != null" class="font-medium text-imperial-text">
                rangée {{ selectedRow }}, col {{ selectedCol }}
              </span>
              <span v-else>non définie</span>
            </span>
            <button class="rounded border border-imperial-border px-2 py-0.5 text-xs" @click="showGrid = !showGrid">
              {{ showGrid ? 'Fermer' : 'Choisir position' }}
            </button>
            <button
              v-if="selectedRow != null"
              class="text-xs text-imperial-muted hover:text-loss"
              @click="clearPosition"
            >
              ✕
            </button>
          </div>
          <div v-if="showGrid" class="mt-2 rounded border border-imperial-border p-2">
            <StorageGrid
              :rows="selectedSpace!.rows!"
              :cols="selectedSpace!.cols!"
              :items="[]"
              :selected-row="selectedRow"
              :selected-col="selectedCol"
              :interactive="true"
              @cell-click="onCellClick"
            />
          </div>
        </template>
      </div>

      <div class="mt-3">
        <label class="block text-xs text-imperial-muted">Notes</label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
        />
      </div>

      <div class="mt-3 flex gap-4">
        <label class="flex items-center gap-1.5 text-sm"><input v-model="form.hasBox" type="checkbox" /> Boîte</label>
        <label class="flex items-center gap-1.5 text-sm"
          ><input v-model="form.hasInstructions" type="checkbox" /> Instructions</label
        >
        <label class="flex items-center gap-1.5 text-sm"
          ><input v-model="form.hasMinifigs" type="checkbox" /> Minifigs</label
        >
      </div>

      <p v-if="error" class="mt-3 text-sm text-loss">{{ error }}</p>
      <div class="mt-4 flex gap-2">
        <button class="rounded border border-imperial-border px-3 py-2" @click="emit('close')">Annuler</button>
        <button
          :disabled="saving"
          class="flex-1 rounded bg-imperial-accent px-3 py-2 font-medium text-white disabled:opacity-50"
          @click="save"
        >
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>
</template>
