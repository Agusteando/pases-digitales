<template>
  <div class="flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
    <!-- ID Card -->
    <div class="glass-card p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div class="relative">
        <img 
          :src="employee.picture || getFallbackAvatar(employee.name)" 
          @error="$event.target.src = getFallbackAvatar(employee.name)"
          class="w-24 h-24 rounded-2xl object-cover shadow-sm border-4 border-white bg-slate-50 z-10 relative" 
          alt="Empleado" 
        />
        <div class="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-4 border-white z-20 shadow-sm" title="Activo en Plantilla">
          <CheckCircle2 class="w-3 h-3" />
        </div>
      </div>

      <div class="flex-1 relative z-10">
        <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">{{ employee.name }}</h2>
        <p class="text-slate-500 font-medium text-sm mt-1 flex items-center gap-1.5">
          <Briefcase class="w-3.5 h-3.5 opacity-70"/> {{ employee.puesto || 'Puesto no especificado' }} 
          <span class="mx-1 opacity-50">&bull;</span> 
          <Building class="w-3.5 h-3.5 opacity-70"/> Plantel {{ employee.plantelId || 'N/A' }}
        </p>
        <div class="mt-3 flex gap-2 flex-wrap">
          <span v-if="employee.email" class="px-2.5 py-1 bg-slate-100/80 text-slate-600 text-[11px] font-bold rounded-lg border border-slate-200/50 flex items-center gap-1.5 hover:bg-slate-200 transition-colors">
            <Mail class="w-3.5 h-3.5" /> {{ employee.email }}
          </span>
          <span v-if="employee.rfc" class="px-2.5 py-1 bg-slate-100/80 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-200/50 flex items-center">
            RFC: {{ employee.rfc }}
          </span>
        </div>
      </div>
    </div>

    <!-- Meaningful KPIs -->
    <div class="grid grid-cols-3 gap-4">
      <div class="glass-card p-4 rounded-2xl flex flex-col justify-center hover:border-blue-200 transition-colors group">
        <div class="flex justify-between items-start mb-2">
          <span class="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Faltas</span>
          <UserX class="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
        </div>
        <div class="flex items-end gap-1.5">
          <span class="text-3xl font-black text-slate-800 leading-none tracking-tighter">{{ kpis.faltas }}</span>
          <span class="text-[11px] font-bold text-slate-400 mb-1">ciclo</span>
        </div>
      </div>
      <div class="glass-card p-4 rounded-2xl flex flex-col justify-center hover:border-amber-200 transition-colors group">
        <div class="flex justify-between items-start mb-2">
          <span class="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">Retardos</span>
          <Clock class="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors" />
        </div>
        <div class="flex items-end gap-1.5">
          <span class="text-3xl font-black text-slate-800 leading-none tracking-tighter">{{ kpis.retardos }}</span>
          <span class="text-[11px] font-bold text-slate-400 mb-1">ciclo</span>
        </div>
      </div>
      <div class="glass-card p-4 rounded-2xl flex flex-col justify-center hover:border-indigo-200 transition-colors group">
        <div class="flex justify-between items-start mb-2">
          <span class="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">Salidas T.</span>
          <LogOut class="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
        </div>
        <div class="flex items-end gap-1.5">
          <span class="text-3xl font-black text-slate-800 leading-none tracking-tighter">{{ kpis.salidas }}</span>
          <span class="text-[11px] font-bold text-slate-400 mb-1">ciclo</span>
        </div>
      </div>
    </div>

    <!-- Historical Context -->
    <div class="glass-card p-6 rounded-3xl flex flex-col flex-1">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <History class="w-4 h-4 text-slate-400" /> Historial de Movimientos
        </h3>
        <span v-if="history && history.length > 0" class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          Últimos {{ history.length }}
        </span>
      </div>
      
      <div class="relative flex-1">
        <div v-if="pending" class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/50 backdrop-blur-sm rounded-xl z-10">
          <Loader2 class="w-8 h-8 animate-spin mb-3 text-blue-500" />
          <span class="text-sm font-semibold">Sincronizando historial...</span>
        </div>
        
        <ul v-else-if="history && history.length > 0" class="space-y-3">
          <li v-for="pass in history" :key="pass.id" class="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:shadow-soft hover:border-slate-200 transition-all group relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" :class="getCategoryColor(pass.category_id)"></div>
            <div class="w-10 h-10 rounded-xl bg-white text-slate-500 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
              <component :is="getCategoryIcon(pass.category_id)" class="w-5 h-5" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-1">
                <p class="text-sm font-bold text-slate-800 truncate pr-2">{{ getCategoryText(pass.category_id) }}</p>
                <div class="flex items-center gap-1.5 shrink-0">
                  <!-- Unified Intelligence: Distinguish Generator -->
                  <span v-if="pass.user === 'Admin/Sistema' || pass.user?.toLowerCase().includes('admin')" class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100" title="Generado por mí">Yo</span>
                  <span v-else class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200" title="Generado en Plantel">Plantel</span>
                  
                  <!-- Status -->
                  <span :class="[
                    'text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border',
                    pass.status === 'autorizado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                    pass.status === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                  ]">
                    {{ pass.status }}
                  </span>
                </div>
              </div>
              <p class="text-xs text-slate-500 font-medium flex items-center gap-2">
                <span class="flex items-center gap-1"><Calendar class="w-3 h-3" /> {{ formatDate(pass.date) }}</span>
                <span v-if="pass.time" class="flex items-center gap-1 text-slate-400">&bull; <Clock class="w-3 h-3" /> {{ formatTime(pass.time) }}</span>
              </p>
            </div>
          </li>
        </ul>
        
        <div v-else class="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <FileX class="w-12 h-12 opacity-20 mb-3" />
          <p class="text-sm font-bold text-slate-600">Sin historial operativo</p>
          <p class="text-xs font-medium mt-1 text-slate-400">Este empleado no tiene pases registrados recientemente.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Calendar, Loader2, CheckCircle2, Mail, FileX, Clock, UserX, LogOut, Briefcase, Building, History, ShieldAlert, LogIn, Stethoscope, FileQuestion } from 'lucide-vue-next'
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
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f8fafc&color=475569`
}

// Fetch history dynamically
const { data: history, pending } = useFetch(() => `/api/passes/context`, {
  query: { employeeName: props.employee.name },
  watch: [() => props.employee.name]
})

// Calculate KPIs dynamically
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
  return map[id] || 'Otro Movimiento'
}

function getCategoryIcon(id) {
  const map = {
    1: LogIn,
    2: LogOut,
    3: UserX,
    4: Clock,
    5: Stethoscope
  }
  return map[id] || FileQuestion
}

function getCategoryColor(id) {
  const map = {
    1: 'bg-amber-400',
    2: 'bg-indigo-400',
    3: 'bg-red-400',
    4: 'bg-blue-400',
    5: 'bg-teal-400'
  }
  return map[id] || 'bg-slate-400'
}
</script>