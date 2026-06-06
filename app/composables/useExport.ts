import { ref } from 'vue'

export function useExport() {
  const exporting = ref(false)
  const error = ref<string | null>(null)

  async function exportXlsx() {
    exporting.value = true
    error.value = null
    try {
      const blob = await $fetch<Blob>('/api/export/xlsx', {
        method: 'POST',
        responseType: 'blob',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `citadel-export-${stamp}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      error.value = "Échec de l'export"
    } finally {
      exporting.value = false
    }
  }

  return { exporting, error, exportXlsx }
}
