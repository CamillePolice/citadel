<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { Item, UpdateItemPayload, ConditionItem, Completeness } from '~/types/api'
import { useItemsStore } from '~/stores/items'

const props = defineProps<{ item: Item }>()
const emit = defineEmits<{ (e: 'close' | 'saved'): void }>()
const items = useItemsStore()

const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive<UpdateItemPayload>({
  condition: props.item.condition ?? 'new_sealed',
  quantity: props.item.quantity,
  completeness: props.item.completeness ?? 'na',
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

async function save() {
  saving.value = true
  error.value = null
  try {
    await items.updateItem(props.item.id, { ...form })
    emit('saved')
    emit('close')
  } catch {
    error.value = 'Échec de la modification'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="emit('close')">
    <div class="w-full max-w-lg rounded-lg border border-imperial-border bg-imperial-surface p-5">
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
          <label class="block text-xs text-imperial-muted">Emplacement</label>
          <input
            v-model="form.storageLocation"
            type="text"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
          />
        </div>
      </div>
      <div class="mt-3">
        <label class="block text-xs text-imperial-muted">Notes</label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
        />
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
