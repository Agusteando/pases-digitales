### components/EmployeeContextPanel.vue
<template>
  <div class="flex flex-col h-full min-h-0 relative w-full">
    
    <!-- Header: Employee Context -->
    <div class="flex flex-col gap-4 relative z-10 shrink-0 mb-6 pb-6 border-b border-slate-100">
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <PremiumAvatar :src="displayPic" :name="employee.name" size="lg" class="shrink-0 shadow-sm" />
        
        <div class="flex flex-col min-w-0 flex-1">
          <h2 class="text-xl font-semibold text-slate-900 tracking-tight line-clamp-2 break-words" :title="employee.name">
            {{ employee.name }}
          </h2>
          
          <div v-if="pendingEnrich" class="mt-2 space-y-2 w-32">
            <div class="h-2 bg-slate-100 rounded animate-pulse w-full"></div>
            <div class="h-2 bg-slate-100 rounded animate-pulse w-2/3"></div>
          </div>
          
          <div v-else class="mt-1 flex flex-wrap gap-2 items-center">
            <span v-if="displayPlantel" class="text-slate-500 text-xs flex items-center gap-1">
              <Building2 class="w-3.5 h-3.5" /> {{ displayPlantel }}
            </span>
            <span v-if="displayPlantel && displayRole" class="text-slate-300">•</span>
            <span v-if="displayRole" class="text-slate-500 text-xs flex items-center gap-1">
              <Briefcase class="w-3.5 h-3.5" /> {{ displayRole }}
            </span>
          </div>
        </div>
      </div>

      <!-- KPI Summary Line -->
      <div class="flex flex-wrap items-center gap-2 mt-2">
        <div v-if="Object.keys(statCounters).length === 0" class="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md">
          <CheckCircle2 class="w-3.5 h-3.5 text-slate-400" /> Sin incidencias en el ciclo
        </div>
        <template v-else>
          <div v-for="(count, cat) in statCounters" :key="cat" class="flex items-center gap-1.5 px-2. py-1 rounded-md bg-slate-50 transition-all cursor-default">
            <div class="w-1.5 h-1.5 rounded-full" :class="getCategoryColor(Number(cat))"></div>
            <span class="text-[11px] font-medium text-slate-600">{{ getCategoryName(Number(cat)) }}</span>
            <span class="text-[11px] font-bold text-slate-700 ml-0.5">{{ count }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Active Open Pass Warning -->
    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="shrink-0 bg-amber-50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 border border-amber-100 relative z-10 items-start sm:items-center justify-between group transition-all mb-6">
        <div class="flex gap-3 items-center min-w-0">
          <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-600">
            <AlertCircle class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <h4 class="text-sm font-semibold text-amber-900 truncate">Pase abierto hoy</h4>
            <p class="text-xs text-amber-700 mt-0.5 truncate">El colaborador ya cuenta con un registro hoy.</p>
          </div>
        </div>
        <NuxtLink :to="`/pass/${todayPasses[0].id}`" class="shrink-0 px-3 py-2 bg-white text-amber-700 hover:text-amber-800 border border-amber-200 text-xs font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 outline-none">
          <span>Abrir</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>
    </transition>

    <!-- History Panel -->
    <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 sm:pr-4 pb-12 relative z-10" style="mask-image: linear-gradient(to bottom, black 90%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 90%, transparent 100%);">
      
      <!-- Sticky History Header -->
      <div class="sticky top-0 bg-white/95 backdrop-blur-xl z-30 pt-3 pb-3 mb-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <h3 class="text-sm font-semibold text-slate-800">Historial de pases</h3>
          <p class="text-xs text-slate-500" v-if="historyData?.cycle">Ciclo {{ historyData.cycle }}</p>
        </div>
        <!-- Subtly integrated search affordance -->
        <div class="relative flex items-center justify-end">
          <div class="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 transition-all duration-300 w-8 hover:w-48 focus-within:w-48 overflow-hidden group cursor-text">
            <Search class="w-4 h-4 text-slate-400 shrink-0 ml-0.5 group-hover:text-brand-500 focus-within:text-brand-500 transition-colors" />
            <input type="text" v-model="searchQuery" placeholder="Buscar..." class="ml-2 bg-transparent text-xs font-medium text-slate-700 outline-none w-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity placeholder:text-slate-400" />
          </div>
        </div>
      </div>

      <div v-if="pendingHistory" class="py-12 flex justify-center"><Loader2 class="w-6 h-6 animate-spin text-brand-400" /></div>
      
      <div v-else-if="historyError" class="py-12 flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border border-slate-100">
        <AlertTriangle class="w-6 h-6 text-slate-400 mb-2" />
        <p class="text-sm font-medium text-slate-600">Error de conexión</p>
      </div>

      <div v-else-if="!filteredGroupedHistory.length" class="py-12 flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border border-slate-100">
        <FileText class="w-6 h-6 text-slate-300 mb-2" />
        <p class="text-sm font-medium text-slate-600">Sin incidencias previas</p>
      </div>

      <div v-else class="relative mt-2">
        <div class="absolute top-2 bottom-0 left-[15px] w-px bg-slate-200 z-0"></div>

        <div v-for="group in filteredGroupedHistory" :key="group.month" class="mb-6">
          
          <div class="relative pl-10 mb-4 flex items-center">
             <div class="absolute left-[13px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 ring-4 ring-white z-10"></div>
             <span class="text-xs font-semibold text-slate-500">
               {{ group.month }}
             </span>
          </div>
          
          <div class="space-y-0">
            <div v-for="(pass, index) in group.passes" :key="pass.id" class="relative pl-10 pb-4 group/timeline timeline-item" :style="{ animationDelay: `${index * 0.04}s` }">
              
              <div class="absolute left-[12px] top-4 w-2 h-2 rounded-full z-10 ring-4 ring-white transition-transform duration-300 group-hover/timeline:scale-125" :class="getCategoryColor(pass.category_id)"></div>
              
              <div class="block bg-transparent py-2 group/card relative">
                <div class="flex items-baseline justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-medium text-slate-800">
                      {{ getCategoryName(pass.category_id) }}
                    </h4>
                    <span class="text-xs text-slate-400">#{{ String(pass.id).padStart(5, '0') }}</span>
                  </div>
                  <span class="text-xs text-slate-500">{{ formatDateOnly(pass.date) }}</span>
                </div>

                <div v-if="pass.tipo_permiso" class="mb-1">
                  <span class="text-xs text-slate-500">{{ pass.tipo_permiso }}</span>
                </div>
                
                <p v-if="pass.comentarios" class="text-sm text-slate-600 leading-relaxed line-clamp-2 mt-1">
                  {{ pass.comentarios }}
                </p>
                
                <div class="mt-2 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-md"
                          :class="{'bg-amber-50 text-amber-700': pass.status === 'pendiente',
                                   'bg-emerald-50 text-emerald-700': pass.status === 'autorizado',
                                   'bg-red-50 text-red-700': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                      {{ pass.status.charAt(0).toUpperCase() + pass.status.slice(1) }}
                    </span>
                    <span v-if="pass.status !== 'pendiente' && pass.status !== 'cancelado'" class="text-[10px] text-slate-500">
                      por {{ pass.authorized_by ? pass.authorized_by.split(' ')[0] : 'Sistema' }}
                    </span>
                  </div>
                  
                  <NuxtLink :to="`/pass/${pass.id}`" class="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-[11px] font-medium opacity-0 group-hover/card:opacity-100 transition-opacity outline-none">
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
import { computed, ref } from 'vue'
import { FileText, Loader2, ShieldCheck, History, Building2, Briefcase, ArrowRight, AlertTriangle, AlertCircle, Search, CheckCircle2 } from 'lucide-vue-next'
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
  const map = { 1: 'bg-orange-400', 2: 'bg-blue-400', 3: 'bg-rose-400', 4: 'bg-amber-400', 5: 'bg-teal-400' }
  return map[id] || 'bg-slate-300'
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
    const month = dayjs(p.date).format('MMMM YYYY')
    if (!groups[month]) groups[month] = []
    groups[month].push(p)
  })
  return Object.keys(groups).map(month => ({ month, passes: groups[month] }))
})

const searchQuery = ref('')

const filteredGroupedHistory = computed(() => {
  if (!groupedHistory.value.length) return []
  if (!searchQuery.value) return groupedHistory.value
  
  const q = searchQuery.value.toLowerCase().trim()
  
  return groupedHistory.value.map(group => {
    const groupMonth = group.month.toLowerCase()
    const matchesMonth = groupMonth.includes(q)
    
    const filteredPasses = group.passes.filter(p => {
      if (matchesMonth) return true
      
      const catName = getCategoryName(p.category_id).toLowerCase()
      const status = p.status.toLowerCase()
      const comments = (p.comentarios || '').toLowerCase()
      const type = (p.tipo_permiso || '').toLowerCase()
      const idStr = String(p.id)
      const dateStr = dayjs(p.date).format('DD MMMM YYYY').toLowerCase()
      const dayStr = dayjs(p.date).format('DD MMM').toLowerCase()
      
      return catName.includes(q) || 
             status.includes(q) || 
             comments.includes(q) || 
             type.includes(q) || 
             idStr.includes(q) ||
             dateStr.includes(q) ||
             dayStr.includes(q)
    })
    
    return {
      ...group,
      passes: filteredPasses
    }
  }).filter(group => group.passes.length > 0)
})

const formatDateOnly = (dateStr) => dayjs(dateStr).format('DD MMM')
</script>