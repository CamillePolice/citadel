<script setup lang="ts">
import type { StorageSpaceItem, ConditionItem } from '~/types/api'

const props = defineProps<{
  rows: number
  cols: number
  items: StorageSpaceItem[]
  selectedRow?: number | null
  selectedCol?: number | null
  interactive?: boolean
}>()

const emit = defineEmits<{
  'cell-click': [row: number, col: number]
}>()

const conditionLabels: Record<ConditionItem, string> = { new_sealed: 'NS', used: 'UO' }

function itemAt(row: number, col: number): StorageSpaceItem | undefined {
  return props.items.find((i) => i.storageRow === row && i.storageCol === col)
}

function isSelected(row: number, col: number): boolean {
  return props.selectedRow === row && props.selectedCol === col
}
</script>

<template>
  <div class="overflow-auto">
    <div class="inline-grid gap-1" :style="{ gridTemplateColumns: `repeat(${cols}, minmax(80px, 1fr))` }">
      <template v-for="r in rows" :key="r">
        <div
          v-for="c in cols"
          :key="`${r}-${c}`"
          class="relative flex min-h-[80px] flex-col items-center justify-center rounded border text-xs transition-colors"
          :class="[
            isSelected(r - 1, c - 1)
              ? 'border-imperial-accent bg-imperial-accent/10'
              : itemAt(r - 1, c - 1)
                ? 'border-imperial-border bg-imperial-surface cursor-pointer hover:border-imperial-accent/50'
                : interactive
                  ? 'border-imperial-border/40 bg-imperial-bg cursor-pointer hover:border-imperial-accent/50 hover:bg-imperial-surface'
                  : 'border-imperial-border/30 bg-imperial-bg',
          ]"
          @click="interactive ? emit('cell-click', r - 1, c - 1) : undefined"
        >
          <template v-if="itemAt(r - 1, c - 1)">
            <NuxtLink
              v-if="!interactive"
              :to="`/sets/${itemAt(r - 1, c - 1)!.setNo}`"
              class="flex w-full flex-col items-center gap-1 p-1"
              @click.stop
            >
              <img
                v-if="itemAt(r - 1, c - 1)!.imageUrl"
                :src="itemAt(r - 1, c - 1)!.imageUrl!"
                class="h-10 w-10 object-contain"
              />
              <span class="text-center leading-tight line-clamp-2">{{
                itemAt(r - 1, c - 1)!.name ?? itemAt(r - 1, c - 1)!.setNo
              }}</span>
              <span
                v-if="itemAt(r - 1, c - 1)!.condition"
                class="rounded bg-imperial-border/40 px-1 py-0.5 text-[10px] text-imperial-muted"
              >
                {{ conditionLabels[itemAt(r - 1, c - 1)!.condition!] }}
              </span>
            </NuxtLink>
            <div v-else class="flex w-full flex-col items-center gap-1 p-1">
              <img
                v-if="itemAt(r - 1, c - 1)!.imageUrl"
                :src="itemAt(r - 1, c - 1)!.imageUrl!"
                class="h-10 w-10 object-contain"
              />
              <span class="text-center leading-tight line-clamp-2">{{
                itemAt(r - 1, c - 1)!.name ?? itemAt(r - 1, c - 1)!.setNo
              }}</span>
            </div>
          </template>
          <template v-else>
            <span class="text-imperial-border">{{ interactive ? '+' : '' }}</span>
            <span class="absolute bottom-0.5 right-1 text-[10px] text-imperial-border/50">{{ r - 1 }},{{ c - 1 }}</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
