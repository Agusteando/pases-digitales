<template>
  <div class="flex flex-col xl:h-full min-h-0 relative w-full">
    
    <!-- Header: Employee Context -->
    <div class="flex flex-col relative z-10 shrink-0 mb-6 pb-6 border-b border-slate-200/60">
      <div class="flex flex-col sm:flex-row sm:items-center gap-5">
        <PremiumAvatar :src="displayPic" :name="employee.name" size="lg" class="shrink-0 shadow-sm border border-slate-100" />
        
        <div class="flex flex-col min-w-0 flex-1">
          <h2 class="text-2xl font-black text-slate-900 tracking-tight line-clamp-2 break-words" :title="employee.name">
            {{ employee.name }}
          </h2>
          
          <div v-if="pendingEnrich" class="mt-2 space-y-2 w-32">
            <div class="h-2 bg-slate-100 rounded animate-pulse w-full"></div>
            <div class="h-2 bg-slate-100 rounded animate-pulse w-2/3"></div>
          </div>
          
          <div v-else class="mt-1.5 flex flex-wrap gap-2.5 items-center">
            <span v-if="displayPlantel" class="text-slate-600 font-bold text-xs flex items-center gap-1.5">
              <Building2 class="w-3.5 h-3.5 text-slate-400" /> {{ displayPlantel }}
            </span>
            <span v-if="displayPlantel && displayRole" class="text-slate-300">•</span>
            <span v-if="displayRole" class="text-slate-600 font-bold text-xs flex items-center gap-1.5">
              <Briefcase class="w-3.5 h-3.5 text-slate-400" /> {{ displayRole }}
            </span>
          </div>
        </div>
      </div>

      <!-- KPI Summary -->
      <div class="flex flex-wrap gap-x-8 gap-y-4 mt-5 pt-5 border-t border-slate-200/60">
        <div v-if="Object.keys(statCounters).length === 0" class="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 class="w-4 h-4 text-emerald-500" /> Sin incidencias registradas en el ciclo actual.
        </div>
        <template v-else>
          <KpiIndicator 
            v-for="(count, cat) in statCounters" 
            :key="cat" 
            :count="count" 
            :label="getCategoryName(Number(cat))" 
          />
        </template>
      </div>
    </div>

    <!-- Active Open Pass Warning -->
    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="shrink-0 bg-[#F49A6D]/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 border border-[#F49A6D]/20 relative z-10 items-start sm:items-center justify-between group transition-all mb-6">
        <div class="flex gap-3 items-center min-w-0">
          <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-[#F49A6D]/20 shadow-sm text-[#F49A6D]">
            <AlertCircle class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <h4 class="text-sm font-black text-slate-800 truncate">Pase abierto hoy</h4>
            <p class="text-[11px] font-bold text-slate-600 mt-0.5 truncate">El colaborador ya cuenta con un registro hoy.</p>
          </div>
        </div>
        <NuxtLink :to="`/pass/${todayPasses[0].id}`" class="shrink-0 px-4 py-2.5 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-black rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 outline-none uppercase tracking-widest">
          <span>Abrir</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>
    </transition>

    <!-- History Panel -->
    <div class="flex-1 xl:overflow-y-auto overflow-visible custom-scrollbar pr-2 sm:pr-4 pb-12 relative z-10 xl:[mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)] xl:[-webkit-mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]">
      
      <!-- Refined Sticky History Header -->
      <div class="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md pt-2 pb-3 mb-5 border-b border-slate-200/60 flex items-end justify-between px-1">
        <div class="flex flex-col">
          <h3 class="text-sm font-black text-slate-800 tracking-tight">Historial operativo</h3>
          <p class="text-[10px] font-bold text-slate-400 mt-0.5" v-if="historyData?.cycle">Ciclo {{ historyData.cycle }}</p>
        </div>
        <div class="relative">
           <div class="flex items-center bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl px-2.5 py-1.5 transition-all shadow-sm w-32 focus-within:w-48 overflow-hidden group cursor-text">
              <Search class="w-3.5 h-3.5 text-slate-400 shrink-0 group-focus-within:text-[#007F92] transition-colors" />
              <input type="text" v-model="searchQuery" placeholder="Buscar..." class="ml-2 w-full bg-transparent text-[11px] font-bold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-medium" />
           </div>
        </div>
      </div>

      <div v-if="pendingHistory" class="py-16 flex justify-center"><Loader2 class="w-8 h-8 animate-spin text-[#007F92]" /></div>
      
      <div v-else-if="historyError" class="py-16 flex flex-col items-center justify-center text-center bg-slate-50 rounded-[2rem] border border-slate-100">
        <AlertTriangle class="w-8 h-8 text-slate-300 mb-3" />
        <p class="text-sm font-black text-slate-600">Error de conexión</p>
        <p class="text-xs font-medium text-slate-500 mt-1">No se pudo cargar la información.</p>
      </div>

      <div v-else-if="!filteredGroupedHistory.length" class="py-16 flex flex-col items-center justify-center text-center bg-slate-50 rounded-[2rem] border border-slate-100">
        <FileText class="w-8 h-8 text-slate-300 mb-3" />
        <p class="text-sm font-black text-slate-600">Sin incidencias previas</p>
        <p class="text-xs font-medium text-slate-500 mt-1">No hay registros que mostrar.</p>
      </div>

      <div v-else class="relative mt-2">
        <div class="absolute top-2 bottom-0 left-[19px] w-[2px] bg-slate-200/60 rounded-full z-0"></div>

        <div v-for="group in filteredGroupedHistory" :key="group.month" class="mb-8">
          
          <div class="relative pl-12 mb-5 flex items-center">
             <div class="absolute left-[16px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-slate-50 z-10 shadow-sm"></div>
             <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
               {{ group.month }}
             </span>
          </div>
          
          <div class="space-y-0">
            <div v-for="(pass, index) in group.passes" :key="pass.id" class="relative pl-12 pb-5 group/timeline timeline-item" :style="{ animationDelay: `${index * 0.04}s` }">
              
              <div class="absolute left-[15px] top-5 w-2.5 h-2.5 rounded-full z-10 ring-[4px] ring-slate-50 transition-transform duration-300 group-hover/timeline:scale-125 shadow-sm" :class="getCategoryColor(pass.category_id)"></div>
              
              <div class="block bg-white/80 backdrop-blur-sm p-4 sm:p-5 rounded-[1.25rem] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative group/card">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2 relative z-10">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-black text-slate-400 group-hover/card:text-slate-600 transition-colors">#{{ String(pass.id).padStart(5, '0') }}</span>
                    <span class="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border"
                          :class="{'bg-amber-50 text-amber-700 border-amber-200/60': pass.status === 'pendiente',
                                   'bg-emerald-50 text-emerald-700 border-emerald-200/60': pass.status === 'autorizado',
                                   'bg-rose-50 text-rose-700 border-rose-200/60': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                      {{ pass.status }}
                    </span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 shrink-0 w-max">{{ formatDateOnly(pass.date) }}</span>
                </div>
                
                <h4 class="text-sm font-black text-slate-800 flex flex-wrap items-center gap-2 mb-1 relative z-10 tracking-tight">
                  {{ getCategoryName(pass.category_id) }}
                </h4>

                <div v-if="pass.tipo_permiso" class="mb-2 relative z-10">
                  <span class="inline-flex items-center text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">{{ pass.tipo_permiso }}</span>
                </div>
                
                <p v-if="pass.comentarios" class="text-xs font-medium text-slate-600 leading-relaxed mt-2 relative z-10">"{{ pass.comentarios }}"</p>
                
                <div class="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between relative z-10">
                  <div v-if="pass.status !== 'pendiente' && pass.status !== 'cancelado'" class="flex items-center gap-1.5">
                    <ShieldCheck class="w-3.5 h-3.5" :class="pass.status === 'autorizado' ? 'text-emerald-500' : 'text-rose-500'" />
                    <span class="text-[9px] font-bold uppercase tracking-widest" :class="pass.status === 'autorizado' ? 'text-emerald-700' : 'text-rose-700'">
                      Autorizado{{ pass.authorized_by ? ' por ' + pass.authorized_by.split(' ')[0] : '' }}
                    </span>
                  </div>
                  <div v-else></div>
                  
                  <NuxtLink :to="`/pass/${pass.id}`" class="text-[#007F92] flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity hover:text-[#006575] outline-none text-[10px] font-black uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
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
import KpiIndicator from '~/components/KpiIndicator.vue'
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
  const map = { 1: 'bg-[#F49A6D]', 2: 'bg-[#66A8D8]', 3: 'bg-[#E83F4B]', 4: 'bg-[#FCBF2C]', 5: 'bg-[#007F92]' }
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