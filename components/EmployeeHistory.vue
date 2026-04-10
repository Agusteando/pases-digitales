### components/EmployeeHistory.vue
<template>
  <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 sm:pr-4 pb-12 relative z-10" style="mask-image: linear-gradient(to bottom, black 90%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 90%, transparent 100%);">
    
    <!-- Sticky History Header -->
    <div class="sticky top-0 bg-slate-50/95 backdrop-blur-xl z-30 pt-1 pb-3 mb-6 border-b border-slate-200/50 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
          <History class="w-4 h-4 text-brand-500 shrink-0" /> Historial
        </h3>
        <span class="text-[9px] font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-md uppercase tracking-widest border border-brand-100 shadow-sm" v-if="historyData?.cycle">
          Ciclo {{ historyData.cycle }}
        </span>
      </div>
      
      <!-- Subtle Search Affordance -->
      <div class="relative flex items-center group">
        <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none group-hover:text-brand-500 group-focus-within:text-brand-500 transition-colors" />
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Buscar..." 
          class="w-8 hover:w-48 focus:w-48 pl-8 pr-3 py-1.5 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200/80 focus:border-brand-200 rounded-full text-xs font-bold text-slate-700 outline-none transition-all duration-300 shadow-none hover:shadow-sm focus:shadow-sm placeholder:text-slate-400 cursor-pointer focus:cursor-text"
        />
      </div>
    </div>

    <div v-if="pending" class="py-12 flex justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-brand-400" />
    </div>
    
    <div v-else-if="error" class="py-16 flex flex-col items-center justify-center text-center bg-white/40 rounded-[2rem] border border-white border-dashed">
      <div class="w-16 h-16 bg-casita-red/10 rounded-full flex items-center justify-center mb-4 border border-casita-red/20">
        <AlertTriangle class="w-6 h-6 text-casita-red" />
      </div>
      <p class="text-sm font-black text-casita-red-dark">Error de conexión</p>
      <p class="text-xs font-medium text-casita-red-dark/80 mt-1">No se pudo recuperar el historial de la base de datos.</p>
    </div>

    <div v-else-if="!filteredGroupedHistory.length" class="py-16 flex flex-col items-center justify-center text-center bg-white/40 rounded-[2rem] border border-white border-dashed">
      <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
        <FileText class="w-6 h-6 text-slate-300" />
      </div>
      <p class="text-base font-black text-slate-700">Sin coincidencias</p>
      <p class="text-sm font-medium text-slate-500 mt-1">No hay pases que coincidan con la búsqueda actual.</p>
    </div>

    <div v-else class="relative mt-2">
      <div class="absolute top-2 bottom-0 left-[19px] w-[2px] bg-slate-200/60 rounded-full z-0"></div>
      <div class="absolute top-2 bottom-0 left-[19px] w-[2px] rounded-full z-0 timeline-line opacity-40"></div>

      <div v-for="group in filteredGroupedHistory" :key="group.month" class="mb-8">
        
        <div class="relative pl-12 mb-4 flex items-center">
           <div class="absolute left-[15px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-slate-50/90 z-10 shadow-sm"></div>
           <span class="sticky top-[68px] sm:top-[60px] z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 border border-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)]">
             {{ group.month }}
           </span>
        </div>
        
        <div class="space-y-0">
          <div v-for="(pass, index) in group.passes" :key="pass.id" class="relative pl-12 pb-5 group/timeline timeline-item" :style="{ animationDelay: `${index * 0.04}s` }">
            
            <div class="absolute left-[13px] top-5 w-3.5 h-3.5 rounded-full z-10 ring-[4px] ring-slate-50/90 transition-transform duration-300 group-hover/timeline:scale-125 shadow-sm" :class="getCategoryColor(pass.category_id)"></div>
            
            <div class="block bg-white p-4 sm:p-5 rounded-[1.25rem] border border-slate-100/80 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.06)] transition-all outline-none relative overflow-hidden group/card">
              <div class="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2 relative z-10">
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm font-black text-slate-500 group-hover/card:text-brand-600 transition-colors tracking-tight">#{{ String(pass.id).padStart(5, '0') }}</span>
                    <span class="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md border"
                          :class="{'bg-casita-gold/10 text-casita-gold-dark border-casita-gold/20': pass.status === 'pendiente',
                                   'bg-casita-green/10 text-casita-green-dark border-casita-green/20': pass.status === 'autorizado',
                                   'bg-casita-red/10 text-casita-red-dark border-casita-red/20': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                      {{ pass.status }}
                    </span>
                  </div>
                  <h4 class="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-2">
                    {{ getCategoryName(pass.category_id) }}
                    <span v-if="pass.tipo_permiso" class="text-[9px] font-black bg-slate-50 text-slate-500 uppercase tracking-widest px-2 py-0.5 rounded-md border border-slate-200/50">{{ pass.tipo_permiso }}</span>
                  </h4>
                </div>
                <span class="text-[10px] sm:text-[11px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shrink-0 w-max">{{ formatDateOnly(pass.date) }}</span>
              </div>
              
              <p v-if="pass.comentarios" class="text-[11px] font-medium text-slate-600 leading-relaxed italic bg-slate-50/50 p-3 rounded-xl border border-slate-100 line-clamp-2 relative z-10">"{{ pass.comentarios }}"</p>
              
              <div class="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between relative z-10">
                <div v-if="pass.status !== 'pendiente' && pass.status !== 'cancelado'" class="flex items-center gap-1.5">
                  <ShieldCheck class="w-3.5 h-3.5" :class="pass.status === 'autorizado' ? 'text-casita-green' : 'text-casita-red'" />
                  <span class="text-[9px] font-bold uppercase tracking-widest" :class="pass.status === 'autorizado' ? 'text-casita-green-dark' : 'text-casita-red-dark'">
                    Resuelto{{ pass.authorized_by ? ' por ' + pass.authorized_by.split(' ')[0] : '' }}
                  </span>
                </div>
                <div v-else></div>
                
                <NuxtLink :to="`/pass/${pass.id}`" class="text-brand-600 flex items-center justify-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-100/50 outline-none text-[9px] font-black uppercase tracking-widest">
                  <span class="leading-none mt-[1px]">Ver detalle</span>
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
import { computed, ref } from 'vue'
import { History, Search, Loader2, AlertTriangle, FileText, ShieldCheck, ArrowRight } from 'lucide-vue-next'
import dayjs from 'dayjs'

const props = defineProps({
  historyData: { type: Object, default: () => null },
  pending: { type: Boolean, default: false },
  error: { type: Object, default: () => null }
})

const searchQuery = ref('')

const getCategoryName = (id) => {
  const map = { 1: 'Llegada tarde', 2: 'Salida anticipada', 3: 'Ausencia justificada', 4: 'Cambio de horario', 5: 'Incapacidad médica' }
  return map[id] || 'Otro'
}

const getCategoryColor = (id) => {
  const map = { 1: 'bg-casita-peach', 2: 'bg-iedis-blue', 3: 'bg-casita-red', 4: 'bg-casita-gold', 5: 'bg-iedis-teal' }
  return map[id] || 'bg-slate-400'
}

const formatDateOnly = (dateStr) => dayjs(dateStr).format('DD MMM')

const groupedHistory = computed(() => {
  if (!props.historyData?.history) return []
  const groups = {}
  props.historyData.history.forEach(p => {
    const month = dayjs(p.date).format('MMM YYYY')
    if (!groups[month]) groups[month] = []
    groups[month].push(p)
  })
  return Object.keys(groups).map(month => ({ month, passes: groups[month] }))
})

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