<template>
  <div class="glass-card p-5 md:p-6 rounded-2xl flex flex-col gap-6 relative overflow-hidden bg-white/80">
    <!-- Header: Employee Info -->
    <div class="flex items-center gap-4 relative z-10">
      <div class="relative shrink-0">
        <div v-if="pendingEnrich" class="w-16 h-16 rounded-2xl bg-slate-200 animate-pulse border border-slate-100"></div>
        <img v-else :src="displayPic" @error="handleImageError" class="w-16 h-16 rounded-2xl object-cover bg-white shadow-md border border-slate-200" alt="Fotografía" />
      </div>

      <div class="flex-1 min-w-0">
        <h2 class="text-xl font-black text-slate-900 truncate tracking-tight">{{ employee.name }}</h2>
        <div v-if="pendingEnrich" class="mt-1 space-y-2 w-1/2">
          <div class="h-2.5 bg-slate-200 rounded animate-pulse w-full"></div>
          <div class="h-2.5 bg-slate-200 rounded animate-pulse w-2/3"></div>
        </div>
        <div v-else class="mt-1.5 flex flex-wrap gap-2">
          <span class="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">Plantel {{ displayPlantel }}</span>
          <span class="px-2 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100 truncate max-w-[200px]">{{ displayRole }}</span>
        </div>
      </div>
    </div>

    <!-- Active Warning: Duplicate Prevention -->
    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="bg-amber-50 rounded-xl p-3 flex gap-3 border border-amber-200 shadow-sm relative z-10 items-center">
        <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle class="w-4 h-4 text-amber-600" />
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-bold text-amber-900">Pase previo detectado</h4>
          <p class="text-xs text-amber-800 mt-0.5 font-medium">El colaborador ya tiene un pase registrado hoy. Verifique el historial antes de duplicar la operación.</p>
        </div>
      </div>
    </transition>

    <!-- History Timeline (Ciclo Escolar) -->
    <div class="relative z-10 flex-1 flex flex-col min-h-0">
      <div class="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0">
        <div>
          <h3 class="text-sm font-black text-slate-800">Historial Operativo</h3>
          <p class="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-0.5" v-if="historyData?.cycle">Ciclo Escolar {{ historyData.cycle }}</p>
        </div>
        <div class="flex gap-2">
          <div v-for="(count, cat) in statCounters" :key="cat" class="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600 flex gap-1 items-center shadow-sm">
            <span>{{ count }}</span>
            <span class="text-[9px] uppercase tracking-wide opacity-70">{{ getCategoryName(Number(cat)).split(' ')[0] }}</span>
          </div>
        </div>
      </div>

      <div v-if="pendingHistory" class="py-12 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-slate-300" />
      </div>
      
      <div v-else-if="!groupedHistory.length" class="py-10 text-center bg-white/50 rounded-xl border border-slate-200 border-dashed">
        <p class="text-sm font-bold text-slate-500">Expediente Limpio</p>
        <p class="text-xs font-medium text-slate-400 mt-1">No hay incidencias en el ciclo escolar actual.</p>
      </div>

      <div v-else class="flex-1 overflow-y-auto custom-scrollbar pr-3 -mr-3 space-y-6">
        <div v-for="group in groupedHistory" :key="group.month">
          <div class="sticky top-0 bg-white/90 backdrop-blur-sm py-1.5 z-20 mb-3 border-b border-slate-100">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ group.month }}</span>
          </div>
          
          <div class="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            <div v-for="pass in group.passes" :key="pass.id" class="relative group">
              
              <!-- Timeline Dot -->
              <div class="absolute -left-6 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 top-1" :class="getCategoryColor(pass.category_id)"></div>
              
              <!-- Pass Card -->
              <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm font-black tracking-tight" :class="isToday(pass.date) ? 'text-brand-600' : 'text-slate-700'">#{{ String(pass.id).padStart(5, '0') }}</span>
                    <span class="text-[9px] uppercase font-black tracking-wide px-1.5 py-0.5 rounded border"
                          :class="{'bg-amber-50 text-amber-700 border-amber-200': pass.status === 'pendiente',
                                   'bg-emerald-50 text-emerald-700 border-emerald-200': pass.status === 'autorizado',
                                   'bg-red-50 text-red-700 border-red-200': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                      {{ pass.status }}
                    </span>
                  </div>
                  <span class="text-xs font-bold text-slate-500">{{ formatDateOnly(pass.date) }}</span>
                </div>
                
                <h4 class="text-sm font-bold text-slate-800 mb-0.5">{{ getCategoryName(pass.category_id) }}</h4>
                <p v-if="pass.comentarios" class="text-xs font-medium text-slate-500 italic line-clamp-1">"{{ pass.comentarios }}"</p>
                
                <div v-if="pass.status !== 'pendiente' && pass.status !== 'cancelado'" class="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <ShieldCheck class="w-3.5 h-3.5 text-slate-400" />
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    {{ pass.status }} por {{ pass.authorized_by || 'Sistema' }}
                  </span>
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
import { AlertTriangle, Loader2, ShieldCheck, LogIn, LogOut, UserX, Clock, Stethoscope } from 'lucide-vue-next'
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
  return map[id] || 'bg-slate-500'
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
const displayRole = computed(() => enrichment.value?.puesto || 'Puesto Funcional No Especificado')
const displayPlantel = computed(() => enrichment.value?.plantelId || props.employee.plantel)

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