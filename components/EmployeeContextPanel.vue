<template>
  <div class="flex flex-col xl:h-full min-h-0 relative w-full bg-transparent">
    
    <!-- Top Information Card (Glassmorphism to let background flow through) -->
    <div class="flex flex-col relative z-20 shrink-0 mb-6 p-6 sm:p-8 bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] rounded-[2rem]">
      <div class="flex flex-col sm:flex-row sm:items-center gap-6">
        <PremiumAvatar :src="displayPic" :name="employee.name" size="lg" class="shrink-0 shadow-md border-2 border-white" />
        
        <div class="flex flex-col min-w-0 flex-1">
          <h2 class="text-2xl sm:text-3xl font-light text-[#50535A] tracking-tight line-clamp-2 break-words" :title="employee.name">
            {{ employee.name }}
          </h2>
          
          <div v-if="pendingEnrich" class="mt-3 space-y-2 w-32">
            <div class="h-2 bg-[#86888C]/10 rounded animate-pulse w-full"></div>
            <div class="h-2 bg-[#86888C]/10 rounded animate-pulse w-2/3"></div>
          </div>
          
          <div v-else class="mt-2.5 flex flex-wrap gap-3 items-center">
            <span v-if="displayPlantel" class="text-[#86888C] font-bold text-[11px] uppercase tracking-widest flex items-center gap-1.5 bg-white/50 px-2.5 py-1 rounded-lg border border-white">
              <Building2 class="w-3.5 h-3.5 opacity-70" /> {{ displayPlantel }}
            </span>
            <span v-if="displayPlantel && displayRole" class="text-[#86888C]/30 hidden sm:inline">•</span>
            <span v-if="displayRole" class="text-[#86888C] font-bold text-[11px] uppercase tracking-widest flex items-center gap-1.5 bg-white/50 px-2.5 py-1 rounded-lg border border-white">
              <Briefcase class="w-3.5 h-3.5 opacity-70" /> {{ displayRole }}
            </span>
          </div>
        </div>
      </div>

      <!-- KPI Summary -->
      <div class="flex flex-wrap gap-x-8 gap-y-4 mt-8 pt-6 border-t border-[#86888C]/15 relative">
        <div class="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80"></div>
        <div v-if="Object.keys(statCounters).length === 0" class="text-[11px] font-bold uppercase tracking-widest text-[#86888C] flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 text-[#8EC152]" /> Sin incidencias en el ciclo actual.
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
      <div v-if="todayPasses.length > 0" class="shrink-0 bg-gradient-to-r from-[#F49A6D]/10 to-transparent p-5 sm:p-6 flex flex-col sm:flex-row gap-5 border border-[#F49A6D]/20 shadow-sm rounded-[2rem] relative z-10 items-start sm:items-center justify-between group transition-all mb-8 backdrop-blur-md">
        <div class="flex gap-4 items-center min-w-0">
          <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#F49A6D]/20">
            <AlertCircle class="w-6 h-6 text-[#F49A6D]" />
          </div>
          <div class="min-w-0">
            <h4 class="text-base font-medium text-[#50535A] truncate">Registro abierto hoy</h4>
            <p class="text-[11px] font-bold text-[#86888C] uppercase tracking-widest mt-1 truncate">El colaborador ya cuenta con una incidencia en curso.</p>
          </div>
        </div>
        <NuxtLink :to="`/pass/${todayPasses[0].id}`" class="shrink-0 px-6 py-3 bg-white text-[#50535A] hover:text-[#007F92] border border-white shadow-sm hover:shadow-md rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 outline-none">
          <span>Revisar</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>
    </transition>

    <!-- Flowing Timeline Panel -->
    <div class="flex-1 xl:overflow-y-auto overflow-visible custom-scrollbar px-1 sm:px-2 pb-16 relative z-10 xl:[mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)] xl:[-webkit-mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]">
      
      <!-- Sticky Header for Timeline -->
      <div class="sticky top-0 z-30 pt-2 pb-4 mb-8 bg-white/60 backdrop-blur-xl border-b border-[#86888C]/15 flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mx-1 px-1 rounded-b-2xl">
        <div>
          <h3 class="text-xl sm:text-2xl font-light text-[#50535A] tracking-tight">Historial</h3>
          <p class="text-[10px] font-bold text-[#86888C] uppercase tracking-widest mt-1.5" v-if="historyData?.cycle">
            Ciclo Escolar {{ historyData.cycle }}
          </p>
        </div>
        <div class="relative group w-full sm:w-auto">
           <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search class="w-4 h-4 text-[#86888C] group-focus-within:text-[#007F92] transition-colors" />
           </div>
           <input type="text" v-model="searchQuery" placeholder="Buscar en historial..." class="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/80 focus:border-[#007F92] focus:ring-4 focus:ring-[#007F92]/10 rounded-xl text-sm text-[#50535A] outline-none transition-all placeholder:text-[#86888C]/60 shadow-sm" />
        </div>
      </div>

      <div v-if="pendingHistory" class="py-20 flex justify-center"><Loader2 class="w-8 h-8 animate-spin text-[#007F92]" /></div>
      
      <div v-else-if="historyError" class="py-16 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
        <div class="w-14 h-14 mb-4 rounded-full bg-white shadow-sm flex items-center justify-center">
          <AlertTriangle class="w-6 h-6 text-[#E83F4B]" />
        </div>
        <p class="text-base font-medium text-[#50535A]">Error de conexión</p>
        <p class="text-[11px] font-bold text-[#86888C] uppercase tracking-widest mt-1.5">No se pudo cargar la información</p>
      </div>

      <div v-else-if="!filteredGroupedHistory.length" class="py-16 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
        <div class="w-14 h-14 mb-4 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#86888C]/10">
          <FileText class="w-6 h-6 text-[#86888C]/40" />
        </div>
        <p class="text-base font-medium text-[#50535A]">Sin registros</p>
        <p class="text-[11px] font-bold text-[#86888C] uppercase tracking-widest mt-1.5">No hay incidencias que mostrar</p>
      </div>

      <div v-else class="relative mt-4">
        <!-- Main timeline loop -->
        <div v-for="group in filteredGroupedHistory" :key="group.month" class="mb-14 relative">
          
          <!-- Month Divider Header -->
          <div class="flex items-center mb-10 pl-[3.5rem] sm:pl-[4.5rem]">
             <span class="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-[#86888C] uppercase tracking-widest shadow-sm border border-white">
               {{ group.month }}
             </span>
          </div>
          
          <div class="relative w-full">
            <!-- Continuous Rail for the month -->
            <div class="absolute inset-y-0 left-[3.5rem] sm:left-[4.5rem] w-px bg-gradient-to-b from-[#86888C]/20 via-[#86888C]/20 to-transparent z-0 ml-[5px]"></div>

            <div class="space-y-8 relative z-10">
              <NuxtLink v-for="(pass, index) in group.passes" :key="pass.id" :to="`/pass/${pass.id}`" class="group flex items-start w-full relative outline-none cursor-pointer" :style="{ animationDelay: `${index * 0.05}s` }">
                
                <!-- Date Left Column -->
                <div class="w-[3.5rem] sm:w-[4.5rem] shrink-0 pt-4 text-right pr-4 sm:pr-6 transition-transform group-hover:-translate-x-1 duration-300">
                  <div class="text-2xl font-light text-[#50535A] leading-none">{{ formatDay(pass.date) }}</div>
                  <div class="text-[10px] font-black text-[#86888C] uppercase tracking-widest mt-1.5">{{ formatMonth(pass.date) }}</div>
                </div>

                <!-- Node Center Column -->
                <div class="absolute left-[3.5rem] sm:left-[4.5rem] top-[1.35rem] w-3 h-3 rounded-full border-[2.5px] border-white shadow-sm z-10 transition-transform duration-300 group-hover:scale-[1.3] group-hover:shadow-md" :class="getCategoryConfig(pass.category_id).bg"></div>

                <!-- Floating Card Content -->
                <div class="flex-1 pl-4 sm:pl-6 relative z-10">
                  <div class="bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] group-hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-[1.5rem] p-5 sm:p-6 group-hover:bg-white/90 group-hover:-translate-y-0.5">
                    
                    <!-- Header -->
                    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <div>
                        <h5 class="text-lg font-medium text-[#50535A] group-hover:text-[#007F92] transition-colors duration-300 leading-tight">
                          {{ getCategoryName(pass.category_id) }}
                        </h5>
                        <p v-if="pass.tipo_permiso" class="text-xs font-medium text-[#86888C] mt-1">{{ pass.tipo_permiso }}</p>
                      </div>
                      
                      <!-- Refined Status Pill -->
                      <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm shrink-0" :class="getStatusConfig(pass.status).badge">
                        <div class="w-1.5 h-1.5 rounded-full" :class="getStatusConfig(pass.status).dot"></div>
                        <span class="text-[9px] font-black uppercase tracking-widest">{{ pass.status }}</span>
                      </div>
                    </div>

                    <!-- Quoted Comment -->
                    <div v-if="pass.comentarios" class="relative pl-3.5 border-l-2 py-0.5 my-4 transition-all duration-300 bg-white/40 rounded-r-xl p-3 border-white shadow-sm" :class="getCategoryConfig(pass.category_id).border">
                      <p class="text-[13px] text-[#50535A] italic leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                        "{{ pass.comentarios }}"
                      </p>
                    </div>
                    
                    <!-- Footer Metadata -->
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 pt-4 border-t border-[#86888C]/10 text-[10px] font-black uppercase tracking-widest text-[#86888C]">
                      <span class="group-hover:text-[#50535A] transition-colors bg-[#86888C]/5 px-2 py-1 rounded-md">ID: {{ String(pass.id).padStart(5, '0') }}</span>
                      
                      <span v-if="pass.authorized_by" class="flex items-center gap-1.5 group-hover:text-[#50535A] transition-colors">
                        <span class="w-1 h-1 rounded-full bg-[#86888C]/40"></span>
                        Por {{ pass.authorized_by.split(' ')[0] || 'Responsable' }}
                      </span>

                      <span class="ml-auto flex items-center gap-1.5 text-[#007F92] opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 bg-[#007F92]/5 px-3 py-1 rounded-lg">
                        Ver detalle <ArrowRight class="w-3.5 h-3.5" />
                      </span>
                    </div>

                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { FileText, Loader2, Search, ArrowRight, AlertTriangle, Building2, Briefcase, CheckCircle2, AlertCircle } from 'lucide-vue-next'
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

const getCategoryConfig = (id) => {
  const map = {
    1: { bg: 'bg-[#F49A6D]', border: 'border-[#F49A6D]/60' },
    2: { bg: 'bg-[#007F92]', border: 'border-[#007F92]/60' },
    3: { bg: 'bg-[#E83F4B]', border: 'border-[#E83F4B]/60' },
    4: { bg: 'bg-[#FCBF2C]', border: 'border-[#FCBF2C]/60' },
    5: { bg: 'bg-[#5FB4A9]', border: 'border-[#5FB4A9]/60' }
  }
  return map[id] || { bg: 'bg-[#86888C]', border: 'border-[#86888C]/60' }
}

const getStatusConfig = (status) => {
  const s = status.toLowerCase()
  if (s === 'autorizado') return { badge: 'border-[#8EC152]/30 bg-[#8EC152]/10 text-[#00692F]', dot: 'bg-[#8EC152]' }
  if (s === 'rechazado') return { badge: 'border-[#E83F4B]/30 bg-[#E83F4B]/10 text-[#762728]', dot: 'bg-[#E83F4B]' }
  if (s === 'pendiente') return { badge: 'border-[#FCBF2C]/30 bg-[#FCBF2C]/10 text-[#6D5F24]', dot: 'bg-[#FCBF2C]' }
  return { badge: 'border-[#86888C]/20 bg-white/50 text-[#50535A]', dot: 'bg-[#86888C]' }
}

const formatDay = (dateStr) => dayjs(dateStr).format('DD')
const formatMonth = (dateStr) => dayjs(dateStr).format('MMM').replace('.', '')

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
</script>