<template>
  <div class="flex flex-col h-full min-h-0 relative w-full">
    
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6 relative z-10 shrink-0 mb-8 pb-6 border-b border-slate-200/60">
      <div class="flex items-center gap-5">
        <PremiumAvatar :src="displayPic" :name="employee.name" size="lg" class="shrink-0 ring-4 ring-white shadow-xl bg-white" />
        <div class="flex flex-col min-w-0">
          <h2 class="text-3xl font-black text-slate-900 tracking-tighter truncate">{{ employee.name }}</h2>
          <div v-if="pendingEnrich" class="mt-2 space-y-2 w-32">
            <div class="h-2.5 bg-slate-200/60 rounded animate-pulse w-full"></div>
            <div class="h-2.5 bg-slate-200/60 rounded animate-pulse w-2/3"></div>
          </div>
          <div v-else class="mt-2 flex flex-wrap gap-2 items-center">
            <span v-if="displayPlantel" class="px-3 py-1.5 bg-white/80 backdrop-blur-sm text-slate-700 text-[11px] font-bold rounded-xl border border-white shadow-sm flex items-center gap-1.5">
              <Building2 class="w-3.5 h-3.5 text-brand-500" /> {{ displayPlantel }}
            </span>
            <span v-if="displayRole" class="px-3 py-1.5 bg-white/80 backdrop-blur-sm text-slate-700 text-[11px] font-bold rounded-xl border border-white shadow-sm flex items-center gap-1.5">
              <Briefcase class="w-3.5 h-3.5 text-slate-400" /> {{ displayRole }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-2 bg-white/40 p-2 rounded-2xl border border-white/60 shadow-sm">
        <div v-for="(count, cat) in statCounters" :key="cat" class="px-3 py-2 bg-white rounded-xl flex flex-col items-center justify-center min-w-[3.5rem] shadow-sm">
          <span class="text-sm font-black text-brand-600">{{ count }}</span>
          <span class="text-[8px] uppercase font-black text-slate-400 tracking-widest mt-0.5">{{ getCategoryName(Number(cat)).split(' ')[0] }}</span>
        </div>
        <div v-if="Object.keys(statCounters).length === 0" class="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Sin registros
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="shrink-0 bg-casita-gold/10 rounded-[1.5rem] p-5 flex flex-col sm:flex-row gap-4 border border-casita-gold/30 shadow-sm relative z-10 items-start sm:items-center justify-between group transition-all mb-6 hover:bg-casita-gold/20">
        <div class="flex gap-4 items-center">
          <div class="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-casita-gold/30 shadow-sm text-casita-gold-dark">
            <AlertCircle class="w-6 h-6" />
          </div>
          <div>
            <h4 class="text-sm font-black text-casita-gold-dark tracking-tight">Pase abierto hoy</h4>
            <p class="text-[11px] text-casita-gold-dark/80 mt-1 font-medium">El colaborador ya cuenta con un registro para el día de hoy.</p>
          </div>
        </div>
        <NuxtLink :to="`/pass/${todayPasses[0].id}`" class="shrink-0 px-5 py-3 bg-white hover:bg-casita-gold/5 text-casita-gold-dark border border-casita-gold/20 text-xs font-black rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 outline-none">
          <span>Abrir registro</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>
    </transition>

    <div class="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12 relative z-10" style="mask-image: linear-gradient(to bottom, black 90%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 90%, transparent 100%);">
      <div class="flex items-center justify-between mb-6 sticky top-0 bg-slate-50/90 backdrop-blur-md z-20 py-3 border-b border-slate-200/50">
        <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><History class="w-4 h-4 text-brand-500" /> Historial Operativo</h3>
        <span class="text-[9px] font-black text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-brand-100" v-if="historyData?.cycle">Ciclo {{ historyData.cycle }}</span>
      </div>

      <div v-if="pendingHistory" class="py-12 flex justify-center"><Loader2 class="w-8 h-8 animate-spin text-brand-400" /></div>
      
      <div v-else-if="historyError" class="py-16 flex flex-col items-center justify-center text-center bg-white/40 rounded-[2rem] border border-white border-dashed">
        <div class="w-16 h-16 bg-casita-red/10 rounded-full flex items-center justify-center mb-4 border border-casita-red/20">
          <AlertTriangle class="w-6 h-6 text-casita-red" />
        </div>
        <p class="text-sm font-black text-casita-red-dark">Error de conexión</p>
        <p class="text-xs font-medium text-casita-red-dark/80 mt-1">No se pudo recuperar el historial de la base de datos.</p>
      </div>

      <div v-else-if="!groupedHistory.length" class="py-16 flex flex-col items-center justify-center text-center bg-white/40 rounded-[2rem] border border-white border-dashed">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
          <FileText class="w-6 h-6 text-slate-300" />
        </div>
        <p class="text-base font-black text-slate-700">Historial limpio</p>
        <p class="text-sm font-medium text-slate-500 mt-1">No hay pases registrados en el ciclo actual.</p>
      </div>

      <div v-else class="relative mt-4">
        <div class="absolute top-2 bottom-0 left-[23px] w-[2px] bg-slate-200/60 rounded-full z-0"></div>
        <div class="absolute top-2 bottom-0 left-[23px] w-[2px] rounded-full z-0 timeline-line opacity-40"></div>

        <div v-for="group in groupedHistory" :key="group.month" class="mb-8">
          
          <div class="relative pl-14 mb-5 flex items-center">
             <div class="absolute left-[19px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-slate-50/90 z-10 shadow-sm"></div>
             <span class="sticky top-12 z-20 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-white shadow-sm">
               {{ group.month }}
             </span>
          </div>
          
          <div class="space-y-0">
            <div v-for="(pass, index) in group.passes" :key="pass.id" class="relative pl-14 pb-6 group timeline-item" :style="{ animationDelay: `${index * 0.05}s` }">
              
              <div class="absolute left-[17px] top-5 w-3.5 h-3.5 rounded-full z-10 ring-[4px] ring-slate-50/90 transition-transform duration-300 group-hover:scale-125 shadow-sm" :class="getCategoryColor(pass.category_id)"></div>
              
              <div class="block bg-white/80 p-5 rounded-[1.5rem] border border-white shadow-sm hover:shadow-md hover:bg-white transition-all outline-none relative overflow-hidden">
                <div class="flex items-start justify-between mb-3 gap-3 relative z-10">
                  <div class="flex flex-col gap-1.5">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-sm font-black tracking-tight" :class="isToday(pass.date) ? 'text-brand-600' : 'text-slate-900'">#{{ String(pass.id).padStart(5, '0') }}</span>
                      <span class="text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-md border shadow-sm"
                            :class="{'bg-casita-gold/10 text-casita-gold-dark border-casita-gold/30': pass.status === 'pendiente',
                                     'bg-casita-green/10 text-casita-green-dark border-casita-green/30': pass.status === 'autorizado',
                                     'bg-casita-red/10 text-casita-red-dark border-casita-red/30': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                        {{ pass.status }}
                      </span>
                    </div>
                    <h4 class="text-sm font-bold text-slate-700 flex flex-wrap items-center gap-2">
                      {{ getCategoryName(pass.category_id) }}
                      <span v-if="pass.tipo_permiso" class="text-[9px] font-black bg-slate-100 text-slate-500 uppercase tracking-widest px-2 py-1 rounded-md border border-slate-200/60 shadow-sm">{{ pass.tipo_permiso }}</span>
                    </h4>
                  </div>
                  <span class="text-[11px] font-black text-slate-500 bg-white/60 px-3 py-1.5 rounded-xl border border-white shadow-sm shrink-0">{{ formatDateOnly(pass.date) }}</span>
                </div>
                
                <p v-if="pass.comentarios" class="text-xs font-medium text-slate-600 italic bg-white/50 p-3 rounded-xl border border-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] line-clamp-2 relative z-10">"{{ pass.comentarios }}"</p>
                
                <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
                  <div v-if="pass.status !== 'pendiente' && pass.status !== 'cancelado'" class="flex items-center gap-2">
                    <ShieldCheck class="w-4 h-4" :class="pass.status === 'autorizado' ? 'text-casita-green' : 'text-casita-red'" />
                    <span class="text-[10px] font-bold uppercase tracking-widest" :class="pass.status === 'autorizado' ? 'text-casita-green-dark' : 'text-casita-red-dark'">
                      Resuelto{{ pass.authorized_by ? ' por ' + pass.authorized_by.split(' ')[0] : '' }}
                    </span>
                  </div>
                  <div v-else></div>
                  
                  <NuxtLink :to="`/pass/${pass.id}`" class="text-brand-600 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white hover:bg-brand-50 px-3 py-1.5 rounded-xl border border-white hover:border-brand-100 shadow-sm outline-none text-[10px] font-black uppercase tracking-widest">
                    <span>Ver detalle</span>
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
</template>

<script setup>
import { computed } from 'vue'
import { FileText, Loader2, ShieldCheck, History, Building2, Briefcase, ArrowRight, AlertTriangle, AlertCircle } from 'lucide-vue-next'
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
  query: { 
    id: props.employee.id || undefined, 
    name: props.employee.id ? undefined : props.employee.name 
  }
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