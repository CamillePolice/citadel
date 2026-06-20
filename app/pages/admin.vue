<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const { data: runs, pending, refresh } = await useFetch('/api/admin/runs')

function duration(run: { startedAt: string; finishedAt: string | null }): string {
  if (!run.finishedAt) return '—'
  const ms = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
  return (ms / 1000).toFixed(1) + 's'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

function parseErrors(raw: string | null): { setNo: string; error: string }[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

const expanded = ref<string | null>(null)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Admin — Runs worker</h1>
      <button
        class="rounded border border-imperial-border px-3 py-2 text-sm"
        :disabled="pending"
        @click="refresh()"
      >
        Actualiser
      </button>
    </div>

    <div class="rounded-lg border border-imperial-border bg-imperial-surface overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-imperial-border text-imperial-muted text-left">
            <th class="px-4 py-2">Début</th>
            <th class="px-4 py-2">Durée</th>
            <th class="px-4 py-2">OK</th>
            <th class="px-4 py-2">Échecs</th>
            <th class="px-4 py-2">Erreurs</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="runs && runs.length">
            <template v-for="run in runs" :key="run.id">
              <tr class="border-b border-imperial-border last:border-0 hover:bg-imperial-muted/5">
                <td class="px-4 py-2 whitespace-nowrap">{{ formatDate(run.startedAt) }}</td>
                <td class="px-4 py-2 whitespace-nowrap">{{ duration(run) }}</td>
                <td class="px-4 py-2 text-gain">{{ run.ok ?? '—' }}</td>
                <td class="px-4 py-2" :class="run.failed ? 'text-loss' : ''">{{ run.failed ?? '—' }}</td>
                <td class="px-4 py-2">
                  <button
                    v-if="parseErrors(run.errors).length"
                    class="underline text-imperial-muted text-xs"
                    @click="expanded = expanded === run.id ? null : run.id"
                  >
                    {{ parseErrors(run.errors).length }} erreur(s)
                  </button>
                  <span v-else class="text-imperial-muted text-xs">—</span>
                </td>
              </tr>
              <tr v-if="expanded === run.id" :key="run.id + '-errors'" class="bg-imperial-surface">
                <td colspan="5" class="px-4 py-2">
                  <ul class="space-y-1 text-xs text-loss font-mono">
                    <li v-for="e in parseErrors(run.errors)" :key="e.setNo">
                      {{ e.setNo }}: {{ e.error }}
                    </li>
                  </ul>
                </td>
              </tr>
            </template>
          </template>
          <tr v-else-if="!pending">
            <td colspan="5" class="px-4 py-6 text-center text-imperial-muted">Aucun run enregistré.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
