<template>
  <div class="p-6 md:p-10 max-w-[1400px] mx-auto h-full flex flex-col relative z-10">
    <header class="mb-8 shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Asistencia</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Reportes</p>
      </div>
    </header>

    <!-- Filters Panel -->
    <div class="glass-panel p-6 rounded-[2rem] mb-6 shrink-0 shadow-sm border border-white flex flex-col md:flex-row items-end gap-5 relative z-20">
      
      <div class="w-full md:w-1/3 space-y-2">
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Building2 class="w-3 h-3" /> Plantel
        </label>
        
        <div v-if="!isAdmin && authPlanteles.length > 0" class="w-full px-4 py-3 bg-white/40 border border-white rounded-xl text-sm font-black text-slate-600 shadow-sm cursor-not-allowed">
          {{ selectedPlantel }}
        </div>
        
        <select v-else v-model="selectedPlantel" class="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl text-sm font-bold outline-none transition-all shadow-sm cursor-pointer text-slate-800">
          <option value="" disabled>Selecciona...</option>
          <option v-for="p in plantelesList" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>

      <div class="w-full md:w-1/4 space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar class="w-3 h-3" /> Desde
          </label>
          <!-- Botones de Navegación Rápida & Ajuste -->
          <div class="flex items-center gap-1.5" v-if="periodosData && !pendingPeriodos">
            <button @click="setPeriod('corte')" type="button" class="text-[9px] font-black uppercase tracking-widest transition-colors flex items-center outline-none px-2 py-1 rounded-md shadow-sm border"
              :class="activePeriod === 'corte' ? 'bg-brand-100 text-brand-800 border-brand-200' : 'bg-white text-slate-500 hover:text-brand-600 border-slate-200'">
              Último Corte
            </button>
            <button @click="setPeriod('actual')" type="button" class="text-[9px] font-black uppercase tracking-widest transition-colors flex items-center outline-none px-2 py-1 rounded-md shadow-sm border"
              :class="activePeriod === 'actual' ? 'bg-brand-100 text-brand-800 border-brand-200' : 'bg-white text-slate-500 hover:text-brand-600 border-slate-200'">
              Actual
            </button>
            
            <!-- Botón de Ajuste (Sobrescribe la última fecha de corte en el backend) -->
            <div class="relative overflow-hidden flex items-center justify-center rounded-md shadow-sm border transition-colors cursor-pointer" 
                 :class="activePeriod === 'ajuste' ? 'bg-brand-100 border-brand-200 text-brand-800' : 'bg-white border-slate-200 text-slate-500 hover:text-brand-600'">
               <button type="button" class="text-[9px] font-black uppercase tracking-widest flex items-center gap-1 outline-none px-2 py-1 pointer-events-none">
                 <Settings2 class="w-3 h-3" /> Ajustar
               </button>
               <input type="date" v-model="customCorteInput" @change="applyCustomCorte" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Forzar fecha de corte atípica" />
            </div>
          </div>
          <div v-else-if="pendingPeriodos" class="flex items-center gap-1.5 px-2">
            <Loader2 class="w-3 h-3 animate-spin text-brand-500" />
            <span class="text-[9px] font-bold text-brand-600 uppercase tracking-widest">Calculando...</span>
          </div>
        </div>
        <input type="date" v-model="fechaInicio" @change="activePeriod = 'custom'" class="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl text-sm font-bold outline-none transition-all shadow-sm text-slate-800" />
      </div>

      <div class="w-full md:w-1/4 space-y-2">
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Calendar class="w-3 h-3" /> Hasta
        </label>
        <input type="date" v-model="fechaFin" @change="activePeriod = 'custom'" class="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 rounded-xl text-sm font-bold outline-none transition-all shadow-sm text-slate-800" />
      </div>

      <div class="w-full md:w-auto flex items-center gap-3">
         <button @click="loadPreview" :disabled="!isFormValid || pendingPreview" class="w-full md:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all outline-none flex items-center justify-center gap-2">
           <Loader2 v-if="pendingPreview" class="w-4 h-4 animate-spin text-white/80" />
           <Search v-else class="w-4 h-4 text-white/80" />
           <span>Consultar</span>
         </button>
      </div>
    </div>

    <!-- Preview & Export Module -->
    <div class="glass-panel rounded-[2.5rem] flex-1 flex flex-col overflow-hidden min-h-[400px] border border-white shadow-sm relative z-10">
       
       <div class="px-6 py-5 border-b border-white/60 bg-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
         <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <FileSpreadsheet class="w-4 h-4 text-brand-500" />
            Resultados
         </h3>
         
         <button @click="exportReport" :disabled="!previewData || isExporting" class="px-6 py-3 bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all outline-none flex items-center justify-center gap-2">
           <Loader2 v-if="isExporting" class="w-4 h-4 animate-spin text-white/80" />
           <Download v-else class="w-4 h-4 text-white/80" />
           <span>Descargar</span>
         </button>
       </div>

       <div class="flex-1 overflow-auto custom-scrollbar p-0 bg-slate-50/50">
         
         <div v-if="pendingPreview" class="flex flex-col items-center justify-center h-full py-20 text-slate-400">
           <Loader2 class="w-12 h-12 animate-spin mb-4 text-brand-500" />
           <p class="text-sm font-black text-slate-700">Cargando</p>
           <p class="text-[10px] font-bold uppercase tracking-widest mt-1">Espera</p>
         </div>
         
         <div v-else-if="!previewData" class="flex flex-col items-center justify-center h-full py-20 text-slate-400">
            <Search class="w-14 h-14 mb-4 opacity-20" />
            <p class="text-sm font-black text-slate-700">Filtros</p>
            <p class="text-[10px] font-bold uppercase tracking-widest mt-1">Selecciona</p>
         </div>
         
         <div v-else-if="previewData.empleados?.length === 0" class="flex flex-col items-center justify-center h-full py-20 text-slate-400">
            <FileX class="w-14 h-14 mb-4 opacity-20" />
            <p class="text-sm font-black text-slate-700">Vacío</p>
            <p class="text-[10px] font-bold uppercase tracking-widest mt-1">Cero</p>
         </div>
         
         <table v-else class="w-full text-left border-collapse whitespace-nowrap bg-white text-sm">
            <thead class="bg-slate-100/80 sticky top-0 backdrop-blur-xl z-10 shadow-sm">
              <tr class="text-slate-500 text-[10px] uppercase tracking-widest font-black border-b-2 border-slate-200">
                <th class="px-4 py-3 border-r border-slate-200 w-12 text-center text-slate-400"><Hash class="w-3 h-3 mx-auto" /></th>
                <th class="px-4 py-3 border-r border-slate-200">Nómina</th>
                <th class="px-4 py-3 border-r border-slate-200">Empleado</th>
                <th class="px-4 py-3 border-r border-slate-200 text-center">Faltas</th>
                <th class="px-4 py-3 border-r border-slate-200 text-center">Retardos</th>
                <th class="px-4 py-3 border-r border-slate-200 text-center">Minutos</th>
                <th class="px-4 py-3 text-center">Días</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(emp, i) in previewData.empleados" :key="i" class="hover:bg-brand-50/30 transition-colors group">
                <td class="px-4 py-3 border-r border-slate-100 text-center text-xs font-black text-slate-300 group-hover:text-brand-400">{{ i + 1 }}</td>
                <td class="px-4 py-3 border-r border-slate-100 font-mono text-xs font-bold text-slate-500">{{ emp.identidad?.numero_nomina || emp.identidad?.numero_empleado || emp.identidad?.id_empleado || '---' }}</td>
                <td class="px-4 py-3 border-r border-slate-100">
                  <p class="text-sm font-black text-slate-800 tracking-tight">{{ emp.identidad?.nombre || 'Desconocido' }}</p>
                  <p class="text-[10px] font-bold text-slate-400 mt-0.5">{{ emp.identidad?.curp || '---' }}</p>
                </td>
                <td class="px-4 py-3 border-r border-slate-100 text-center bg-slate-50/50 group-hover:bg-transparent">
                  <span class="text-sm font-black" :class="emp.kpis?.unjFaltas > 0 ? 'text-casita-red' : 'text-slate-300'">{{ emp.kpis?.unjFaltas || 0 }}</span>
                </td>
                <td class="px-4 py-3 border-r border-slate-100 text-center bg-slate-50/50 group-hover:bg-transparent">
                  <span class="text-sm font-black" :class="emp.kpis?.unjRetardos > 0 ? 'text-casita-peach' : 'text-slate-300'">{{ emp.kpis?.unjRetardos || 0 }}</span>
                </td>
                <td class="px-4 py-3 border-r border-slate-100 text-center bg-slate-50/50 group-hover:bg-transparent">
                  <span class="text-sm font-black" :class="emp.kpis?.unjMins > 0 ? 'text-slate-700' : 'text-slate-300'">{{ emp.kpis?.unjMins || 0 }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-sm font-black" :class="(emp.enrichedKardex?.length || 0) > 0 ? 'text-casita-green-dark' : 'text-slate-300'">{{ emp.enrichedKardex?.length || 0 }}</span>
                </td>
              </tr>
            </tbody>
         </table>
       </div>
    </div>
  </div>
</template>

<script setup>
/**
 * DOCUMENTACIÓN DE INTEGRACIÓN KARDEX:
 * 
 * Este módulo (Reportes) interactúa con la API externa del Motor Kardex para extraer y 
 * cruzar incidencias de asistencia. Las peticiones son las siguientes:
 * 
 * 1. GET /api/kardex/periodos (Proxy a https://kardex.casitaapps.com/api/periodos)
 *    - OBJETIVO: Obtener la configuración predictiva de periodos para establecer las fechas.
 *    - PARAM: `ultima_fecha_corte` (Opcional): Permite inyectar manualmente un cierre atípico.
 * 
 * 2. GET /api/reports/preview (Proxy a https://kardex.casitaapps.com/api/crossover/plantel/...)
 *    - OBJETIVO: Cargar en pantalla el cruce de incidencias y pases.
 * 
 * 3. GET /api/reports/export (Proxy a https://kardex.casitaapps.com/api/report2/export/plantel/...)
 *    - OBJETIVO: Retornar el archivo matriz Excel final por descarga binaria en el navegador.
 */

import { ref, computed, watch } from 'vue'
import { Loader2, Search, Download, FileSpreadsheet, FileX, Building2, Calendar, Hash, Settings2 } from 'lucide-vue-next'
import dayjs from 'dayjs'

const { user } = useAuth()
const { data: profile } = useFetch('/api/auth/profile')
const { data: plantelesList } = useFetch('/api/catalogs/planteles', { default: () => [] })

const isAdmin = computed(() => user.value?.is_admin || false)
const authPlanteles = computed(() => profile.value?.admonPlanteles || [])

const selectedPlantel = ref('')
const fechaInicio = ref('')
const fechaFin = ref('')

const activePeriod = ref('actual')
const customCorteInput = ref('')
const customCorteQuery = ref('')

// Llamada reactiva. Si `customCorteQuery` cambia, Nuxt re-evalúa y solicita datos de inmediato.
const { data: periodosData, pending: pendingPeriodos } = useFetch('/api/kardex/periodos', { 
  lazy: true,
  query: computed(() => {
    const q = {}
    if (customCorteQuery.value) q.ultima_fecha_corte = customCorteQuery.value
    return q
  })
})

// Accionada por el "Ajustar". Automáticamente dispara a pendingPeriodos y bloquea la interfaz en "Calculando".
const applyCustomCorte = () => {
  if (!customCorteInput.value) return
  activePeriod.value = 'ajuste'
  customCorteQuery.value = customCorteInput.value
}

// Este watcher reacciona apenas la respuesta (re-calculada o no) aterriza desde el servidor.
watch(periodosData, (newVal) => {
  if (newVal) {
    if (activePeriod.value === 'actual' && newVal.periodo_actual) {
      fechaInicio.value = newVal.periodo_actual.fecha_inicio
      fechaFin.value = newVal.periodo_actual.fecha_fin
    } else if ((activePeriod.value === 'corte' || activePeriod.value === 'ajuste') && newVal.ultimo_completo) {
      fechaInicio.value = newVal.ultimo_completo.fecha_inicio
      fechaFin.value = newVal.ultimo_completo.fecha_fin
    }
  }
}, { immediate: true })

watch(pendingPeriodos, (isPending) => {
  if (!isPending && !periodosData.value && (!fechaInicio.value || !fechaFin.value)) {
    // Fallback de seguridad local
    fechaInicio.value = dayjs().subtract(15, 'day').format('YYYY-MM-DD')
    fechaFin.value = dayjs().format('YYYY-MM-DD')
  }
})

const setPeriod = (type) => {
  activePeriod.value = type
  
  // Limpiamos el ajuste manual para que se usen las reglas de inferencia automáticas en Kardex
  if (type === 'actual' || type === 'corte') {
    customCorteQuery.value = ''
    customCorteInput.value = ''
  }
  
  if (!periodosData.value) return
  
  if (type === 'actual' && periodosData.value.periodo_actual) {
    fechaInicio.value = periodosData.value.periodo_actual.fecha_inicio
    fechaFin.value = periodosData.value.periodo_actual.fecha_fin
  } else if (type === 'corte' && periodosData.value.ultimo_completo) {
    fechaInicio.value = periodosData.value.ultimo_completo.fecha_inicio
    fechaFin.value = periodosData.value.ultimo_completo.fecha_fin
  }
}

const previewData = ref(null)
const pendingPreview = ref(false)
const isExporting = ref(false)

const isFormValid = computed(() => selectedPlantel.value && fechaInicio.value && fechaFin.value)

watch([isAdmin, authPlanteles, plantelesList], () => {
  if (!selectedPlantel.value) {
    if (!isAdmin.value && authPlanteles.value.length > 0) {
      selectedPlantel.value = authPlanteles.value[0]
    } else if (isAdmin.value && plantelesList.value?.length > 0) {
      selectedPlantel.value = plantelesList.value[0]
    }
  }
})

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
    console.error('Error', e)
    alert(e.data?.message || 'Error')
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
    
    const response = await fetch(`/api/reports/export?${queryParams.toString()}`)
    
    if (!response.ok) {
       throw new Error('Error')
    }
    
    const blob = await response.blob()
    
    let filename = `Reporte_${selectedPlantel.value.replace(/\s+/g, '_')}_${fechaInicio.value}.xlsx`
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
    console.error('Error', e)
    alert(e.message || 'Error')
  } finally {
    isExporting.value = false
  }
}
</script>