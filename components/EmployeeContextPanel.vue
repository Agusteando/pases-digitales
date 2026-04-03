<template>
  <div class="flex flex-col space-y-4">
    <!-- ID Card -->
    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
      <img 
        :src="employee.picture || getFallbackAvatar(employee.name)" 
        @error="$event.target.src = getFallbackAvatar(employee.name)"
        class="w-20 h-20 rounded-full object-cover shadow-sm border-4 border-white bg-slate-50" 
        alt="Empleado" 
      />
      <div class="flex-1">
        <h2 class="text-xl font-bold text-slate-800 tracking-tight leading-tight">{{ employee.name }}</h2>
        <p class="text-slate-500 font-medium text-sm mt-0.5">{{ employee.puesto || 'Puesto no especificado' }} &bull; Plantel {{ employee.plantelId || 'N/A' }}</p>
        <div class="mt-2 flex gap-2 flex-wrap">
          <span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold rounded-full border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 class="w-3 h-3" /> Activo
          </span>
          <span v-if="employee.email" class="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full border border-slate-200 flex items-center gap-1">
            <Mail class="w-3 h-3" /> {{ employee.email }}
          </span>
        </div>
      </div>
    </div>

    <!-- Meaningful KPIs -->
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Faltas</span>
        <div class="flex items-end gap-1.5">
          <span class="text-2xl font-extrabold text-slate-800 leading-none">{{ kpis.faltas }}</span>
          <span class="text-[10px] font-medium text-slate-400 mb-0.5">ciclo</span>
        </div>
      </div>
      <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Retardos</span>
        <div class="flex items-end gap-1.5">
          <span class="text-2xl font-extrabold text-slate-800 leading-none">{{ kpis.retardos }}</span>
          <span class="text-[10px] font-medium text-slate-400 mb-0.5">ciclo</span>
        </div>
      </div>
      <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Salidas T.</span>
        <div class="flex items-end gap-1.5">
          <span class="text-2xl font-extrabold text-slate-800 leading-none">{{ kpis.salidas }}</span>
          <span class="text-[10px] font-medium text-slate-400 mb-0.5">ciclo</span>
        </div>
      </div>
    </div>

    <!-- Historical Context -->
    <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-slate-800">Últimos Registros</h3>
      </div>
      
      <div>
        <div v-if="pending" class="flex flex-col items-center justify-center py-4 text-slate-400">
          <Loader2 class="w-6 h-6 animate-spin mb-2 text-blue-500" />
        </div>
        
        <ul v-else-if="history && history.length > 0" class="space-y-3">
          <li v-for="pass in history" :key="pass.id" class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-slate-100">
            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
              <Calendar class="w-4 h-4" />
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <p class="text-xs font-bold text-slate-800">{{ getCategoryText(pass.category_id) }}</p>
                <span :class="[
                  'text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm',
                  pass.status === 'autorizado' ? 'bg-green-100 text-green-700' : 
                  pass.status === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                ]">
                  {{ pass.status }}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5 font-medium">
                {{ formatDate(pass.date) }} <span v-if="pass.time">&bull; {{ formatTime(pass.time) }}</span>
              </p>
            </div>
          </li>
        </ul>
        
        <div v-else class="flex flex-col items-center justify-center py-4 text-slate-400">
          <FileX class="w-8 h-8 opacity-20 mb-2" />
          <p class="text-xs font-medium text-slate-500">Sin registros recientes</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Calendar, Loader2, CheckCircle2, Mail, FileX } from 'lucide-vue-next'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

const props = defineProps({
  employee: {
    type: Object,
    required: true
  }
})

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f1f5f9&color=64748b`
}

// Fetch history dynamically when the employee prop changes
const { data: history, pending } = useFetch(() => `/api/passes/context`, {
  query: { employeeName: props.employee.name },
  watch: [() => props.employee.name]
})

// Calculate Meaningful KPIs dynamically from history
const kpis = computed(() => {
  const stats = { faltas: 0, retardos: 0, salidas: 0 }
  if (!history.value) return stats
  
  history.value.forEach(pass => {
    if (pass.status !== 'autorizado') return
    if (pass.category_id === 3) stats.faltas++
    if (pass.category_id === 1) stats.retardos++
    if (pass.category_id === 2) stats.salidas++
  })
  return stats
})

function formatDate(date) {
  if (!date) return ''
  return dayjs(date).format('DD MMM YYYY')
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':')
    return `${parts[0]}:${parts[1]}`
  }
  return timeStr
}

function getCategoryText(id) {
  const map = { 
    1: 'Llegada Tarde', 
    2: 'Salida Temprano', 
    3: 'Falta Justificada', 
    4: 'Cambio de Horario', 
    5: 'Incapacidad Médica' 
  }
  return map[id] || 'Otro'
}
</script>