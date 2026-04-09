<template>
  <div class="glass-panel p-6 lg:p-8 rounded-[2.5rem] flex flex-col h-full min-h-0 relative overflow-hidden">
    
    <div class="flex items-center justify-between pb-4 border-b border-white/60 shrink-0 relative z-20">
      <div>
        <h2 class="text-xl font-black text-slate-900 tracking-tight">Actividad reciente</h2>
        <p class="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Últimos pases registrados</p>
      </div>
      <button @click="refresh" class="p-2.5 text-slate-400 hover:text-iedis-teal-dark bg-white hover:bg-white/80 rounded-xl shadow-sm transition-all focus:outline-none border border-white/80 hover:shadow-md">
        <RefreshCcw :class="{'animate-spin': pending}" class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto mt-4 custom-scrollbar min-h-0 relative z-10 pb-12" style="mask-image: linear-gradient(to bottom, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);">
      
      <div v-if="pending && !data" class="flex justify-center py-16"><Loader2 class="w-8 h-8 animate-spin text-iedis-teal" /></div>
      
      <div v-else-if="error" class="flex flex-col items-center justify-center py-12 text-casita-red gap-4">
        <div class="w-16 h-16 bg-casita-red/10 rounded-full flex items-center justify-center border border-casita-red/20 shadow-sm">
          <AlertTriangle class="w-8 h-8 text-casita-red" />
        </div>
        <span class="text-sm font-bold text-casita-red-dark">Error de conexión al cargar la actividad.</span>
      </div>

      <div v-else-if="!data || data.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400 gap-4">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-white shadow-sm">
          <FileText class="w-8 h-8 text-slate-300" />
        </div>
        <span class="text-sm font-bold text-slate-500">No hay pases recientes.</span>
      </div>

      <div v-else class="relative mt-2">
        <div class="absolute top-2 bottom-0 left-[23px] w-[2px] bg-slate-200/60 rounded-full z-0"></div>
        <div class="absolute top-2 bottom-0 left-[23px] w-[2px] rounded-full z-0 timeline-line opacity-50"></div>

        <div class="space-y-0">
          <div v-for="(pass, index) in data" :key="pass.id" class="relative pl-14 pb-6 group timeline-item" :style="{ animationDelay: `${index * 0.05}s` }">
            
            <div class="absolute left-[4px] top-1 w-10 h-10 rounded-[1rem] bg-white flex items-center justify-center shadow-sm z-10 ring-[4px] ring-white/90 transition-transform duration-300 group-hover:scale-110" :class="getCategoryColorText(pass.category_id)">
              <component :is="getCategoryIcon(pass.category_id)" class="w-4 h-4" />
            </div>

            <div class="bg-white/80 backdrop-blur-md p-4 rounded-[1.25rem] border border-white hover:border-iedis-teal/30 hover:shadow-md transition-all shadow-sm">
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="font-mono text-sm font-black text-brand-600 tracking-tight">
                      #{{ String(pass.id).padStart(5, '0') }}
                    </span>
                    <span class="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md border shadow-sm"
                          :class="{'bg-casita-gold/10 text-casita-gold-dark border-casita-gold/30': pass.status === 'pendiente',
                                   'bg-casita-green/10 text-casita-green border-casita-green/30': pass.status === 'autorizado',
                                   'bg-casita-red/10 text-casita-red border-casita-red/30': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                      {{ pass.status }}
                    </span>
                  </div>
                  <h4 class="text-sm font-black text-slate-800 truncate">{{ pass.employee_name }}</h4>
                </div>
                <span class="text-[10px] font-black text-slate-400 shrink-0 text-right bg-white/50 px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                  {{ formatDateTime(pass.date, pass.time) }}
                </span>
              </div>
              
              <p class="text-[11px] font-bold text-slate-500 truncate flex flex-wrap items-center gap-1.5 mt-2 bg-white/60 px-2.5 py-1.5 rounded-lg border border-white shadow-sm">
                <span class="text-slate-700">{{ getCategoryName(pass.category_id) }}</span>
                <span v-if="pass.plantel" class="text-slate-300">•</span>
                <span v-if="pass.plantel">{{ pass.plantel }}</span>
              </p>

              <div class="mt-3 pt-3 border-t border-white/60 flex items-center justify-between">
                 <span class="text-[9px] font-bold text-slate-400">Por: <span class="text-slate-600">{{ pass.user }}</span></span>
                 <NuxtLink :to="`/pass/${pass.id}`" class="inline-flex items-center gap-1 text-[10px] font-black text-iedis-teal hover:text-iedis-teal-dark bg-white hover:bg-iedis-teal/10 px-2.5 py-1.5 rounded-lg border border-white hover:border-iedis-teal/20 transition-colors shadow-sm outline-none">
                   <span>Revisar</span>
                   <ArrowRight class="w-3 h-3" />
                 </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RefreshCcw, Loader2, FileText, LogIn, LogOut, UserX, Clock, Stethoscope, ArrowRight, AlertTriangle } from 'lucide-vue-next'
import dayjs from 'dayjs'

const { data, pending, error, refresh } = useFetch('/api/passes/recent')

const getCategoryIcon = (id) => {
  const map = { 1: LogIn, 2: LogOut, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || Clock
}

const getCategoryColorText = (id) => {
  const map = { 1: 'text-casita-peach', 2: 'text-iedis-blue', 3: 'text-casita-red', 4: 'text-casita-gold', 5: 'text-iedis-teal' }
  return map[id] || 'text-slate-400'
}

const getCategoryName = (id) => {
  const map = { 1: 'Llegada tarde', 2: 'Salida anticipada', 3: 'Ausencia justificada', 4: 'Cambio de horario', 5: 'Incapacidad médica' }
  return map[id] || 'Otro'
}

const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return 'N/A'
  const dt = dayjs(dateStr)
  const timePart = timeStr ? `, ${timeStr.slice(0, 5)}` : ''
  if (dt.isSame(dayjs(), 'day')) return `Hoy${timePart}`
  if (dt.isSame(dayjs().subtract(1, 'day'), 'day')) return `Ayer${timePart}`
  return `${dt.format('DD MMM')}${timePart}`
}
</script>