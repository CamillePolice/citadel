<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { CatalogSet, CreateItemPayload, ConditionItem, Completeness } from '~/types/api'
import { useItemsStore } from '~/stores/items'
import { formatCurrency } from '~/utils/format'

const emit = defineEmits<{ (e: 'close' | 'created'): void }>()
const items = useItemsStore()

const step = ref<1 | 2>(1)
const setNo = ref('')
const lookupLoading = ref(false)
const lookupError = ref<string | null>(null)
const preview = ref<CatalogSet | null>(null)
const saving = ref(false)
const saveError = ref<string | null>(null)

const form = reactive<Omit<CreateItemPayload, 'setNo'>>({
  condition: 'new_sealed',
  quantity: 1,
  completeness: 'complete',
  hasBox: true,
  hasInstructions: true,
  hasMinifigs: true,
  purchasePrice: null,
  purchaseDate: null,
  storageLocation: null,
  notes: null,
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

async function doLookup() {
  if (!setNo.value.trim()) return
  lookupLoading.value = true
  lookupError.value = null
  try {
    preview.value = await $fetch<CatalogSet>(`/api/sets/${setNo.value.trim()}/lookup`)
    step.value = 2
  } catch {
    lookupError.value = 'Set introuvable'
    preview.value = null
  } finally {
    lookupLoading.value = false
  }
}

async function save() {
  if (!preview.value) return
  saving.value = true
  saveError.value = null
  try {
    await items.addItem({ setNo: preview.value.setNo, ...form })
    emit('created')
    emit('close')
  } catch {
    saveError.value = "Échec de l'enregistrement"
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="emit('close')">
    <div class="w-full max-w-lg rounded-lg border border-imperial-border bg-imperial-surface p-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Ajouter un set</h2>
        <button class="text-imperial-muted hover:text-imperial-text" @click="emit('close')">✕</button>
      </div>

      <div v-if="step === 1" class="space-y-3">
        <label class="block text-sm text-imperial-muted">Numéro de set</label>
        <input
          v-model="setNo"
          type="text"
          placeholder="ex: 10497-1"
          class="w-full rounded border border-imperial-border bg-imperial-bg px-3 py-2 text-imperial-text"
          @keyup.enter="doLookup"
        />
        <p v-if="lookupError" class="text-sm text-loss">{{ lookupError }}</p>
        <button
          :disabled="lookupLoading || !setNo.trim()"
          class="w-full rounded bg-imperial-accent px-3 py-2 font-medium text-white disabled:opacity-50"
          @click="doLookup"
        >
          {{ lookupLoading ? 'Recherche...' : 'Rechercher' }}
        </button>
      </div>

      <div v-else-if="step === 2 && preview" class="space-y-4">
        <div class="flex gap-3 rounded border border-imperial-border bg-imperial-bg p-3">
          <img
            v-if="preview.imageUrl"
            :src="preview.imageUrl"
            :alt="preview.name ?? preview.setNo"
            class="h-16 w-16 rounded object-contain"
          />
          <div>
            <p class="font-medium">{{ preview.name ?? preview.setNo }}</p>
            <p class="text-sm text-imperial-muted">
              {{ preview.theme }} · {{ preview.year }} · {{ preview.pieceCount }} pièces
            </p>
            <p v-if="preview.retailPrice" class="text-sm text-imperial-muted">
              PVC: {{ formatCurrency(preview.retailPrice) }}
            </p>
          </div>
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
        <div>
          <label class="block text-xs text-imperial-muted">Notes</label>
          <textarea
            v-model="form.notes"
            rows="2"
            class="w-full rounded border border-imperial-border bg-imperial-bg px-2 py-1.5"
          />
        </div>

        <p v-if="saveError" class="text-sm text-loss">{{ saveError }}</p>
        <div class="flex gap-2">
          <button class="rounded border border-imperial-border px-3 py-2" @click="step = 1">Retour</button>
          <button
            :disabled="saving"
            class="flex-1 rounded bg-imperial-accent px-3 py-2 font-medium text-white disabled:opacity-50"
            @click="save"
          >
            {{ saving ? 'Enregistrement...' : 'Ajouter à la collection' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
