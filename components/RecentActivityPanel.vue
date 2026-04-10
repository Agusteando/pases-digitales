<template>
  <div class="flex flex-col xl:h-full min-h-0 relative w-full">
    
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-slate-200/50 shrink-0 relative z-20 mb-6">
      <div>
        <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Actividad reciente</h2>
        <p class="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Últimos pases registrados</p>
      </div>
      <button @click="refresh" class="px-4 py-2.5 text-slate-600 hover:text-brand-600 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-sm transition-all focus:outline-none border border-white hover:shadow flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest outline-none">
        <RefreshCcw :class="{'animate-spin': pending}" class="w-3.5 h-3.5 shrink-0" /> <span class="leading-none mt-[1px]">Actualizar</span>
      </button>
    </div>

    <div class="flex-1 xl:overflow-y-auto overflow-visible custom-scrollbar pr-2 sm:pr-4 relative z-10 pb-12 xl:[mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)] xl:[-webkit-mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]">
      
      <div v-if="pending && !data" class="flex justify-center py-16"><Loader2 class="w-8 h-8 animate-spin text-brand-500" /></div>
      
      <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-casita-red gap-4 bg-white/40 rounded-[2rem] border border-white border-dashed">
        <div class="w-16 h-16 bg-casita-red/10 rounded-full flex items-center justify-center border border-casita-red/20 shadow-sm">
          <AlertTriangle class="w-8 h-8 text-casita-red" />
        </div>
        <div class="text-center">
          <span class="text-sm font-black text-casita-red-dark block">Error de conexión</span>
          <span class="text-xs font-medium text-casita-red-dark/80 mt-1 block">No se pudo cargar la actividad reciente.</span>
        </div>
      </div>

      <div v-else-if="!data || data.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400 gap-4 bg-white/40 rounded-[2rem] border border-white border-dashed">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-white shadow-sm">
          <FileText class="w-8 h-8 text-slate-300" />
        </div>
        <div class="text-center">
          <span class="text-base font-black text-slate-700 block">Bandeja vacía</span>
          <span class="text-sm font-medium text-slate-500 mt-1 block">No hay pases generados recientemente.</span>
        </div>
      </div>

      <div v-else class="relative mt-2">
        <div class="absolute top-2 bottom-0 left-[19px] w-[2px] bg-slate-200/60 rounded-full z-0"></div>
        <div class="absolute top-2 bottom-0 left-[19px] w-[2px] rounded-full z-0 timeline-line opacity-50"></div>

        <div class="space-y-0">
          <div v-for="(pass, index) in data" :key="pass.id" class="relative pl-12 pb-6 group timeline-item" :style="{ animationDelay: `${index * 0.05}s` }">
            
            <div class="absolute left-[0px] top-1 w-10 h-10 rounded-[1rem] bg-white flex items-center justify-center shadow-sm z-10 ring-[4px] ring-slate-50/80 transition-transform duration-300 group-hover:scale-110 border border-slate-100" :class="getCategoryColorText(pass.category_id)">
              <component :is="getCategoryIcon(pass.category_id)" class="w-4 h-4 shrink-0" />
            </div>

            <div class="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-[1.5rem] border border-white hover:border-brand-200 hover:shadow-md transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 outline-none relative overflow-hidden">
              <div class="min-w-0 flex-1 relative z-10">
                <div class="flex items-center gap-3 mb-2">
                  <span class="font-mono text-sm font-black text-brand-600 tracking-tight">
                    #{{ String(pass.id).padStart(5, '0') }}
                  </span>
                  <span class="text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-md border shadow-sm"
                        :class="{'bg-casita-gold/10 text-casita-gold-dark border-casita-gold/30': pass.status === 'pendiente',
                                 'bg-casita-green/10 text-casita-green-dark border-casita-green/30': pass.status === 'autorizado',
                                 'bg-casita-red/10 text-casita-red-dark border-casita-red/30': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                    {{ pass.status }}
                  </span>
                </div>
                <h4 class="text-sm sm:text-base font-black text-slate-900 truncate">{{ pass.employee_name }}</h4>
                <div class="flex flex-wrap items-center gap-2 mt-2">
                  <span class="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white/60 px-2 py-1 rounded-md border border-white shadow-sm">{{ getCategoryName(pass.category_id) }}</span>
                  <span v-if="pass.plantel" class="text-[9px] sm:text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-white/60 px-2 py-1 rounded-md border border-white shadow-sm">
                    <Building2 class="w-3 h-3 text-brand-400 shrink-0" /> {{ pass.plantel }}
                  </span>
                </div>
              </div>
              
              <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 relative z-10 border-t sm:border-t-0 border-white/60 pt-3 sm:pt-0">
                <span class="text-[10px] font-black text-slate-500 bg-white/60 px-3 py-1.5 rounded-xl border border-white shadow-sm flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-slate-400 shrink-0" /> <span class="leading-none mt-[1px]">{{ formatDateTime(pass.date, pass.time) }}</span>
                </span>
                
                <NuxtLink :to="`/pass/${pass.id}`" class="inline-flex items-center justify-center gap-1.5 text-[9px] font-black text-brand-600 hover:text-brand-800 bg-white hover:bg-brand-50 px-3 py-1.5 rounded-xl border border-white hover:border-brand-100 transition-colors shadow-sm outline-none uppercase tracking-widest">
                  <span class="leading-none mt-[1px]">Revisar</span>
                  <ArrowRight class="w-3 h-3 shrink-0" />
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
import { RefreshCcw, Loader2, FileText, LogIn, LogOut, UserX, Clock, Stethoscope, ArrowRight, AlertTriangle, Building2 } from 'lucide-vue-next'
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