<template>
  <div class="glass-panel p-6 lg:p-8 rounded-[2.5rem] flex flex-col flex-1 min-h-0 relative overflow-hidden gap-5">
    
    <div class="flex items-center gap-5 relative z-10 shrink-0">
      <PremiumAvatar :src="displayPic" :name="employee.name" size="lg" class="shrink-0 ring-4 ring-white shadow-md bg-white" />

      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-black text-slate-900 truncate tracking-tight">{{ employee.name }}</h2>
        <div v-if="pendingEnrich" class="mt-2 space-y-2 w-1/2">
          <div class="h-2.5 bg-white rounded animate-pulse w-full"></div>
          <div class="h-2.5 bg-white rounded animate-pulse w-2/3"></div>
        </div>
        <div v-else class="mt-2 flex flex-wrap gap-2 items-center">
          <span v-if="displayPlantel" class="px-2.5 py-1 bg-white/70 backdrop-blur-sm text-slate-700 text-[11px] font-bold rounded-lg border border-white shadow-sm flex items-center gap-1.5">
            <Building2 class="w-3 h-3 text-casita-green" />
            {{ displayPlantel }}
          </span>
          <span v-if="displayRole" class="px-2.5 py-1 bg-white/70 backdrop-blur-sm text-slate-700 text-[11px] font-bold rounded-lg border border-white shadow-sm flex items-center gap-1.5">
            <Briefcase class="w-3 h-3 text-iedis-blue" />
            {{ displayRole }}
          </span>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="shrink-0 bg-gradient-to-r from-iedis-teal/10 to-iedis-teal/5 rounded-[1.5rem] p-4 flex flex-col sm:flex-row gap-4 border border-iedis-teal/20 shadow-sm relative z-10 items-start sm:items-center justify-between group transition-all hover:bg-iedis-teal/10">
        <div class="flex gap-3 items-center">
          <div class="w-10 h-10 rounded-[1rem] bg-white flex items-center justify-center shrink-0 border border-iedis-teal/30 shadow-sm transition-transform group-hover:scale-105">
            <FileText class="w-4 h-4 text-iedis-teal" />
          </div>
          <div>
            <h4 class="text-[13px] font-black text-iedis-teal-dark tracking-tight">Pase abierto detectado</h4>
            <p class="text-[11px] text-iedis-teal-dark/80 mt-0.5 font-medium">El colaborador tiene un pase registrado el día de hoy.</p>
          </div>
        </div>
        <NuxtLink :to="`/pass/${todayPasses[0].id}`" class="shrink-0 px-4 py-2 bg-white hover:bg-white/80 text-iedis-teal-dark border border-white text-xs font-black rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 w-full sm:w-auto outline-none">
          <span>Abrir registro</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>
    </transition>

    <div class="relative z-10 flex flex-col flex-1 min-h-0 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white shadow-sm p-1 overflow-hidden">
      
      <div class="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/80 p-4 rounded-[1.5rem] border border-white shadow-sm">
        <div>
          <h3 class="text-sm font-black text-slate-900 tracking-tight">Historial de incidencias</h3>
          <p class="text-[9px] font-black text-brand-500 uppercase tracking-widest mt-0.5" v-if="historyData?.cycle">Ciclo Escolar {{ historyData.cycle }}</p>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <div v-for="(count, cat) in statCounters" :key="cat" class="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-700 flex gap-1 items-center shadow-sm">
            <span class="text-brand-600">{{ count }}</span>
            <span class="text-[8px] uppercase tracking-wider text-slate-500">{{ getCategoryName(Number(cat)).split(' ')[0] }}</span>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0 pb-12 relative" style="mask-image: linear-gradient(to bottom, black 85%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%);">
        
        <div v-if="pendingHistory" class="py-10 flex justify-center">
          <Loader2 class="w-6 h-6 animate-spin text-brand-400" />
        </div>
        
        <div v-else-if="historyError" class="py-12 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-16 bg-casita-red/10 rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-casita-red/20">
            <AlertTriangle class="w-6 h-6 text-casita-red" />
          </div>
          <p class="text-sm font-black text-casita-red-dark">Error de conexión</p>
          <p class="text-xs font-medium text-casita-red-dark/80 mt-1">No se pudo recuperar el historial de la base de datos.</p>
        </div>

        <div v-else-if="!groupedHistory.length" class="py-12 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-white">
            <History class="w-6 h-6 text-slate-300" />
          </div>
          <p class="text-sm font-black text-slate-700">Historial limpio</p>
          <p class="text-xs font-medium text-slate-500 mt-1">No hay pases registrados en el ciclo actual.</p>
        </div>

        <div v-else class="relative">
          <div class="absolute top-2 bottom-0 left-[23px] w-[2px] bg-slate-200/60 rounded-full z-0"></div>
          <div class="absolute top-2 bottom-0 left-[23px] w-[2px] rounded-full z-0 timeline-line opacity-40"></div>

          <div v-for="group in groupedHistory" :key="group.month" class="mb-6">
            
            <div class="relative pl-14 mb-4 flex items-center">
               <div class="absolute left-[19px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-slate-50/80 z-10 shadow-sm"></div>
               <span class="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 border border-white shadow-sm">
                 {{ group.month }}
               </span>
            </div>
            
            <div class="space-y-0">
              <div v-for="(pass, index) in group.passes" :key="pass.id" class="relative pl-14 pb-5 group timeline-item" :style="{ animationDelay: `${index * 0.08}s` }">
                
                <div class="absolute left-[17px] top-5 w-3.5 h-3.5 rounded-full z-10 ring-[4px] ring-slate-50/80 transition-transform duration-300 group-hover:scale-125 shadow-sm" :class="getCategoryColor(pass.category_id)"></div>
                
                <div class="block bg-white/80 p-4 rounded-[1.25rem] border border-white shadow-sm hover:shadow-md hover:bg-white transition-all outline-none">
                  <div class="flex items-start justify-between mb-3 gap-3">
                    <div class="flex flex-col gap-1">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs font-black tracking-tight" :class="isToday(pass.date) ? 'text-brand-600' : 'text-slate-900'">#{{ String(pass.id).padStart(5, '0') }}</span>
                        <span class="text-[8px] uppercase font-black tracking-widest px-2 py-0.5 rounded border shadow-sm"
                              :class="{'bg-casita-gold/10 text-casita-gold-dark border-casita-gold/30': pass.status === 'pendiente',
                                       'bg-casita-green/10 text-casita-green border-casita-green/30': pass.status === 'autorizado',
                                       'bg-casita-red/10 text-casita-red border-casita-red/30': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                          {{ pass.status }}
                        </span>
                      </div>
                      <h4 class="text-[13px] font-bold text-slate-700">{{ getCategoryName(pass.category_id) }}</h4>
                    </div>
                    <span class="text-[10px] font-black text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm shrink-0">{{ formatDateOnly(pass.date) }}</span>
                  </div>
                  
                  <p v-if="pass.comentarios" class="text-[11px] font-medium text-slate-600 italic bg-white/50 p-2.5 rounded-xl border border-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] line-clamp-2">"{{ pass.comentarios }}"</p>
                  
                  <div class="mt-3 pt-3 border-t border-white flex items-center justify-between">
                    <div v-if="pass.status !== 'pendiente' && pass.status !== 'cancelado'" class="flex items-center gap-1.5">
                      <ShieldCheck class="w-3.5 h-3.5" :class="pass.status === 'autorizado' ? 'text-casita-green' : 'text-casita-red'" />
                      <span class="text-[9px] font-bold uppercase tracking-wider" :class="pass.status === 'autorizado' ? 'text-casita-green-dark' : 'text-casita-red-dark'">
                        Resuelto{{ pass.authorized_by ? ' por ' + pass.authorized_by.split(' ')[0] : '' }}
                      </span>
                    </div>
                    <div v-else></div>
                    
                    <NuxtLink :to="`/pass/${pass.id}`" class="text-brand-600 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white hover:bg-brand-50 px-2.5 py-1 rounded-lg border border-white hover:border-brand-100 shadow-sm outline-none">
                      <span class="text-[9px] font-black uppercase tracking-widest">Abrir detalle</span>
                      <ArrowRight class="w-3 h-3" />
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { FileText, Loader2, ShieldCheck, History, Building2, Briefcase, ArrowRight, AlertTriangle } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const props = defineProps({ 
  employee: { type: Object, required: true } 
})

const getCategoryName = (id) => {
  const map = { 1: 'Llegada tarde', 2: 'Salida anticipada', 3: 'Ausencia justificada', 4: 'Cambio de horario', 5: 'Incapacidad médica' }
  return map[id] || 'Otro'
}

const getCategoryColor = (id) => {
  const map = { 1: 'bg-casita-peach', 2: 'bg-iedis-blue', 3: 'bg-casita-red', 4: 'bg-casita-gold', 5: 'bg-iedis-teal' }
  return map[id] || 'bg-slate-400'
}

const { data: enrichment, pending: pendingEnrich } = useFetch('/api/employees/enrich', {
  query: { id: props.employee.id, name: props.employee.name }
})

const { data: historyData, pending: pendingHistory, error: historyError } = useFetch('/api/passes/employee', {
  query: { name: props.employee.name }
})

const displayPic = computed(() => enrichment.value?.picture || props.employee.picture || null)
const displayRole = computed(() => enrichment.value?.puesto || props.employee.puesto || null)
const displayPlantel = computed(() => enrichment.value?.plantel || props.employee.plantelBase || props.employee.plantel || null)

const isToday = (dateStr) => {
  if (!dateStr) return false
  return String(dateStr).startsWith(dayjs().format('YYYY-MM-DD'))
}

const todayPasses = computed(() => {
  if (!historyData.value?.history) return []
  return historyData.value.history.filter(p => isToday(p.date) && p.status !== 'cancelado' && p.status !== 'rechazado')
})

const statCounters = computed(() => {
  if (!historyData.value?.history) return {}
  const counts = {}
  historyData.value.history.forEach(p => {
    if (p.status === 'cancelado' || p.status === 'rechazado') return
    counts[p.category_id] = (counts[p.category_id] || 0) + 1
  })
  return counts
})

const groupedHistory = computed(() => {
  if (!historyData.value?.history) return []
  const groups = {}
  historyData.value.history.forEach(p => {
    const month = dayjs(p.date).format('MMM YYYY')
    if (!groups[month]) groups[month] = []
    groups[month].push(p)
  })
  return Object.keys(groups).map(month => ({ month, passes: groups[month] }))
})

const formatDateOnly = (dateStr) => dayjs(dateStr).format('DD MMM')
</script>