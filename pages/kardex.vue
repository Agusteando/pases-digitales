
<template>
  <div class="p-6 md:p-10 max-w-[1400px] mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    <header class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Kardex de Asistencia</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Vista institucional global exportable a Excel.</p>
      </div>
      <button @click="exportKardex" :disabled="isExporting" class="px-5 py-3 bg-white/80 backdrop-blur-md border border-white text-slate-700 font-black rounded-2xl shadow-sm hover:border-brand-500 hover:text-brand-600 hover:shadow-md transition-all flex items-center justify-center gap-2 outline-none">
        <Loader2 v-if="isExporting" class="w-5 h-5 animate-spin" />
        <Download v-else class="w-5 h-5" />
        <span>Exportar Excel</span>
      </button>
    </header>

    <div class="glass-panel p-5 rounded-[2rem] mb-8 flex flex-col sm:flex-row gap-5 items-center shrink-0">
      <div class="relative w-full sm:flex-1">
         <select v-model="selectedDepto" @change="fetchRecords" class="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-2xl text-sm font-bold outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] appearance-none cursor-pointer">
            <option value="">Todos los departamentos</option>
            <option v-for="d in departamentos" :key="d" :value="d">{{ d }}</option>
         </select>
      </div>
    </div>

    <div class="glass-panel rounded-[2.5rem] flex-1 flex flex-col overflow-hidden min-h-[400px]">
      <div class="overflow-x-auto custom-scrollbar flex-1">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-white/40 border-b border-white/60 text-slate-500 text-[10px] uppercase tracking-widest font-black">
              <th class="px-6 py-5 rounded-tl-[2.5rem]">Fecha</th>
              <th class="px-6 py-5">Colaborador</th>
              <th class="px-6 py-5">Departamento</th>
              <th class="px-6 py-5">Incidencia</th>
              <th class="px-6 py-5">A Descontar</th>
              <th class="px-6 py-5 rounded-tr-[2.5rem]">Observaciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/50">
            <tr v-if="pending" class="bg-transparent">
              <td colspan="6" class="px-6 py-20 text-center">
                <Loader2 class="w-10 h-10 animate-spin text-brand-500 mx-auto" />
              </td>
            </tr>
            <tr v-else-if="!records.length" class="bg-transparent">
              <td colspan="6" class="px-6 py-20 text-center">
                <p class="text-slate-600 font-bold">Sin registros de asistencia.</p>
              </td>
            </tr>
            <tr v-else v-for="(rec, i) in records" :key="i" class="bg-transparent hover:bg-white/50 transition-colors">
              <td class="px-6 py-5 text-sm font-bold text-slate-600">{{ rec.fecha }}</td>
              <td class="px-6 py-5 text-sm font-black text-slate-800">{{ rec.nombre }}</td>
              <td class="px-6 py-5 text-xs font-bold text-slate-700">{{ rec.departamento || rec.centro_de_costo }}</td>
              <td class="px-6 py-5 text-sm font-bold" :class="rec.incidencia === 'Falta' ? 'text-casita-red' : (rec.incidencia?.includes('Retardo') ? 'text-casita-peach' : 'text-slate-600')">{{ rec.incidencia }}</td>
              <td class="px-6 py-5 text-xs font-black" :class="rec.horas_descontar && rec.horas_descontar !== '0 Hrs 0 Min' ? 'text-casita-red-dark' : 'text-slate-500'">{{ rec.horas_descontar || '--' }}</td>
              <td class="px-6 py-5 text-xs text-slate-500">{{ rec.observaciones }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Download, Loader2 } from 'lucide-vue-next'
import ExcelJS from 'exceljs'
import dayjs from 'dayjs'

const departamentos = ref([])
const selectedDepto = ref('')
const records = ref([])
const pending = ref(false)
const isExporting = ref(false)

const loadDepartamentos = async () => {
  try {
    const res = await $fetch('/api/kardex/valores-unicos/departamento')
    if (res && res.valores) {
      departamentos.value = res.valores.sort()
    }
  } catch (e) {}
}

const fetchRecords = async () => {
  pending.value = true
  try {
    const query = { limite: 200 }
    if (selectedDepto.value) query.departamento = selectedDepto.value
    
    const res = await $fetch('/api/kardex', { query })
    records.value = Array.isArray(res) ? res : []
  } catch (e) {
    records.value = []
  } finally {
    pending.value = false
  }
}

const exportKardex = async () => {
  isExporting.value = true
  try {
    const query = { limite: 10000 }
    if (selectedDepto.value) query.departamento = selectedDepto.value
    
    const data = await $fetch('/api/kardex', { query })
    
    if (!data || data.length === 0) {
      alert('No hay datos para exportar.')
      return
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Kardex')

    worksheet.columns = [
      { header: 'NUMERO_EMPLEADO', key: 'numero_de_empleado', width: 15 },
      { header: 'NUMERO_NOMINA', key: 'numero_de_nomina', width: 15 },
      { header: 'NOMBRE', key: 'nombre', width: 35 },
      { header: 'DEPARTAMENTO', key: 'departamento', width: 25 },
      { header: 'CENTRO_DE_COSTO', key: 'centro_de_costo', width: 20 },
      { header: 'HORARIO', key: 'horario', width: 20 },
      { header: 'FECHA', key: 'fecha', width: 15 },
      { header: 'INCIDENCIA', key: 'incidencia', width: 20 },
      { header: 'ENTRADA', key: 'registro_de_entrada', width: 12 },
      { header: 'SALIDA', key: 'registro_de_salida', width: 12 },
      { header: 'HORAS_TRABAJADAS', key: 'horas_trabajadas', width: 15 },
      { header: 'HORAS_DESCONTAR', key: 'horas_descontar', width: 15 },
      { header: 'OBSERVACIONES', key: 'observaciones', width: 30 }
    ]

    worksheet.addRows(data)

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Kardex_${selectedDepto.value || 'General'}_${dayjs().format('YYYY-MM-DD')}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

  } catch (err) {
    alert('Ocurrió un error al generar el archivo Excel.')
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  loadDepartamentos()
  fetchRecords()
})
</script>