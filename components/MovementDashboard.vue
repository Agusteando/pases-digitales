<template>
  <div class="space-y-6">
    <div class="glass-card p-8 rounded-3xl flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-black text-slate-900 tracking-tight">Pases Generados Hoy</h2>
        <p class="text-sm font-medium text-slate-500 mt-1">Métricas operativas de la jornada en curso</p>
      </div>
      <div class="text-6xl font-black text-brand-600 font-mono tracking-tighter">
        {{ data?.totalToday || 0 }}
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-20">
      <Loader2 class="w-10 h-10 animate-spin text-brand-600" />
    </div>

    <div v-else-if="data" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart: Categories -->
      <div class="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <h3 class="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest">Tipos de Pase</h3>
        <div class="space-y-6">
          <div v-for="(cat, idx) in data.byCategory" :key="cat.name" class="group">
            <div class="flex justify-between text-sm mb-2.5">
              <span class="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{{ cat.name }}</span>
              <span class="font-black text-slate-900 font-mono">{{ cat.count }}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
              <div class="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
                   :style="{ width: `${Math.max((cat.count / data.totalToday) * 100, 2)}%`, opacity: 1 - (idx * 0.15) }"></div>
            </div>
          </div>
          <div v-if="data.byCategory.length === 0" class="text-sm font-bold text-slate-400 py-10 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            No se han registrado pases
          </div>
        </div>
      </div>

      <!-- Chart: Planteles -->
      <div class="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <h3 class="text-xs font-black text-slate-400 mb-8 uppercase tracking-widest">Distribución por Plantel</h3>
        <div class="space-y-6">
          <div v-for="(plantel, idx) in data.byPlantel" :key="plantel.name" class="group">
            <div class="flex justify-between text-sm mb-2.5">
              <span class="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{{ plantel.name }}</span>
              <span class="font-black text-slate-900 font-mono">{{ plantel.count }}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
              <div class="bg-brand-500 h-full rounded-full transition-all duration-1000 ease-out" 
                   :style="{ width: `${Math.max((plantel.count / maxPlantelCount) * 100, 2)}%`, opacity: 1 - (idx * 0.1) }"></div>
            </div>
          </div>
          <div v-if="data.byPlantel.length === 0" class="text-sm font-bold text-slate-400 py-10 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
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