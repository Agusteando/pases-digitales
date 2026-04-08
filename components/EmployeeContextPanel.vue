<template>
  <div class="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-8 relative overflow-hidden">
    <!-- Header: Employee Info -->
    <div class="flex items-center gap-6 relative z-10">
      <PremiumAvatar :src="displayPic" :name="employee.name" size="lg" class="shrink-0 ring-4 ring-white shadow-md" />

      <div class="flex-1 min-w-0">
        <h2 class="text-3xl font-black text-slate-900 truncate tracking-tight">{{ employee.name }}</h2>
        <div v-if="pendingEnrich" class="mt-3 space-y-2 w-1/2">
          <div class="h-2.5 bg-white rounded animate-pulse w-full"></div>
          <div class="h-2.5 bg-white rounded animate-pulse w-2/3"></div>
        </div>
        <div v-else class="mt-3 flex flex-wrap gap-2 items-center">
          <span v-if="displayPlantel" class="px-3.5 py-1.5 bg-white/70 backdrop-blur-sm text-slate-700 text-xs font-bold rounded-xl border border-white shadow-sm flex items-center gap-1.5">
            <Building2 class="w-3.5 h-3.5 text-casita-green" />
            {{ displayPlantel }}
          </span>
          <span v-if="displayRole" class="px-3.5 py-1.5 bg-white/70 backdrop-blur-sm text-slate-700 text-xs font-bold rounded-xl border border-white shadow-sm flex items-center gap-1.5">
            <Briefcase class="w-3.5 h-3.5 text-iedis-blue" />
            {{ displayRole }}
          </span>
        </div>
      </div>
    </div>

    <!-- Active Folio Detection -->
    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="bg-gradient-to-r from-iedis-teal/10 to-iedis-teal/5 rounded-[2rem] p-6 flex flex-col sm:flex-row gap-5 border border-iedis-teal/20 shadow-sm relative z-10 items-start sm:items-center justify-between group transition-all hover:bg-iedis-teal/10">
        <div class="flex gap-4 items-center">
          <div class="w-12 h-12 rounded-[1rem] bg-white flex items-center justify-center shrink-0 border border-iedis-teal/30 shadow-sm transition-transform group-hover:scale-105">
            <FileText class="w-5 h-5 text-iedis-teal" />
          </div>
          <div>
            <h4 class="text-sm font-black text-iedis-teal-dark tracking-tight">Pase abierto</h4>
            <p class="text-xs text-iedis-teal-dark/80 mt-1 font-medium">El colaborador tiene un pase registrado el día de hoy.</p>
          </div>
        </div>
        <NuxtLink :to="`/pass/${todayPasses[0].id}`" class="shrink-0 px-6 py-3 bg-white hover:bg-white/80 text-iedis-teal-dark border border-white text-xs font-black rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 w-full sm:w-auto outline-none">
          <span>Abrir pase actual</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>
    </transition>

    <!-- History Timeline -->
    <div class="relative z-10 flex-1 flex flex-col min-h-0 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white shadow-sm p-1.5">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2 bg-white/80 p-5 rounded-[1.5rem] border border-white shadow-sm shrink-0">
        <div>
          <h3 class="text-sm font-black text-slate-900 tracking-tight">Historial</h3>
          <p class="text-[10px] font-black text-brand-500 uppercase tracking-widest mt-1" v-if="historyData?.cycle">Ciclo Escolar {{ historyData.cycle }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <div v-for="(count, cat) in statCounters" :key="cat" class="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-700 flex gap-1.5 items-center shadow-sm">
            <span class="text-brand-600">{{ count }}</span>
            <span class="text-[9px] uppercase tracking-wider text-slate-500">{{ getCategoryName(Number(cat)).split(' ')[0] }}</span>
          </div>
        </div>
      </div>

      <div class="p-5 flex-1 overflow-y-auto custom-scrollbar">
        <div v-if="pendingHistory" class="py-12 flex justify-center">
          <Loader2 class="w-8 h-8 animate-spin text-brand-400" />
        </div>
        
        <div v-else-if="!groupedHistory.length" class="py-16 flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mb-4 shadow-sm border border-white">
            <History class="w-8 h-8 text-slate-300" />
          </div>
          <p class="text-sm font-black text-slate-700">Sin registros</p>
          <p class="text-xs font-medium text-slate-500 mt-1.5">No hay pases registrados en el ciclo actual.</p>
        </div>

        <div v-else class="space-y-8 pl-4">
          <div v-for="group in groupedHistory" :key="group.month">
            <div class="sticky top-0 bg-white/80 backdrop-blur-md py-2.5 z-20 mb-5 -mx-4 px-4 rounded-xl border border-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">{{ group.month }}</span>
            </div>
            
            <div class="relative pl-8 space-y-6 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-casita-green-light/40 before:via-iedis-teal/40 before:to-transparent">
              <div v-for="(pass, index) in group.passes" :key="pass.id" class="relative group timeline-item" :style="{ animationDelay: `${index * 0.08}s` }">
                
                <!-- Timeline Dot -->
                <div class="absolute -left-[35px] w-7 h-7 rounded-full bg-white shadow-sm z-10 top-0.5 flex items-center justify-center border border-white/60">
                  <div class="w-3.5 h-3.5 rounded-full" :class="getCategoryColor(pass.category_id)"></div>
                </div>
                
                <!-- Pass Card -->
                <div class="block bg-white/70 p-5 rounded-[1.5rem] border border-white shadow-sm hover:shadow-md hover:bg-white transition-all outline-none">
                  <div class="flex items-start justify-between mb-4 gap-4">
                    <div class="flex flex-col gap-1.5">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-sm font-black tracking-tight" :class="isToday(pass.date) ? 'text-brand-600' : 'text-slate-900'">#{{ String(pass.id).padStart(5, '0') }}</span>
                        <span class="text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md border"
                              :class="{'bg-casita-gold/10 text-casita-gold-dark border-casita-gold/30': pass.status === 'pendiente',
                                       'bg-casita-green/10 text-casita-green border-casita-green/30': pass.status === 'autorizado',
                                       'bg-casita-red/10 text-casita-red border-casita-red/30': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                          {{ pass.status }}
                        </span>
                      </div>
                      <h4 class="text-sm font-bold text-slate-700">{{ getCategoryName(pass.category_id) }}</h4>
                    </div>
                    <span class="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm shrink-0">{{ formatDateOnly(pass.date) }}</span>
                  </div>
                  
                  <p v-if="pass.comentarios" class="text-xs font-medium text-slate-600 italic bg-white/50 p-3 rounded-2xl border border-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] line-clamp-2">"{{ pass.comentarios }}"</p>
                  
                  <!-- Bottom Bar with Explicit Action Link -->
                  <div class="mt-4 pt-3 border-t border-white flex items-center justify-between">
                    <div v-if="pass.status !== 'pendiente' && pass.status !== 'cancelado'" class="flex items-center gap-2">
                      <ShieldCheck class="w-4 h-4" :class="pass.status === 'autorizado' ? 'text-casita-green' : 'text-casita-red'" />
                      <span class="text-[10px] font-bold uppercase tracking-wider" :class="pass.status === 'autorizado' ? 'text-casita-green-dark' : 'text-casita-red-dark'">
                        Resuelto{{ pass.authorized_by ? ' por ' + pass.authorized_by : '' }}
                      </span>
                    </div>
                    <div v-else></div> <!-- Spacer -->
                    
                    <NuxtLink :to="`/pass/${pass.id}`" class="text-brand-600 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white hover:bg-brand-50 px-3 py-1.5 rounded-xl border border-white hover:border-brand-100 shadow-sm outline-none">
                      <span class="text-[10px] font-black uppercase tracking-widest">Abrir detalle</span>
                      <ArrowRight class="w-3.5 h-3.5" />
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
import { FileText, Loader2, ShieldCheck, History, Building2, Briefcase, ArrowRight } from 'lucide-vue-next'
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

const { data: historyData, pending: pendingHistory } = useFetch('/api/passes/employee', {
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
    const month = dayjs(p.date).format('MMMM YYYY')
    if (!groups[month]) groups[month] = []
    groups[month].push(p)
  })
  return Object.keys(groups).map(month => ({ month, passes: groups[month] }))
})

const formatDateOnly = (dateStr) => dayjs(dateStr).format('DD MMM')
</script>