<template>
  <div class="space-y-6">
    <div class="glass-panel p-8 md:p-10 rounded-[2.5rem] flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-black text-slate-900 tracking-tight">Pases generados</h2>
        <p class="text-sm font-medium text-slate-500 mt-1.5">Resumen de incidencias de la jornada actual</p>
      </div>
      <div class="text-7xl font-black text-iedis-teal-dark font-mono tracking-tighter">
        {{ data?.totalToday || 0 }}
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-20">
      <Loader2 class="w-12 h-12 animate-spin text-iedis-teal" />
    </div>

    <div v-else-if="data" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart: Categories -->
      <div class="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow border border-white">
        <h3 class="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest">Motivos</h3>
        <div class="space-y-6">
          <div v-for="(cat, idx) in data.byCategory" :key="cat.name" class="group">
            <div class="flex justify-between text-sm mb-2.5">
              <span class="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{{ cat.name }}</span>
              <span class="font-black text-slate-900 font-mono">{{ cat.count }}</span>
            </div>
            <div class="w-full bg-white/60 rounded-full h-3 overflow-hidden border border-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
              <div class="bg-gradient-to-r from-casita-green to-casita-green-light h-full rounded-full transition-all duration-1000 ease-out" 
                   :style="{ width: `${Math.max((cat.count / data.totalToday) * 100, 2)}%`, opacity: 1 - (idx * 0.15) }"></div>
            </div>
          </div>
          <div v-if="data.byCategory.length === 0" class="text-sm font-bold text-slate-400 py-10 text-center bg-white/40 rounded-2xl border border-white border-dashed">
            No se han registrado pases
          </div>
        </div>
      </div>

      <!-- Chart: Planteles -->
      <div class="glass-panel p-8 md:p-10 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow border border-white">
        <h3 class="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest">Distribución por Plantel</h3>
        <div class="space-y-6">
          <div v-for="(plantel, idx) in data.byPlantel" :key="plantel.name" class="group">
            <div class="flex justify-between text-sm mb-2.5">
              <span class="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{{ plantel.name }}</span>
              <span class="font-black text-slate-900 font-mono">{{ plantel.count }}</span>
            </div>
            <div class="w-full bg-white/60 rounded-full h-3 overflow-hidden border border-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
              <div class="bg-gradient-to-r from-iedis-teal to-iedis-blue h-full rounded-full transition-all duration-1000 ease-out" 
                   :style="{ width: `${Math.max((plantel.count / maxPlantelCount) * 100, 2)}%`, opacity: 1 - (idx * 0.1) }"></div>
            </div>
          </div>
          <div v-if="data.byPlantel.length === 0" class="text-sm font-bold text-slate-400 py-10 text-center bg-white/40 rounded-2xl border border-white border-dashed">
            Información no disponible
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const { data, pending } = useFetch('/api/stats/movements', { lazy: true })

const maxPlantelCount = computed(() => {
  if (!data.value || !data.value.byPlantel.length) return 1
  return Math.max(...data.value.byPlantel.map(p => p.count))
})
</script>