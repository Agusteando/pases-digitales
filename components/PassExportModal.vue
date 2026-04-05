<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
      
      <header class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative">
        <div>
          <h3 class="text-xl font-black text-slate-900 tracking-tight">Exportar Reporte</h3>
          <p class="text-xs font-bold text-slate-500 mt-1">Generación de archivo Excel (.xlsx)</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none">
          <X class="w-5 h-5" />
        </button>
      </header>

      <div class="p-8 space-y-6 bg-slate-50/30">
        <div class="space-y-2">
          <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Seleccionar Plantel</label>
          <select v-model="form.plantel" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-white shadow-sm">
            <option value="" disabled>Selecciona un origen...</option>
            <option v-for="p in planteles" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-5">
          <div class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Desde</label>
            <input type="date" v-model="form.startDate" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-white shadow-sm" />
          </div>
          <div class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Hasta</label>
            <input type="date" v-model="form.endDate" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-white shadow-sm" />
          </div>
        </div>
      </div>

      <footer class="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
        <button @click="$emit('close')" :disabled="isExporting" class="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none disabled:opacity-50 border border-transparent hover:border-slate-200">
          Cancelar
        </button>
        <button @click="handleExport" :disabled="!isValid || isExporting" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:hover:bg-brand-600 flex items-center gap-2 outline-none">
          <Loader2 v-if="isExporting" class="w-4 h-4 animate-spin" />
          <Download v-else class="w-4 h-4" />
          <span>{{ isExporting ? 'Procesando...' : 'Descargar' }}</span>
        </button>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { X, Loader2, Download } from 'lucide-vue-next'
import dayjs from 'dayjs'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const planteles = [
  '001 - Default', '4 - CT Fiscal', '3 - ST Fiscal', '8 - DM Fiscal', '2 - PT Fiscal', 
  '7 - CM Fiscal', '5 - PM Fiscal', '14 - CM Asimilados', '16 - ISM', '10 - ST Asimilados', 
  '23 - ISM Fiscal', '15 - DM Asimilados', '9 - Asimilados', '12 - PM Asimilados', 
  '6 - SM Fiscal', '25 - CO Fiscal', '24 - Pres Met Fiscal', '11 - CT Asimilados', 
  '13 - SM Asimilados', '26 - CO Asimilados', '22 - PT Asimilados', '28 - DC FISCAL',
  'PT', 'PM', 'ST', 'SM', 'CT', 'CM', 'DM', 'CO', 'KT', 'KM'
]

const form = ref({
  plantel: '',
  startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
  endDate: dayjs().endOf('month').format('YYYY-MM-DD')
})

const isExporting = ref(false)

const isValid = computed(() => form.value.plantel && form.value.startDate && form.value.endDate)

const handleExport = async () => {
  if (!isValid.value || isExporting.value) return
  isExporting.value = true

  try {
    const res = await $fetch('/api/passes/export', {
      method: 'POST',
      body: form.value
    })

    if (res && res.base64) {
      const byteCharacters = atob(res.base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Reporte_${form.value.plantel.replace(/\s+/g, '_')}_${form.value.startDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      emit('close')
    } else {
      throw new Error('Formato de respuesta inválido')
    }
  } catch (error) {
    console.error('Export error:', error)
    alert('Ocurrió un error al intentar exportar los registros. Por favor, intente nuevamente.')
  } finally {
    isExporting.value = false
  }
}
</script>