<template>
  <div class="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="flex items-center justify-between bg-white/60 p-5 rounded-3xl border border-slate-200/60 shadow-sm backdrop-blur-md">
      <div>
        <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">Resumen Global de Hoy</h2>
        <p class="text-xs font-medium text-slate-500 mt-0.5">Basado en datos operativos en tiempo real</p>
      </div>
      <div class="bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-2xl font-black flex items-center gap-2 border border-indigo-100 shadow-[0_4px_15px_-3px_rgba(99,102,241,0.2)]">
        <Activity class="w-5 h-5" />
        {{ data?.totalToday || 0 }} Totales
      </div>
    </div>

    <div v-if="pending" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-10 h-10 animate-spin text-blue-500" />
    </div>

    <div v-else-if="data" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      
      <!-- Categorías -->
      <div class="glass-card p-6 rounded-3xl flex flex-col h-[400px]">
        <h3 class="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
          <PieChart class="w-4 h-4 text-slate-400" /> Distribución por Tipo
        </h3>
        <div v-if="data.byCategory.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400">
          <ShieldAlert class="w-12 h-12 opacity-20 mb-3" />
          <p class="text-sm font-medium">Sin movimientos registrados hoy</p>
        </div>
        <div v-else class="space-y-5 overflow-y-auto pr-2 custom-scrollbar">
          <div v-for="cat in data.byCategory" :key="cat.name" class="relative group">
            <div class="flex justify-between items-end mb-1.5">
              <span class="text-sm font-bold text-slate-700">{{ cat.name }}</span>
              <span class="text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{{ cat.count }}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out group-hover:from-blue-400 group-hover:to-indigo-400" 
                   :style="{ width: `${Math.max((cat.count / data.totalToday) * 100, 2)}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tráfico por Plantel -->
      <div class="glass-card p-6 rounded-3xl flex flex-col h-[400px]">
        <h3 class="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Map class="w-4 h-4 text-slate-400" /> Tráfico por Plantel
        </h3>
        <div v-if="data.byPlantel.length === 0" class="flex-1 flex flex-col items-center justify-center text-slate-400">
          <MapPinOff class="w-12 h-12 opacity-20 mb-3" />
          <p class="text-sm font-medium">Sin datos de planteles hoy</p>
        </div>
        <div v-else class="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          <div v-for="plantel in data.byPlantel" :key="plantel.name" class="flex items-center gap-4 group">
            <div class="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold shadow-sm group-hover:border-indigo-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all shrink-0">
              {{ plantel.name.substring(0, 2).toUpperCase() }}
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1.5">
                <span class="text-sm font-bold text-slate-700">{{ plantel.name || 'Desconocido' }}</span>
                <span class="text-xs font-bold text-slate-500">{{ plantel.count }} pases</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="bg-slate-800 h-2 rounded-full group-hover:bg-indigo-500 transition-all duration-500" 
                     :style="{ width: `${Math.max((plantel.count / maxPlantelCount) * 100, 2)}%` }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Activity, PieChart, Map, ShieldAlert, MapPinOff, Loader2 } from 'lucide-vue-next'

const { data, pending } = useFetch('/api/stats/movements', { lazy: true })

const maxPlantelCount = computed(() => {
  if (!data.value || !data.value.byPlantel.length) return 1
  return Math.max(...data.value.byPlantel.map(p => p.count))
})
</script>