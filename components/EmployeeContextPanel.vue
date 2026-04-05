<template>
  <div class="glass-card p-6 md:p-8 rounded-3xl flex flex-col gap-8 relative overflow-hidden bg-white/90">
    <!-- Header: Employee Info -->
    <div class="flex items-center gap-5 relative z-10">
      <div class="relative shrink-0">
        <div v-if="pendingEnrich" class="w-20 h-20 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60"></div>
        <img v-else :src="displayPic" @error="handleImageError" class="w-20 h-20 rounded-2xl object-cover bg-white shadow-sm border border-slate-200/60 ring-4 ring-white" alt="Fotografía" />
      </div>

      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-black text-slate-900 truncate tracking-tight">{{ employee.name }}</h2>
        <div v-if="pendingEnrich" class="mt-2 space-y-2 w-1/2">
          <div class="h-2.5 bg-slate-100 rounded animate-pulse w-full"></div>
          <div class="h-2.5 bg-slate-100 rounded animate-pulse w-2/3"></div>
        </div>
        <div v-else class="mt-2 flex flex-wrap gap-2 items-center">
          <span v-if="displayPlantel" class="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/60 flex items-center gap-1.5">
            <Building2 class="w-3.5 h-3.5 text-slate-400" />
            {{ displayPlantel }}
          </span>
          <span v-if="displayRole" class="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100/60 flex items-center gap-1.5">
            <Briefcase class="w-3.5 h-3.5 text-brand-400" />
            {{ displayRole }}
          </span>
        </div>
      </div>
    </div>

    <!-- Active Warning: Duplicate Prevention -->
    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="bg-amber-50 rounded-2xl p-4 flex gap-4 border border-amber-200/60 shadow-sm relative z-10 items-start">
        <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
          <AlertTriangle class="w-5 h-5 text-amber-600" />
        </div>
        <div class="flex-1 pt-0.5">
          <h4 class="text-sm font-black text-amber-900 tracking-tight">Pase previo detectado</h4>
          <p class="text-xs text-amber-800/80 mt-1 font-medium leading-relaxed">El colaborador ya tiene un registro generado durante esta jornada operativa. Verifica antes de duplicar.</p>
        </div>
      </div>
    </transition>

    <!-- History Timeline (Ciclo Escolar) -->
    <div class="relative z-10 flex-1 flex flex-col min-h-0 bg-slate-50/50 rounded-2xl border border-slate-100 p-1">
      <div class="flex items-center justify-between mb-2 bg-white p-4 rounded-xl border border-slate-100 shadow-sm shrink-0">
        <div>
          <h3 class="text-sm font-black text-slate-900 tracking-tight">Cronología de Eventos</h3>
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
                <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-300 hover:shadow-md transition-all">
                  <div class="flex items-start justify-between mb-3 gap-4">
                    <div class="flex flex-col gap-1.5">
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-sm font-black tracking-tight" :class="isToday(pass.date) ? 'text-brand-600' : 'text-slate-900'">#{{ String(pass.id).padStart(5, '0') }}</span>
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
import { computed, ref } from 'vue'
import { AlertTriangle, Loader2, ShieldCheck, History, Building2, Briefcase } from 'lucide-vue-next'
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

const useFallbackImage = ref(false)
function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=eef2ff&color=4f46e5&bold=true`
}

function handleImageError(event) {
  useFallbackImage.value = true
  event.target.src = getFallbackAvatar(props.employee.name)
}

const { data: enrichment, pending: pendingEnrich } = useFetch('/api/employees/enrich', {
  query: { id: props.employee.id, name: props.employee.name }
})

const { data: historyData, pending: pendingHistory } = useFetch('/api/passes/employee', {
  query: { name: props.employee.name },
  lazy: true
})

const displayPic = computed(() => useFallbackImage.value || !enrichment.value?.picture ? getFallbackAvatar(props.employee.name) : enrichment.value.picture)
const displayRole = computed(() => enrichment.value?.puesto || props.employee.puesto || null)
const displayPlantel = computed(() => enrichment.value?.plantelId || props.employee.plantel || null)

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