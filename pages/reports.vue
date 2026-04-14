<template>
  <div class="p-6 md:p-10 max-w-[1400px] mx-auto h-full flex flex-col relative z-10">
    <header class="mb-8 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Reportes de Personal</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Cruce masivo de asistencia, omisiones y pases digitales (R.P.)</p>
      </div>
    </header>

    <!-- Filters Panel -->
    <div class="glass-panel p-6 rounded-[2rem] mb-6 shrink-0 shadow-sm border border-white flex flex-col md:flex-row items-end gap-5">
      
      <div class="w-full md:w-1/3 space-y-2">
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Building2 class="w-3 h-3" /> Plantel
        </label>
        
        <!-- Vista para Administrador de Plantel (Bloqueada) -->
        <div v-if="!isAdmin && authPlanteles.length > 0" class="w-full px-4 py-3 bg-white/40 border border-white rounded-xl text-sm font-black text-slate-600 shadow-sm cursor-not-allowed">
          {{ selectedPlantel }}
        </div>
        
        <!-- Vista para Administrador Global (Dropdown) -->
        <select v-else v-model="selectedPlantel" class="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl text-sm font-bold outline-none transition-all shadow-sm cursor-pointer text-slate-800">
          <option value="" disabled>Selecciona el plantel destino...</option>
          <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>

      <div class="w-full md:w-1/4 space-y-2">
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar class="w-3 h-3" /> Desde
        </label>
        <input type="date" v-model="fechaInicio" class="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl text-sm font-bold outline-none transition-all shadow-sm text-slate-800" />
      </div>

      <div class="w-full md:w-1/4 space-y-2">
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar class="w-3 h-3" /> Hasta
        </label>
        <input type="date" v-model="fechaFin" class="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl text-sm font-bold outline-none transition-all shadow-sm text-slate-800" />
      </div>

      <div class="w-full md:w-auto flex items-center gap-3">
         <button @click="loadPreview" :disabled="!isFormValid || pendingPreview" class="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all outline-none flex items-center justify-center gap-2">
           <Loader2 v-if="pendingPreview" class="w-4 h-4 animate-spin text-white/80" />
           <Search v-else class="w-4 h-4 text-white/80" />
           <span>Generar Vista</span>
         </button>
      </div>
    </div>

    <!-- Preview & Export Module -->
    <div class="glass-panel rounded-[2.5rem] flex-1 flex flex-col overflow-hidden min-h-[400px] border border-white shadow-sm relative">
       
       <!-- Internal Header -->
       <div class="px-6 py-5 border-b border-white/60 bg-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
         <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <FileSpreadsheet class="w-4 h-4 text-brand-500" />
            Vista Previa de Extracción
         </h3>
         
         <button @click="exportReport" :disabled="!previewData || isExporting" class="px-6 py-3 bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all outline-none flex items-center justify-center gap-2">
           <Loader2 v-if="isExporting" class="w-4 h-4 animate-spin text-white/80" />
           <Download v-else class="w-4 h-4 text-white/80" />
           <span>Descargar Reporte (Excel)</span>
         </button>
       </div>

       <!-- Table Content -->
       <div class="flex-1 overflow-auto custom-scrollbar p-0 bg-white/20">
         
         <div v-if="pendingPreview" class="flex flex-col items-center justify-center h-full py-20 text-slate-400">
           <Loader2 class="w-12 h-12 animate-spin mb-4 text-brand-500" />
           <p class="text-sm font-black text-slate-700">Procesando registros en el motor Kardex externo...</p>
           <p class="text-[10px] font-bold uppercase tracking-widest mt-1">Dependiendo del tamaño de la nómina, esto puede demorar unos segundos.</p>
         </div>
         
         <div v-else-if="!previewData" class="flex flex-col items-center justify-center h-full py-20 text-slate-400">
            <Search class="w-14 h-14 mb-4 opacity-20" />
            <p class="text-sm font-black text-slate-700">Esperando parámetros de extracción</p>
            <p class="text-[10px] font-bold uppercase tracking-widest mt-1">Selecciona el plantel y las fechas para consultar los datos.</p>
         </div>
         
         <div v-else-if="previewData.empleados?.length === 0" class="flex flex-col items-center justify-center h-full py-20 text-slate-400">
            <FileX class="w-14 h-14 mb-4 opacity-20" />
            <p class="text-sm font-black text-slate-700">Sin hallazgos operativos</p>
            <p class="text-[10px] font-bold uppercase tracking-widest mt-1">No se encontraron registros para este periodo en el plantel seleccionado.</p>
         </div>
         
         <table v-else class="w-full text-left border-collapse whitespace-nowrap">
            <thead class="bg-white/70 sticky top-0 backdrop-blur-xl z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <tr class="text-slate-500 text-[10px] uppercase tracking-widest font-black border-b border-slate-200/60">
                <th class="px-6 py-5">Colaborador</th>
                <th class="px-6 py-5 text-center">Faltas Injustificadas</th>
                <th class="px-6 py-5 text-center">Retardos</th>
                <th class="px-6 py-5 text-center">Min. de Descuento</th>
                <th class="px-6 py-5 text-center">Días de Registro</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/50">
              <tr v-for="(emp, i) in previewData.empleados" :key="i" class="hover:bg-white/50 transition-colors">
                <td class="px-6 py-4">
                  <p class="text-sm font-black text-slate-800 tracking-tight">{{ emp.identidad?.nombre || 'Desconocido' }}</p>
                  <p class="text-[10px] font-bold text-slate-500 mt-0.5">{{ emp.identidad?.curp || 'CURP no disponible' }}</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-sm font-black" :class="emp.kpis?.unjFaltas > 0 ? 'text-casita-red' : 'text-slate-400'">{{ emp.kpis?.unjFaltas || 0 }}</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-sm font-black" :class="emp.kpis?.unjRetardos > 0 ? 'text-casita-peach' : 'text-slate-400'">{{ emp.kpis?.unjRetardos || 0 }}</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-sm font-black" :class="emp.kpis?.unjMins > 0 ? 'text-slate-700' : 'text-slate-400'">{{ emp.kpis?.unjMins || 0 }}m</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-sm font-black text-casita-green-dark">{{ emp.enrichedKardex?.length || 0 }}</span>
                </td>
              </tr>
            </tbody>
         </table>
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Loader2, Search, Download, FileSpreadsheet, FileX, Building2, Calendar } from 'lucide-vue-next'
import dayjs from 'dayjs'

const { user } = useAuth()
const { data: profile } = useFetch('/api/auth/profile')
const { data: plantelesList } = useFetch('/api/catalogs/planteles', { default: () => [] })

const isAdmin = computed(() => user.value?.is_admin || false)
const authPlanteles = computed(() => profile.value?.admonPlanteles || [])

const selectedPlantel = ref('')
const fechaInicio = ref(dayjs().subtract(15, 'day').format('YYYY-MM-DD'))
const fechaFin = ref(dayjs().format('YYYY-MM-DD'))

const previewData = ref(null)
const pendingPreview = ref(false)
const isExporting = ref(false)

const isFormValid = computed(() => selectedPlantel.value && fechaInicio.value && fechaFin.value)

// Asignación automática del Plantel según el Rol
watch([isAdmin, authPlanteles, plantelesList], () => {
  if (!selectedPlantel.value) {
    if (!isAdmin.value && authPlanteles.value.length > 0) {
      selectedPlantel.value = authPlanteles.value[0]
    } else if (isAdmin.value && plantelesList.value?.length > 0) {
      selectedPlantel.value = plantelesList.value[0]
    }
  }
})

// Seguridad estricta en el Front: Bloqueo para usuarios no autorizados
watch([user, profile], () => {
  if (user.value && profile.value) {
    if (!isAdmin.value && authPlanteles.value.length === 0) {
      navigateTo('/', { replace: true })
    }
  }
}, { immediate: true })

const loadPreview = async () => {
  if (!isFormValid.value) return
  
  pendingPreview.value = true
  previewData.value = null
  
  try {
    const data = await $fetch('/api/reports/preview', {
      query: {
        plantel: selectedPlantel.value,
        fecha_inicio: fechaInicio.value,
        fecha_fin: fechaFin.value
      }
    })
    previewData.value = data
  } catch (e) {
    console.error('Error al generar la vista previa', e)
    alert(e.data?.message || 'Ocurrió un error de comunicación con el motor de reportes.')
  } finally {
    pendingPreview.value = false
  }
}

const exportReport = async () => {
  if (!isFormValid.value || isExporting.value) return
  
  isExporting.value = true
  
  try {
    const queryParams = new URLSearchParams({
      plantel: selectedPlantel.value,
      fecha_inicio: fechaInicio.value,
      fecha_fin: fechaFin.value
    })
    
    // El fetch atrapa el archivo binario del proxy local
    const response = await fetch(`/api/reports/export?${queryParams.toString()}`)
    
    if (!response.ok) {
       const err = await response.json().catch(() => ({}))
       throw new Error(err.message || 'El motor externo rechazó la solicitud de descarga.')
    }
    
    const blob = await response.blob()
    
    // Tratamos de respetar el nombre de archivo dictado por el backend FastAPI, 
    // de lo contrario caemos en el nombre estructurado por defecto.
    let filename = `Reporte_RP_${selectedPlantel.value.replace(/\s+/g, '_')}_${fechaInicio.value}.xlsx`
    const disposition = response.headers.get('Content-Disposition')
    
    if (disposition && disposition.includes('filename=')) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
  } catch (e) {
    console.error('Error al exportar el documento', e)
    alert(e.message || 'Fallo inesperado al descargar el archivo Excel.')
  } finally {
    isExporting.value = false
  }
}
</script>