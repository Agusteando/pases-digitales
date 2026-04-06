<template>
  <div class="glass-card p-6 md:p-8 rounded-3xl flex flex-col gap-8 relative overflow-hidden bg-white/90">
    <!-- Header: Employee Info -->
    <div class="flex items-center gap-5 relative z-10">
      <PremiumAvatar :src="displayPic" :name="employee.name" size="lg" class="shrink-0 ring-4 ring-white shadow-sm" />

      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-black text-slate-900 truncate tracking-tight">{{ employee.name }}</h2>
        <div v-if="pendingEnrich" class="mt-2 space-y-2 w-1/2">
          <div class="h-2.5 bg-slate-100 rounded animate-pulse w-full"></div>
          <div class="h-2.5 bg-slate-100 rounded animate-pulse w-2/3"></div>
        </div>
        <div v-else class="mt-2 flex flex-wrap gap-2 items-center">
          <span v-if="displayPlantel" class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/60 flex items-center gap-1.5">
            <Building2 class="w-3.5 h-3.5 text-slate-400" />
            Base: {{ displayPlantel }}
          </span>
          <span v-if="displayRole" class="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100/60 flex items-center gap-1.5">
            <Briefcase class="w-3.5 h-3.5 text-brand-400" />
            {{ displayRole }}
          </span>
        </div>
      </div>
    </div>

    <!-- Active Folio Detection -->
    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="bg-brand-50/50 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 border border-brand-100/80 shadow-sm relative z-10 items-start sm:items-center justify-between group transition-colors hover:bg-brand-50">
        <div class="flex gap-4 items-center">
          <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-brand-200 shadow-sm transition-transform group-hover:scale-105">
            <FileText class="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h4 class="text-sm font-black text-brand-900 tracking-tight">Pase Abierto</h4>
            <p class="text-xs text-brand-700/90 mt-0.5 font-medium">El colaborador ya tiene un pase hoy.</p>
          </div>
        </div>
        <NuxtLink :to="`/pass/${todayPasses[0].id}`" class="shrink-0 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto outline-none">
          <span>Abrir Folio</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>
    </transition>

    <!-- History Timeline -->
    <div class="relative z-10 flex-1 flex flex-col min-h-0 bg-slate-50/50 rounded-2xl border border-slate-100 p-1">
      <div class="flex items-center justify-between mb-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm shrink-0">
        <div>
          <h3 class="text-sm font-black text-slate-900 tracking-tight">Historial</h3>
          <p class="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-1" v-if="historyData?.cycle">Ciclo Escolar {{ historyData.cycle }}</p>
        </div>
        <div class="flex gap-2">
          <div v-for="(count, cat) in statCounters" :key="cat" class="px-2.5 py-1.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs font-black text-slate-700 flex gap-1.5 items-center">
            <span class="text-brand-600">{{ count }}</span>
            <span class="text-[9px] uppercase tracking-wider text-slate-500">{{ getCategoryName(Number(cat)).split(' ')[0] }}</span>
          </div>
        </div>
      </div>

      <div class="p-4 flex-1 overflow-y-auto custom-scrollbar">
        <div v-if="pendingHistory" class="py-12 flex justify-center">
          <Loader2 class="w-8 h-8 animate-spin text-brand-400" />
        </div>
        
        <div v-else-if="!groupedHistory.length" class="py-12 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
            <History class="w-6 h-6 text-slate-300" />
          </div>
          <p class="text-sm font-black text-slate-700">Expediente en blanco</p>
          <p class="text-xs font-medium text-slate-500 mt-1">No hay incidencias registradas en el ciclo actual.</p>
        </div>

        <div v-else class="space-y-8 pl-2">
          <div v-for="group in groupedHistory" :key="group.month">
            <div class="sticky top-0 bg-slate-50/90 backdrop-blur-md py-2 z-20 mb-4 -mx-2 px-2">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">{{ group.month }}</span>
            </div>
            
            <div class="relative pl-7 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200/60">
              <div v-for="pass in group.passes" :key="pass.id" class="relative group">
                
                <!-- Timeline Dot -->
                <div class="absolute -left-[31px] w-6 h-6 rounded-full border-[3px] border-slate-50 shadow-sm z-10 top-0.5 flex items-center justify-center" :class="getCategoryColor(pass.category_id)">
                  <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                
                <!-- Pass Card -->
                <NuxtLink :to="`/pass/${pass.id}`" class="block bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-300 hover:shadow-md transition-all outline-none">
                  <div class="flex items-start justify-between mb-3 gap-4">
                    <div class="flex flex-col gap-1.5">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-sm font-black tracking-tight group-hover:text-brand-600 transition-colors" :class="isToday(pass.date) ? 'text-brand-600' : 'text-slate-900'">#{{ String(pass.id).padStart(5, '0') }}</span>
                        <span class="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md border"
                              :class="{'bg-amber-50 text-amber-700 border-amber-200': pass.status === 'pendiente',
                                       'bg-emerald-50 text-emerald-700 border-emerald-200': pass.status === 'autorizado',
                                       'bg-red-50 text-red-700 border-red-200': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                          {{ pass.status }}
                        </span>
                      </div>
                      <h4 class="text-sm font-bold text-slate-700">{{ getCategoryName(pass.category_id) }}</h4>
                    </div>
                    <span class="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shrink-0">{{ formatDateOnly(pass.date) }}</span>
                  </div>
                  
                  <p v-if="pass.comentarios" class="text-xs font-medium text-slate-600 italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">"{{ pass.comentarios }}"</p>
                  
                  <div v-if="pass.status !== 'pendiente' && pass.status !== 'cancelado'" class="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <ShieldCheck class="w-4 h-4" :class="pass.status === 'autorizado' ? 'text-emerald-500' : 'text-red-400'" />
                    <span class="text-[10px] font-bold uppercase tracking-wider" :class="pass.status === 'autorizado' ? 'text-emerald-700' : 'text-red-600'">
                      Resuelto{{ pass.authorized_by ? ' por ' + pass.authorized_by : '' }}
                    </span>
                  </div>
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
import { computed } from 'vue'
import { FileText, Loader2, ShieldCheck, History, Building2, Briefcase, ArrowRight } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const props = defineProps({ 
  employee: { type: Object, required: true } 
})

const getCategoryName = (id) => {
  const map = { 1: 'Llegada Tarde', 2: 'Salida Anticipada', 3: 'Ausencia', 4: 'Cambio Horario', 5: 'Incapacidad' }
  return map[id] || 'Otro'
}

const getCategoryColor = (id) => {
  const map = { 1: 'bg-orange-500', 2: 'bg-blue-500', 3: 'bg-rose-500', 4: 'bg-purple-500', 5: 'bg-teal-500' }
  return map[id] || 'bg-slate-400'
}

const { data: enrichment, pending: pendingEnrich } = useFetch('/api/employees/enrich', {
  query: { id: props.employee.id, name: props.employee.name }
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
    const month = dayjs(p.date).format('MMMM YYYY')
    if (!groups[month]) groups[month] = []
    groups[month].push(p)
  })
  return Object.keys(groups).map(month => ({ month, passes: groups[month] }))
})

const formatDateOnly = (dateStr) => dayjs(dateStr).format('DD MMM')
</script>