<template>
  <div class="glass-card p-6 md:p-8 rounded-3xl flex flex-col h-full min-h-[400px]">
    <div class="flex items-center justify-between pb-6 border-b border-slate-100 shrink-0">
      <div>
        <h2 class="text-xl font-black text-slate-900 tracking-tight">Actividad Global</h2>
        <p class="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">Flujo operativo reciente</p>
      </div>
      <button @click="refresh" class="p-2.5 text-slate-400 hover:text-brand-600 bg-slate-50 hover:bg-brand-50 rounded-xl shadow-sm transition-all focus:outline-none border border-slate-200/60">
        <RefreshCcw :class="{'animate-spin': pending}" class="w-4 h-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto mt-6 custom-scrollbar pr-2 relative before:absolute before:inset-0 before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
      <div v-if="pending && !data" class="flex justify-center py-16"><Loader2 class="w-8 h-8 animate-spin text-brand-400" /></div>
      
      <div v-else-if="!data || data.length === 0" class="flex flex-col items-center justify-center py-16 text-slate-400 gap-4">
        <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
          <FileText class="w-8 h-8 text-slate-300" />
        </div>
        <span class="text-sm font-bold text-slate-500">No hay pases recientes emitidos en la red.</span>
      </div>

      <div v-else class="relative pl-14 space-y-5">
        <div v-for="pass in data" :key="pass.id" class="relative group">
          
          <div class="absolute -left-[56px] w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10" :class="getCategoryColor(pass.category_id)">
            <component :is="getCategoryIcon(pass.category_id)" class="w-4 h-4 text-white" />
          </div>

          <div class="bg-white p-4 rounded-2xl border border-slate-200/60 hover:border-brand-300 hover:shadow-md transition-all shadow-sm">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1.5">
                  <NuxtLink :to="`/pass/${pass.id}`" class="font-mono text-sm font-black text-brand-600 hover:text-brand-800 tracking-tight transition-colors">
                    #{{ String(pass.id).padStart(5, '0') }}
                  </NuxtLink>
                  <span class="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md border"
                        :class="{'bg-amber-50 text-amber-700 border-amber-200': pass.status === 'pendiente',
                                 'bg-emerald-50 text-emerald-700 border-emerald-200': pass.status === 'autorizado',
                                 'bg-red-50 text-red-700 border-red-200': pass.status === 'rechazado' || pass.status === 'cancelado'}">
                    {{ pass.status }}
                  </span>
                </div>
                <h4 class="text-sm font-black text-slate-800 truncate">{{ pass.employee_name }}</h4>
              </div>
            </div>
            
            <p class="text-xs font-bold text-slate-500 truncate flex items-center gap-2 mt-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              <span class="text-slate-700">{{ getCategoryName(pass.category_id) }}</span>
              <span v-if="pass.plantel" class="text-slate-300">•</span>
              <span v-if="pass.plantel">{{ pass.plantel }}</span>
              <span class="text-slate-300">•</span>
              <span class="font-medium">Emitido por {{ pass.user }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RefreshCcw, Loader2, FileText, LogIn, LogOut, UserX, Clock, Stethoscope } from 'lucide-vue-next'

const { data, pending, refresh } = useFetch('/api/passes/recent')

const getCategoryIcon = (id) => {
  const map = { 1: LogIn, 2: LogOut, 3: UserX, 4: Clock, 5: Stethoscope }
  return map[id] || Clock
}

const getCategoryColor = (id) => {
  const map = { 1: 'bg-orange-500', 2: 'bg-blue-500', 3: 'bg-rose-500', 4: 'bg-purple-500', 5: 'bg-teal-500' }
  return map[id] || 'bg-slate-400'
}

const getCategoryName = (id) => {
  const map = { 1: 'Llegada Tarde', 2: 'Salida Anticipada', 3: 'Ausencia', 4: 'Cambio de Horario', 5: 'Incapacidad' }
  return map[id] || 'Otro'
}
</script>