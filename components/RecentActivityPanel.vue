<template>
  <div class="glass-panel p-8 md:p-10 rounded-[2.5rem] flex flex-col h-full min-h-[400px]">
    <div class="flex items-center justify-between pb-6 border-b border-white/60 shrink-0">
      <div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">Actividad reciente</h2>
        <p class="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-wider">Últimos pases registrados</p>
      </div>
      <button @click="refresh" class="p-3 text-slate-400 hover:text-iedis-teal-dark bg-white hover:bg-white/80 rounded-[1rem] shadow-sm transition-all focus:outline-none border border-white/80 hover:shadow-md">
        <RefreshCcw :class="{'animate-spin': pending}" class="w-5 h-5" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto mt-6 custom-scrollbar pr-2 relative before:absolute before:inset-0 before:left-[23px] before:top-2 before:bottom-2 before:w-[3px] before:bg-[linear-gradient(to_bottom,rgba(97,139,47,0.5),rgba(0,127,146,0.5),rgba(97,139,47,0.5))] before:animate-timeline-flow before:rounded-full">
      <div v-if="pending && !data" class="flex justify-center py-16"><Loader2 class="w-10 h-10 animate-spin text-iedis-teal" /></div>
      
      <div v-else-if="!data || data.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400 gap-5">
        <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center border border-white shadow-sm">
          <FileText class="w-10 h-10 text-slate-300" />
        </div>
        <span class="text-sm font-bold text-slate-500">No hay pases recientes.</span>
      </div>

      <div v-else class="relative pl-[60px] space-y-6">
        <div v-for="(pass, index) in data" :key="pass.id" class="relative group timeline-item" :style="{ animationDelay: `${index * 0.05}s` }">
          
          <div class="absolute -left-[60px] w-12 h-12 rounded-[1.25rem] border border-white bg-white flex items-center justify-center shadow-sm z-10" :class="getCategoryColorText(pass.category_id)">
            <component :is="getCategoryIcon(pass.category_id)" class="w-5 h-5" />
          </div>

          <div class="bg-white/70 backdrop-blur-sm p-5 rounded-[1.5rem] border border-white hover:border-iedis-teal/30 hover:shadow-md transition-all shadow-sm hover:bg-white">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-mono text-sm font-black text-brand-600 tracking-tight">
                    #{{ String(pass.id).padStart(5, '0') }}
                  </span>
                  <span class="text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md border shadow-sm"
                        :class="{'bg-casita-gold/10 text-casita-gold-dark border-casita-gold/30': pass.status === 'pendiente',
                                 'bg-casita-green/10 text-casita-green border-casita-green/30': pass.status === 'autorizado',
                                 'bg-casita-red/10 text-casita-red border-casita-red/30': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                    {{ pass.status }}
                  </span>
                </div>
                <h4 class="text-base font-black text-slate-800 truncate">{{ pass.employee_name }}</h4>
              </div>
            </div>
            
            <p class="text-xs font-bold text-slate-500 truncate flex flex-wrap items-center gap-2 mt-2 bg-white/60 px-3 py-2 rounded-xl border border-white shadow-sm">
              <span class="text-slate-700">{{ getCategoryName(pass.category_id) }}</span>
              <span v-if="pass.plantel" class="text-slate-300">•</span>
              <span v-if="pass.plantel">{{ pass.plantel }}</span>
              <span class="text-slate-300">•</span>
              <span class="font-medium text-slate-400">Emitido por {{ pass.user }}</span>
            </p>

            <div class="mt-4 pt-4 border-t border-white/60 flex justify-end">
               <NuxtLink :to="`/pass/${pass.id}`" class="inline-flex items-center gap-1.5 text-xs font-black text-iedis-teal hover:text-iedis-teal-dark bg-white hover:bg-iedis-teal/10 px-4 py-2.5 rounded-xl border border-white hover:border-iedis-teal/20 transition-colors shadow-sm outline-none">
                 <span>Abrir detalle del pase</span>
                 <ArrowRight class="w-4 h-4" />
               </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RefreshCcw, Loader2, FileText, LogIn, LogOut, UserX, Clock, Stethoscope, ArrowRight } from 'lucide-vue-next'

const { data, pending, refresh } = useFetch('/api/passes/recent')

const getCategoryIcon = (id) => {
  const map = { 1: LogIn, 2: LogOut, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || Clock
}

const getCategoryColorText = (id) => {
  const map = { 1: 'text-casita-peach', 2: 'text-iedis-blue', 3: 'text-casita-red', 4: 'text-casita-gold', 5: 'text-iedis-teal' }
  return map[id] || 'text-slate-400'
}

const getCategoryName = (id) => {
  const map = { 1: 'Llegada tarde', 2: 'Salida anticipada', 3: 'Ausencia justificada', 4: 'Cambio de horario', 5: 'Incapacidad médica' }
  return map[id] || 'Otro'
}
</script>