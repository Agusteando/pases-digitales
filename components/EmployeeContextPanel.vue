<template>
  <div class="flex flex-col h-full min-h-0 relative w-full bg-transparent">
    
    <!-- Top Information Header -->
    <div class="flex flex-col relative z-20 shrink-0 mb-5">
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
            <span v-if="horarioEmpleado" class="text-[10px] font-black text-[#00497B] bg-[#00497B]/10 px-2 py-0.5 rounded-md border border-[#00497B]/20 flex items-center gap-1 shadow-sm">
              <Clock class="w-3 h-3 opacity-80" /> {{ horarioEmpleado }}
            </span>
            <span v-if="displayPlantel" class="text-[#86888C] font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-md border border-white shadow-sm">
              <Building2 class="w-3 h-3 opacity-70" /> {{ displayPlantel }}
            </span>
            <span v-if="displayRole" class="text-[#86888C] font-bold text-[10px] uppercase tracking-widest flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-md border border-white shadow-sm">
              <Briefcase class="w-3 h-3 opacity-70" /> {{ displayRole }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Open Pass Warning -->
    <transition name="fade">
      <div v-if="todayPasses.length > 0" class="shrink-0 bg-gradient-to-r from-[#F49A6D]/10 to-transparent p-3 flex items-center justify-between gap-4 border border-[#F49A6D]/20 shadow-sm rounded-2xl relative z-10 mb-4 backdrop-blur-md">
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
      
      <!-- Sticky Header Tabs -->
      <div class="sticky top-0 z-30 pt-2 pb-3 mb-4 bg-white/80 backdrop-blur-xl border-b border-[#86888C]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 sm:px-4 -mx-1 sm:-mx-2 rounded-b-2xl shadow-sm">
        
        <div class="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          <button @click="activeTab = 'pases'" class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all" :class="activeTab === 'pases' ? 'bg-white text-[#007F92] shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Pases
          </button>
          <button @click="activeTab = 'kardex'" class="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5" :class="activeTab === 'kardex' ? 'bg-white text-[#007F92] shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Asistencia <span v-if="filteredKardex.length > 0" class="bg-[#007F92]/10 text-[#007F92] px-1.5 py-0.5 rounded-md text-[8px]">{{ enrichedKardex.length }}</span>
          </button>
        </div>

        <div v-if="activeTab === 'pases'" class="relative group flex-1 max-w-[220px] ml-auto">
           <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <Search class="w-3.5 h-3.5 text-[#86888C] group-focus-within:text-[#007F92] transition-colors" />
           </div>
           <input type="text" v-model="searchQuery" placeholder="Buscar pase..." class="w-full pl-8 pr-3 py-2 bg-white/90 backdrop-blur-md border border-white/80 focus:border-[#007F92] focus:ring-2 focus:ring-[#007F92]/10 rounded-xl text-xs font-bold text-[#50535A] outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
        </div>
      </div>

      <!-- TAB: Pases Digitales -->
      <div v-if="activeTab === 'pases'">
        
        <!-- Pases Statistics Bar -->
        <div v-if="Object.keys(statCounters).length > 0" class="flex flex-wrap gap-2 mb-6">
          <div v-for="(count, cat) in statCounters" :key="cat" class="bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white shadow-sm flex items-center gap-2">
            <span class="text-sm font-black text-[#007F92]">{{ count }}</span>
            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{{ getCategoryName(Number(cat)) }}</span>
          </div>
        </div>

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

      <!-- TAB: Kardex Asistencia Reimagined Engine -->
      <div v-if="activeTab === 'kardex'">
        
        <!-- Syncing State Indicator -->
        <div v-if="isSyncingKardex" class="py-10 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm mb-6">
          <div class="relative mb-4">
             <div class="absolute inset-0 bg-[#007F92]/20 rounded-full animate-ping"></div>
             <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-white shadow-sm relative z-10">
                <RefreshCcw class="w-5 h-5 text-[#007F92] animate-spin" />
             </div>
          </div>
          <p class="text-sm font-black text-[#50535A]">{{ kardexSyncMessage }}</p>
          <p class="text-[10px] font-bold text-[#86888C] uppercase tracking-widest mt-1">Garantizando la información operativa más reciente.</p>
        </div>

        <template v-else>
          <!-- Compact Sleek Horizontal KPI Dashboard -->
          <div v-if="enrichedKardex.length > 0" class="flex bg-white/80 backdrop-blur-xl rounded-[1.25rem] border border-white shadow-sm mb-6 overflow-hidden">
            
            <div class="flex-1 flex items-center gap-3 p-3 transition-colors hover:bg-white/50 border-r border-white/80 min-w-0">
               <div class="flex flex-col min-w-0 flex-1">
                   <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">Retardos</span>
                   <div class="flex items-baseline gap-1.5 truncate">
                      <span class="text-xl font-black leading-none tracking-tight" :class="kardexKpis.unjRetardos > 0 ? 'text-[#F49A6D]' : 'text-[#86888C]/60'">{{ kardexKpis.unjRetardos }}</span>
                      <span class="text-[8px] font-bold text-slate-400 truncate">sin justificar de {{ kardexKpis.rawRetardos }}</span>
                   </div>
               </div>
            </div>

            <div class="flex-1 flex items-center gap-3 p-3 transition-colors hover:bg-white/50 border-r border-white/80 min-w-0">
               <div class="flex flex-col min-w-0 flex-1">
                   <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">Faltas</span>
                   <div class="flex items-baseline gap-1.5 truncate">
                      <span class="text-xl font-black leading-none tracking-tight" :class="kardexKpis.unjFaltas > 0 ? 'text-[#E83F4B]' : 'text-[#86888C]/60'">{{ kardexKpis.unjFaltas }}</span>
                      <span class="text-[8px] font-bold text-slate-400 truncate">sin justificar de {{ kardexKpis.rawFaltas }}</span>
                   </div>
               </div>
            </div>

            <div class="flex-1 flex items-center gap-3 p-3 transition-colors hover:bg-white/50 min-w-0">
               <div class="flex flex-col min-w-0 flex-1">
                   <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">Descuento</span>
                   <div class="flex items-baseline gap-1.5 truncate">
                      <span class="text-xl font-black leading-none tracking-tight" :class="kardexKpis.unjMins > 0 ? 'text-[#50535A]' : 'text-[#86888C]/60'">{{ kardexKpis.strUnjMins }}</span>
                      <span class="text-[8px] font-bold text-slate-400 truncate">sin just. de {{ kardexKpis.strRawMins }}</span>
                   </div>
               </div>
            </div>

          </div>

          <div v-if="pendingKardex" class="py-12 flex justify-center"><Loader2 class="w-8 h-8 animate-spin text-[#007F92]" /></div>
          
          <div v-else-if="!enrichedKardex.length" class="py-12 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-sm">
            <div class="w-12 h-12 mb-3 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#86888C]/10">
              <CalendarDays class="w-5 h-5 text-[#86888C]/40" />
            </div>
            <p class="text-sm font-black text-[#50535A]">Sin registros de asistencia</p>
            <p class="text-[10px] font-bold text-[#86888C] uppercase tracking-widest mt-1">No hay datos sincronizados para mostrar.</p>
          </div>
          
          <div v-else class="relative mt-2">
            <div class="space-y-4 relative z-10">
              <div class="absolute inset-y-0 left-[3rem] sm:left-[4rem] w-px bg-gradient-to-b from-[#86888C]/20 via-[#86888C]/20 to-transparent z-0 ml-[5px]"></div>
              
              <div v-for="(day, index) in enrichedKardex" :key="index" class="group flex items-start w-full relative outline-none" :style="{ animationDelay: `${(index % 10) * 0.05}s` }">
                
                <div class="w-[3rem] sm:w-[4rem] shrink-0 pt-3 text-right pr-4">
                  <div class="text-xl font-black text-[#50535A] leading-none">{{ day.rec.fecha.split('/')[0] }}</div>
                  <div class="text-[9px] font-black text-[#86888C] uppercase tracking-widest mt-1">{{ getMonthName(day.rec.fecha.split('/')[1]) }}</div>
                </div>

                <!-- Main Node Dot -->
                <div class="absolute left-[3rem] sm:left-[4rem] top-[1.1rem] w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10" :class="getKardexColor(day.rec.incidencia).bg"></div>

                <div class="flex-1 pl-4 sm:pl-5 relative z-10">
                  <div class="py-2 transition-all duration-300">
                    
                    <div class="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-shadow flex flex-col group-hover:bg-white/80">
                       
                       <!-- Header: Incident Name -->
                       <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2.5">
                          <h5 class="text-sm font-black text-[#50535A] leading-tight">{{ day.rec.incidencia }}</h5>
                          
                          <div v-if="day.unauthorizedPasses.length > 0" class="shrink-0 bg-[#FCBF2C]/10 border border-[#FCBF2C]/30 text-[#6D5F24] px-2 py-0.5 rounded-md flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest h-fit">
                             <AlertCircle class="w-3 h-3" /> Pases sin autorizar
                          </div>
                       </div>

                       <!-- Aesthetic Compact Punch Cards -->
                       <div class="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 mb-1">
                          
                          <!-- Entrada -->
                          <div class="flex items-center gap-2.5 bg-white/80 backdrop-blur-md pl-1.5 pr-3 py-1.5 rounded-xl border transition-all shadow-sm" 
                               :class="day.missingE ? 'border-[#E83F4B]/30 bg-gradient-to-r from-[#E83F4B]/5 to-transparent ring-1 ring-[#E83F4B]/20' : 'border-slate-200/60'">
                            <div class="flex items-center justify-center w-6 h-6 rounded-lg shrink-0" 
                                 :class="day.missingE ? 'bg-[#E83F4B]/10' : 'bg-[#8EC152]/10'">
                               <ArrowRight class="w-3.5 h-3.5" :class="day.missingE ? 'text-[#E83F4B]' : 'text-[#00692F]'" />
                            </div>
                            <div class="flex items-baseline gap-1.5 leading-none pt-0.5">
                               <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entrada</span>
                               <span class="text-sm font-black font-mono tracking-tight" :class="day.missingE ? 'text-[#E83F4B]' : 'text-slate-700'">{{ extractTime(day.rec.registro_de_entrada) || '--:--' }}</span>
                            </div>
                          </div>

                          <!-- Salida -->
                          <div class="flex items-center gap-2.5 bg-white/80 backdrop-blur-md pl-1.5 pr-3 py-1.5 rounded-xl border transition-all shadow-sm" 
                               :class="day.missingS ? 'border-[#E83F4B]/30 bg-gradient-to-r from-[#E83F4B]/5 to-transparent ring-1 ring-[#E83F4B]/20' : 'border-slate-200/60'">
                            <div class="flex items-center justify-center w-6 h-6 rounded-lg shrink-0" 
                                 :class="day.missingS ? 'bg-[#E83F4B]/10' : 'bg-[#F49A6D]/10'">
                               <ArrowLeft class="w-3.5 h-3.5" :class="day.missingS ? 'text-[#E83F4B]' : 'text-[#D97746]'" />
                            </div>
                            <div class="flex items-baseline gap-1.5 leading-none pt-0.5">
                               <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salida</span>
                               <span class="text-sm font-black font-mono tracking-tight" :class="day.missingS ? 'text-[#E83F4B]' : 'text-slate-700'">{{ extractTime(day.rec.registro_de_salida) || '--:--' }}</span>
                            </div>
                          </div>

                       </div>

                       <!-- Anomalies & Tags -->
                       <div v-if="day.anomalies.length > 0" class="flex flex-wrap gap-2 mt-2">
                          <div v-for="anom in day.anomalies" :key="anom.type" 
                                class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 shadow-sm"
                                :class="anom.isJustified ? 'bg-[#8EC152]/10 text-[#00692F] border-[#8EC152]/30' : 'bg-[#E83F4B]/10 text-[#762728] border-[#E83F4B]/30'">
                             <ShieldCheck v-if="anom.isJustified" class="w-3.5 h-3.5" />
                             <AlertTriangle v-else class="w-3.5 h-3.5" />
                             {{ anom.label }}
                          </div>
                       </div>

                       <!-- Justification Link -->
                       <div v-if="day.authorizedPasses.length > 0" class="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#86888C]/15">
                          <span class="text-[9px] font-black text-[#007F92] uppercase tracking-widest">Justificado por:</span>
                          <div class="flex flex-wrap gap-2">
                            <NuxtLink v-for="p in day.authorizedPasses" :key="p.id" :to="`/pass/${p.id}`" class="text-[10px] font-black text-[#006575] hover:text-[#00497B] flex items-center gap-1.5 bg-[#007F92]/10 hover:bg-[#007F92]/20 px-2.5 py-1 rounded-lg border border-[#007F92]/20 transition-colors shadow-sm outline-none">
                               <ShieldCheck class="w-3 h-3" />
                               #{{ String(p.id).padStart(5,'0') }} • {{ getCategoryName(p.category_id) }}
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
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { FileText, Loader2, Search, ArrowRight, ArrowLeft, AlertTriangle, Building2, Briefcase, CheckCircle2, AlertCircle, Clock, ShieldCheck, CalendarDays, XCircle, RefreshCcw } from 'lucide-vue-next'
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

const extractTime = (str) => {
  if (!str || str.trim() === '' || str.trim() === '--:--') return null;
  const match = str.match(/(\d{2}:\d{2})/);
  return match ? match[1] : str.trim();
}

const timeToMins = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Strictly fetch enrichment based on CURP
const curpVal = computed(() => props.employee.curp || undefined)
const { data: enrichment, pending: pendingEnrich } = useFetch(
  () => props.employee.curp ? '/api/employees/enrich' : null, 
  { query: { curp: curpVal } }
)

const { data: historyData, pending: pendingHistory, error: historyError } = useFetch('/api/passes/employee', {
  query: { name: props.employee.name }
})

// Strictly rely on SOAP ingressioId for Kardex API querying, removing Signia fallback.
const numeroNomina = computed(() => props.employee.ingressioId || props.employee.numero_nomina || null)
const { data: kardexData, pending: pendingKardex, refresh: refreshKardexData } = useFetch(() => numeroNomina.value ? `/api/kardex/${numeroNomina.value}` : null)

const isSyncingKardex = ref(false)
const kardexSyncMessage = ref('')
let kardexSyncedThisSession = false

watch(activeTab, async (newVal) => {
  if (newVal === 'kardex') {
    if (!kardexSyncedThisSession) {
      kardexSyncedThisSession = true;
      isSyncingKardex.value = true;
      kardexSyncMessage.value = 'Verificando servicio...';
      
      try {
        await $fetch('/api/kardex/sync-trigger', { method: 'POST' });
        
        let attempts = 0;
        while (attempts < 15) {
           kardexSyncMessage.value = 'Sincronizando reloj checador...';
           const st = await $fetch('/api/kardex/status').catch(() => null);
           
           const isUpdating = st && (
              st.status === 'updating' || 
              st.actualizando === true || 
              st.is_updating === true || 
              st.estado === 'actualizando' ||
              (st.mensaje && st.mensaje.toLowerCase().includes('actualizando'))
           );
           
           if (!isUpdating) break;
           
           await new Promise(r => setTimeout(r, 2000));
           attempts++;
        }
      } catch (e) {
        console.warn('Kardex sync trigger failed', e);
      } finally {
        kardexSyncMessage.value = 'Cargando datos...';
        await refreshKardexData();
        isSyncingKardex.value = false;
      }
    } else {
      await refreshKardexData();
    }
  }
})

// Picture injection strictly stems from Signia API enrichment response via CURP
const displayPic = computed(() => enrichment.value?.picture || null)

// Puesto strictly stems from Signia API enrichment response
const displayRole = computed(() => enrichment.value?.puesto || null)

// Plantel strictly stems from SOAP
const displayPlantel = computed(() => props.employee.plantelBase || props.employee.plantel || null)

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

const kardexRecords = computed(() => {
  if (!Array.isArray(kardexData.value)) return []
  const targetNom = parseInt(numeroNomina.value, 10)
  
  // CRITICAL: Strictly filter returned dataset locally to prevent API partial match leaks (e.g., API returning 39, 139, 390 for search 39)
  return kardexData.value.filter(r => {
    const ids = [
      r.numero_nomina, 
      r.numero_de_nomina, 
      r.numero_empleado, 
      r.numero_de_empleado, 
      r.nomina, 
      r.id_empleado
    ]
    
    if (!isNaN(targetNom)) {
      return ids.some(id => parseInt(id, 10) === targetNom)
    } else {
      const strTarget = String(numeroNomina.value).trim().toLowerCase()
      return ids.some(id => String(id || '').trim().toLowerCase() === strTarget)
    }
  })
})

const horarioEmpleado = computed(() => {
  if (kardexRecords.value.length > 0) {
    const valid = kardexRecords.value.find(r => r.horario && r.horario.trim() !== '')
    if (valid) return formatHorario(valid.horario)
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

function formatHorasDescontarShort(totalMins) {
  if (totalMins === 0) return '0m';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
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

const isMissing = (val) => !val || val.trim() === '' || val.trim() === '--:--'

const groupedKardexRecords = computed(() => {
  const map = new Map()
  
  filteredKardex.value.forEach(rec => {
    const date = rec.fecha
    if (!map.has(date)) {
      map.set(date, { 
        ...rec, 
        rawMins: parseHorasDescontar(rec.horas_descontar), 
        allIncidencias: rec.incidencia ? [rec.incidencia] : [] 
      })
    } else {
      const existing = map.get(date)
      existing.rawMins += parseHorasDescontar(rec.horas_descontar)
      existing.horas_descontar = formatHorasDescontar(existing.rawMins)
      
      if (rec.incidencia && !existing.allIncidencias.includes(rec.incidencia)) {
        existing.allIncidencias.push(rec.incidencia)
      }
      
      const tIn = extractTime(rec.registro_de_entrada)
      const exIn = extractTime(existing.registro_de_entrada)
      if (tIn && (!exIn || timeToMins(tIn) < timeToMins(exIn))) {
        existing.registro_de_entrada = rec.registro_de_entrada;
      }
      
      const tOut = extractTime(rec.registro_de_salida)
      const exOut = extractTime(existing.registro_de_salida)
      if (tOut && (!exOut || timeToMins(tOut) > timeToMins(exOut))) {
        existing.registro_de_salida = rec.registro_de_salida;
      }
    }
  })
  
  return Array.from(map.values()).map(existing => {
    const nonAsistencia = existing.allIncidencias.filter(i => i.toLowerCase() !== 'asistencia' && i.toLowerCase() !== 'entrada normal')
    existing.incidencia = nonAsistencia.length > 0 ? nonAsistencia.join(' + ') : 'Asistencia'
    return existing
  })
})

// REIMAGINED ATTENDANCE ENGINE: Precise cross-checking of incidents against exact pass scopes, handling grouped daily records.
const enrichedKardex = computed(() => {
  return groupedKardexRecords.value.map(rec => {
    const parts = rec.fecha.split('/')
    const targetDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : null
    
    const passesOnDay = targetDate 
      ? (historyData.value?.history?.filter(p => p.date.startsWith(targetDate) && p.status !== 'cancelado') || []) 
      : []
    
    const authorizedPasses = passesOnDay.filter(p => p.status === 'autorizado')
    const unauthorizedPasses = passesOnDay.filter(p => p.status !== 'autorizado')

    const inc = (rec.incidencia || '').toLowerCase()
    // Identify valid workdays missing punches (excluding non-attendance states)
    const isWorkday = !inc.includes('descanso') && !inc.includes('vacacion') && !inc.includes('festivo') && !inc.includes('incapacidad') && !inc.includes('permiso')
    
    const hasFalta = inc.includes('falta')
    const hasRetardo = inc.includes('retardo')
    const mins = rec.rawMins
    
    const missingE = isWorkday && !hasFalta && isMissing(rec.registro_de_entrada)
    const missingS = isWorkday && !hasFalta && isMissing(rec.registro_de_salida)

    // Strict evaluation rules engine matching pass types to actual real-world incidents.
    // We enforce Number() to avoid type coercion bugs since category_id might be a string from the DB.
    const faltaJustified = hasFalta && authorizedPasses.some(p => [3, 5].includes(Number(p.category_id)))
    const retardoJustified = hasRetardo && authorizedPasses.some(p => [1, 4].includes(Number(p.category_id)))
    const entradaJustified = missingE && authorizedPasses.some(p => [1, 3, 4].includes(Number(p.category_id)))
    const salidaJustified = missingS && authorizedPasses.some(p => [2, 3, 4].includes(Number(p.category_id)))
    const minsJustified = mins > 0 && authorizedPasses.some(p => [1, 2, 3, 4].includes(Number(p.category_id)))

    const anomalies = []
    if (hasFalta) anomalies.push({ type: 'falta', label: 'Falta', isJustified: faltaJustified })
    if (hasRetardo) anomalies.push({ type: 'retardo', label: 'Retardo', isJustified: retardoJustified })
    if (missingE) anomalies.push({ type: 'omision_e', label: 'Omisión de Entrada', isJustified: entradaJustified })
    if (missingS) anomalies.push({ type: 'omision_s', label: 'Omisión de Salida', isJustified: salidaJustified })
    if (mins > 0) anomalies.push({ type: 'mins', label: `A descontar: ${formatHorasDescontarShort(mins)}`, isJustified: minsJustified })

    return {
      rec,
      authorizedPasses,
      unauthorizedPasses,
      hasFalta, hasRetardo, missingE, missingS, mins,
      faltaJustified, retardoJustified, entradaJustified, salidaJustified, minsJustified,
      anomalies
    }
  })
})

const kardexKpis = computed(() => {
  let rawRetardos = 0; let unjRetardos = 0;
  let rawFaltas = 0; let unjFaltas = 0;
  let rawMins = 0; let unjMins = 0;
  
  enrichedKardex.value.forEach(day => {
    if (day.hasRetardo) { rawRetardos++; if (!day.retardoJustified) unjRetardos++; }
    if (day.hasFalta) { rawFaltas++; if (!day.faltaJustified) unjFaltas++; }
    if (day.mins > 0) { rawMins += day.mins; if (!day.minsJustified) unjMins += day.mins; }
  });

  return {
    rawRetardos, unjRetardos,
    rawFaltas, unjFaltas,
    rawMins, unjMins,
    strRawMins: formatHorasDescontarShort(rawMins),
    strUnjMins: formatHorasDescontarShort(unjMins)
  };
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
</script>