<template>
  <div class="flex flex-col h-full min-h-0 relative w-full bg-transparent">
    
    <!-- Top Information Header (No background) -->
    <div class="flex flex-col relative z-20 shrink-0 mb-6">
      <div class="flex items-center gap-4">
        <PremiumAvatar :src="displayPic" :name="employee.name" size="md" class="shrink-0 shadow-sm border border-white" />
        
        <div class="flex flex-col min-w-0 flex-1">
          <h2 class="text-xl sm:text-2xl font-black text-[#50535A] tracking-tight truncate" :title="employee.name">
            {{ employee.name }}
          </h2>
          
          <div v-if="pendingEnrich" class="mt-2 space-y-1.5 w-32">
            <div class="h-1.5 bg-[#86888C]/10 rounded animate-pulse w-full"></div>
            <div class="h-1.5 bg-[#86888C]/10 rounded animate-pulse w-2/3"></div>
          </div>
          
          <div v-else class="mt-1 flex flex-wrap gap-2 items-center">
            <span v-if="horarioEmpleado" class="text-[10px] font-black text-[#00497B] bg-[#00497B]/10 px-2 py-0.5 rounded-md border border-[#00497B]/20 flex items-center gap-1">
              <Clock class="w-3 h-3 opacity-80" /> {{ horarioEmpleado }}
            </span>
            <span v-if="displayPlantel" class="text-[#86888C] font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-md border border-white shadow-sm">
              <Building2 class="w-3 h-3 opacity-70" /> {{ displayPlantel }}
            </span>
            <span v-if="displayPlantel && displayRole" class="text-[#86888C]/30 hidden sm:inline">•</span>
            <span v-if="displayRole" class="text-[#86888C] font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-md border border-white shadow-sm">
              <Briefcase class="w-3 h-3 opacity-70" /> {{ displayRole }}
            </span>
          </div>
        </div>
      </div>

      <!-- KPI Summary -->
      <div class="flex flex-col mt-5 pt-4 border-t border-[#86888C]/15 relative gap-3">
        
        <div class="flex flex-wrap gap-x-6 gap-y-3">
          <div v-if="Object.keys(statCounters).length === 0" class="text-[10px] font-bold uppercase tracking-widest text-[#86888C] flex items-center gap-1.5">
            <CheckCircle2 class="w-3.5 h-3.5 text-[#8EC152]" /> Sin pases registrados.
          </div>
          <template v-else>
            <div v-for="(count, cat) in statCounters" :key="cat" class="flex items-center gap-1.5">
              <span class="text-base font-black text-[#007F92] leading-none">{{ count }}</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{{ getCategoryName(Number(cat)) }}</span>
            </div>
          </template>
        </div>

        <!-- Kardex KPIs (Only display if available) -->
        <div v-if="kardexRecords.length > 0" class="flex flex-wrap gap-x-6 gap-y-3 pt-3 border-t border-[#86888C]/10 border-dashed">
          <div class="flex items-center gap-1.5" title="Retardos en Asistencia">
            <span class="text-base font-black text-[#F49A6D] leading-none">{{ kardexKpis.retardos }}</span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Retardos</span>
          </div>
          <div class="flex items-center gap-1.5" title="Faltas en Asistencia">
            <span class="text-base font-black text-[#E83F4B] leading-none">{{ kardexKpis.faltas }}</span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Faltas</span>
          </div>
          <div class="flex items-center gap-1.5" title="Total Horas a Descontar">
            <span class="text-base font-black text-[#50535A] leading-none">{{ kardexKpis.strDescontar }}</span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">A Descontar</span>
          </div>
        </div>

      </div>
    </div>

    <!-- Active Open Pass Warning -->
    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="shrink-0 bg-gradient-to-r from-[#F49A6D]/10 to-transparent p-3 sm:p-4 flex items-center justify-between gap-4 border border-[#F49A6D]/20 shadow-sm rounded-2xl relative z-10 mb-4 backdrop-blur-md">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#F49A6D]/20">
            <AlertCircle class="w-4 h-4 text-[#F49A6D]" />
          </div>
          <div class="min-w-0">
            <h4 class="text-sm font-black text-[#50535A] truncate">Incidencia en curso</h4>
            <p class="text-[9px] font-bold text-[#86888C] uppercase tracking-widest truncate">Existe una solicitud abierta hoy.</p>
          </div>
        </div>
        <NuxtLink :to="`/pass/${todayPasses[0].id}`" class="shrink-0 px-4 py-2 bg-white text-[#50535A] hover:text-[#007F92] border border-white shadow-sm hover:shadow-md rounded-xl text-[10px] font-black uppercase tracking-widest transition-all outline-none">
          Revisar
        </NuxtLink>
      </div>
    </transition>

    <!-- Flowing Timeline Panel -->
    <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 sm:px-2 pb-6 relative z-10">
      
      <!-- Sticky Header -->
      <div class="sticky top-0 z-30 pt-3 pb-3 mb-5 bg-white/80 backdrop-blur-xl border-b border-[#86888C]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 sm:px-4 -mx-1 sm:-mx-2 rounded-b-2xl shadow-sm">
        
        <div class="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          <button @click="activeTab = 'pases'" class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all" :class="activeTab === 'pases' ? 'bg-white text-[#007F92] shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Pases
          </button>
          <button @click="activeTab = 'kardex'" class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5" :class="activeTab === 'kardex' ? 'bg-white text-[#007F92] shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Asistencia <span v-if="kardexRecords.length > 0" class="bg-[#007F92]/10 text-[#007F92] px-1.5 py-0.5 rounded-md text-[8px]">{{ kardexRecords.length }}</span>
          </button>
        </div>

        <div v-if="activeTab === 'pases'" class="relative group flex-1 max-w-[220px] ml-auto">
           <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search class="w-3.5 h-3.5 text-[#86888C] group-focus-within:text-[#007F92] transition-colors" />
           </div>
           <input type="text" v-model="searchQuery" placeholder="Buscar pase..." class="w-full pl-8 pr-3 py-2 bg-white/90 backdrop-blur-md border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/10 rounded-xl text-xs font-bold text-[#50535A] outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
        </div>
      </div>

      <!-- Content: Pases Digitales -->
      <div v-if="activeTab === 'pases'">
        <div v-if="pendingHistory" class="py-12 flex justify-center"><Loader2 class="w-8 h-8 animate-spin text-[#007F92]" /></div>
        
        <div v-else-if="historyError" class="py-12 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
          <div class="w-12 h-12 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#E83F4B]/20">
            <AlertTriangle class="w-5 h-5 text-[#E83F4B]" />
          </div>
          <p class="text-sm font-black text-[#50535A]">Error de conexión</p>
        </div>

        <div v-else-if="!filteredGroupedHistory.length" class="py-12 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
          <div class="w-12 h-12 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#86888C]/10">
            <FileText class="w-5 h-5 text-[#86888C]/40" />
          </div>
          <p class="text-sm font-black text-[#50535A]">Sin incidencias</p>
          <p class="text-[10px] font-bold text-[#86888C] uppercase tracking-widest mt-1">El colaborador no tiene registros.</p>
        </div>

        <div v-else class="relative mt-2">
          <div v-for="group in filteredGroupedHistory" :key="group.month" class="mb-10 relative">
            
            <div class="flex items-center mb-6 pl-[3rem] sm:pl-[4rem]">
               <span class="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-[#86888C] uppercase tracking-widest shadow-sm border border-white">
                 {{ group.month }}
               </span>
            </div>
            
            <div class="relative w-full">
              <div class="absolute inset-y-0 left-[3rem] sm:left-[4rem] w-px bg-gradient-to-b from-[#86888C]/20 via-[#86888C]/20 to-transparent z-0 ml-[5px]"></div>

              <div class="space-y-6 relative z-10">
                <NuxtLink v-for="(pass, index) in group.passes" :key="pass.id" :to="`/pass/${pass.id}`" class="group flex items-start w-full relative outline-none cursor-pointer" :style="{ animationDelay: `${index * 0.05}s` }">
                  
                  <div class="w-[3rem] sm:w-[4rem] shrink-0 pt-3 text-right pr-4 transition-transform group-hover:-translate-x-1 duration-300">
                    <div class="text-xl font-black text-[#50535A] leading-none">{{ formatDay(pass.date) }}</div>
                    <div class="text-[9px] font-black text-[#86888C] uppercase tracking-widest mt-1">{{ formatMonth(pass.date) }}</div>
                  </div>

                  <div class="absolute left-[3rem] sm:left-[4rem] top-[1.1rem] w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 transition-transform duration-300 group-hover:scale-[1.3] group-hover:shadow-md" :class="getCategoryConfig(pass.category_id).bg"></div>

                  <div class="flex-1 pl-4 sm:pl-5 relative z-10">
                    <div class="py-2 transition-all duration-300 group-hover:-translate-y-0.5">
                      
                      <!-- Header -->
                      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                        <div>
                          <h5 class="text-sm font-black text-[#50535A] group-hover:text-[#007F92] transition-colors duration-300 leading-tight">
                            {{ getCategoryName(pass.category_id) }}
                          </h5>
                          <p v-if="pass.tipo_permiso" class="text-[10px] font-bold text-[#86888C] mt-1">{{ pass.tipo_permiso }}</p>
                        </div>
                        
                        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm shrink-0" :class="getStatusConfig(pass.status).badge">
                          <div class="w-1.5 h-1.5 rounded-full" :class="getStatusConfig(pass.status).dot"></div>
                          <span class="text-[8px] font-black uppercase tracking-widest">{{ pass.status }}</span>
                        </div>
                      </div>

                      <div v-if="pass.comentarios" class="relative pl-3 border-l-2 py-0.5 my-3 transition-all duration-300 bg-white/40 rounded-r-lg p-2.5 border-white shadow-sm" :class="getCategoryConfig(pass.category_id).border">
                        <p class="text-xs text-[#50535A] italic leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                          "{{ pass.comentarios }}"
                        </p>
                      </div>
                      
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 pt-3 border-t border-[#86888C]/10 text-[9px] font-black uppercase tracking-widest text-[#86888C]">
                        <span class="group-hover:text-[#50535A] transition-colors bg-[#86888C]/5 px-2 py-1 rounded-md">ID: {{ String(pass.id).padStart(5, '0') }}</span>
                        <span v-if="pass.authorized_by" class="flex items-center gap-1 group-hover:text-[#50535A] transition-colors">
                          <span class="w-1 h-1 rounded-full bg-[#86888C]/40"></span>
                          {{ pass.authorized_by.split(' ')[0] || 'Responsable' }}
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

      <!-- Content: Kardex Asistencia -->
      <div v-if="activeTab === 'kardex'">
        <div v-if="pendingKardex" class="py-12 flex justify-center"><Loader2 class="w-8 h-8 animate-spin text-[#007F92]" /></div>
        <div v-else-if="!filteredKardex.length" class="py-12 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
          <div class="w-12 h-12 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#86888C]/10">
            <CalendarDays class="w-5 h-5 text-[#86888C]/40" />
          </div>
          <p class="text-sm font-black text-[#50535A]">Sin registros de asistencia</p>
          <p class="text-[10px] font-bold text-[#86888C] uppercase tracking-widest mt-1">No hay datos sincronizados para mostrar.</p>
        </div>
        <div v-else class="relative mt-2">
          <div class="space-y-4 relative z-10">
            <div class="absolute inset-y-0 left-[3rem] sm:left-[4rem] w-px bg-gradient-to-b from-[#86888C]/20 via-[#86888C]/20 to-transparent z-0 ml-[5px]"></div>
            
            <div v-for="(rec, index) in filteredKardex" :key="index" class="group flex items-start w-full relative outline-none" :style="{ animationDelay: `${(index % 10) * 0.05}s` }">
              
              <div class="w-[3rem] sm:w-[4rem] shrink-0 pt-3 text-right pr-4">
                <div class="text-xl font-black text-[#50535A] leading-none">{{ rec.fecha.split('/')[0] }}</div>
                <div class="text-[9px] font-black text-[#86888C] uppercase tracking-widest mt-1">{{ getMonthName(rec.fecha.split('/')[1]) }}</div>
              </div>

              <div class="absolute left-[3rem] sm:left-[4rem] top-[1.1rem] w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10" :class="getKardexColor(rec.incidencia).bg"></div>

              <div class="flex-1 pl-4 sm:pl-5 relative z-10">
                <div class="py-2 transition-all duration-300">
                  <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div>
                      <h5 class="text-sm font-black text-[#50535A] leading-tight flex items-center gap-2">
                        {{ rec.incidencia }}
                      </h5>
                      <p v-if="rec.registro_de_entrada || rec.registro_de_salida" class="text-[10px] font-bold text-[#86888C] mt-1">
                        E: {{ rec.registro_de_entrada || '--:--' }} | S: {{ rec.registro_de_salida || '--:--' }}
                      </p>
                    </div>
                    
                    <div v-if="getPaseForKardexDate(rec.fecha)" class="flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm shrink-0 bg-[#007F92]/10 border-[#007F92]/30">
                      <ShieldCheck class="w-3.5 h-3.5 text-[#007F92]" />
                      <span class="text-[8px] font-black uppercase tracking-widest text-[#006575]">Pase Emitido</span>
                    </div>
                  </div>
                  
                  <div v-if="parseHorasDescontar(rec.horas_descontar) > 0" class="mt-2 inline-flex items-center gap-1 text-[9px] font-black text-[#E83F4B] bg-[#E83F4B]/10 px-2 py-1 rounded border border-[#E83F4B]/20 uppercase tracking-widest">
                    <AlertTriangle class="w-3 h-3" /> A descontar: {{ rec.horas_descontar }}
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
import { FileText, Loader2, Search, ArrowRight, AlertTriangle, Building2, Briefcase, CheckCircle2, AlertCircle, Clock, ShieldCheck, CalendarDays } from 'lucide-vue-next'
import PremiumAvatar from '~/components/PremiumAvatar.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const props = defineProps({ 
  employee: { type: Object, required: true } 
})

const activeTab = ref('pases')

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
  if (s === 'autorizado') return { badge: 'border-[#8EC152]/40 bg-[#8EC152]/20 text-[#00692F]', dot: 'bg-[#8EC152]' }
  if (s === 'rechazado') return { badge: 'border-[#E83F4B]/40 bg-[#E83F4B]/20 text-[#762728]', dot: 'bg-[#E83F4B]' }
  if (s === 'pendiente') return { badge: 'border-[#FCBF2C]/40 bg-[#FCBF2C]/25 text-[#6D5F24]', dot: 'bg-[#FCBF2C]' }
  return { badge: 'border-[#86888C]/20 bg-white/50 text-[#50535A]', dot: 'bg-[#86888C]' }
}

const formatDay = (dateStr) => dayjs(dateStr).format('DD')
const formatMonth = (dateStr) => dayjs(dateStr).format('MMM').replace('.', '')

const formatHorario = (h) => {
  if (!h) return ''
  return h.replace(/(\d{2})(\d{2})\s+a\s+(\d{2})(\d{2})/gi, '$1:$2 a $3:$4')
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

const numeroNomina = computed(() => enrichment.value?.numero_nomina || props.employee.numero_nomina || null)
const { data: kardexData, pending: pendingKardex } = useFetch(() => numeroNomina.value ? `/api/kardex/${numeroNomina.value}` : null)

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

const kardexRecords = computed(() => Array.isArray(kardexData.value) ? kardexData.value : [])

const horarioEmpleado = computed(() => {
  if (kardexRecords.value.length > 0 && kardexRecords.value[0].horario) {
    return formatHorario(kardexRecords.value[0].horario)
  }
  return null
})

function parseHorasDescontar(str) {
  if (!str) return 0;
  const match = str.match(/(?:(\d+)\s*Hrs?)?\s*(?:(\d+)\s*Min)?/i);
  let mins = 0;
  if (match) {
    if (match[1]) mins += parseInt(match[1]) * 60;
    if (match[2]) mins += parseInt(match[2]);
  }
  return mins;
}

function formatHorasDescontar(totalMins) {
  if (totalMins === 0) return '0 Hrs 0 Min';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h} Hrs ${m} Min`;
}

const kardexKpis = computed(() => {
  let retardos = 0;
  let faltas = 0;
  let minDescontar = 0;
  
  kardexRecords.value.forEach(r => {
    const inc = (r.incidencia || '').toLowerCase()
    if (inc.includes('retardo')) retardos++;
    if (inc.includes('falta')) faltas++;
    if (r.horas_descontar) minDescontar += parseHorasDescontar(r.horas_descontar);
  });
  
  return {
    retardos,
    faltas,
    minDescontar,
    strDescontar: formatHorasDescontar(minDescontar)
  }
})

const getMonthName = (mStr) => {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const idx = parseInt(mStr, 10) - 1
  return months[idx] || mStr
}

const getKardexColor = (incidencia) => {
  const inc = (incidencia || '').toLowerCase()
  if (inc.includes('falta')) return { bg: 'bg-[#E83F4B]' }
  if (inc.includes('retardo')) return { bg: 'bg-[#F49A6D]' }
  if (inc.includes('asistencia')) return { bg: 'bg-[#8EC152]' }
  if (inc.includes('descanso')) return { bg: 'bg-[#86888C]' }
  if (inc.includes('vacaciones') || inc.includes('justificaci')) return { bg: 'bg-[#007F92]' }
  return { bg: 'bg-[#FCBF2C]' }
}

const filteredKardex = computed(() => {
  return [...kardexRecords.value].sort((a,b) => {
    const [d1,m1,y1] = a.fecha.split('/')
    const [d2,m2,y2] = b.fecha.split('/')
    const date1 = new Date(y1, m1-1, d1)
    const date2 = new Date(y2, m2-1, d2)
    return date2 - date1
  })
})

const getPaseForKardexDate = (fechaDDMMYYYY) => {
  if (!fechaDDMMYYYY) return null
  const parts = fechaDDMMYYYY.split('/')
  if (parts.length !== 3) return null
  const targetDate = `${parts[2]}-${parts[1]}-${parts[0]}`
  return historyData.value?.history?.find(p => p.date.startsWith(targetDate) && p.status !== 'cancelado' && p.status !== 'rechazado')
}
</script>