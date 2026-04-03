<template>
  <div class="space-y-6">
    <div class="glass-card p-6 rounded-2xl flex items-center justify-between">
      <div>
        <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">Pases Generados Hoy</h2>
        <p class="text-sm font-medium text-slate-500 mt-1">Total de pases autorizados en la jornada</p>
      </div>
      <div class="text-5xl font-black text-brand-600 font-mono tracking-tighter">
        {{ data?.totalToday || 0 }}
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-16">
      <Loader2 class="w-8 h-8 animate-spin text-slate-300" />
    </div>

    <div v-else-if="data" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart: Categories -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 class="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Tipos de Pase</h3>
        <div class="space-y-5">
          <div v-for="(cat, idx) in data.byCategory" :key="cat.name" class="group">
            <div class="flex justify-between text-sm mb-2">
              <span class="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{{ cat.name }}</span>
              <span class="font-bold text-slate-900 font-mono">{{ cat.count }}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div class="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
                   :style="{ width: `${Math.max((cat.count / data.totalToday) * 100, 2)}%`, opacity: 1 - (idx * 0.15) }"></div>
            </div>
          </div>
          <div v-if="data.byCategory.length === 0" class="text-sm font-medium text-slate-400 py-6 text-center bg-slate-50 rounded-xl">
            No se han registrado pases
          </div>
        </div>
      </div>

      <!-- Chart: Planteles -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 class="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Pases por Plantel</h3>
        <div class="space-y-5">
          <div v-for="(plantel, idx) in data.byPlantel" :key="plantel.name" class="group">
            <div class="flex justify-between text-sm mb-2">
              <span class="font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">PL {{ plantel.name }}</span>
              <span class="font-bold text-slate-900 font-mono">{{ plantel.count }}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div class="bg-brand-600 h-full rounded-full transition-all duration-1000 ease-out" 
                   :style="{ width: `${Math.max((plantel.count / maxPlantelCount) * 100, 2)}%`, opacity: 1 - (idx * 0.1) }"></div>
            </div>
          </div>
          <div v-if="data.byPlantel.length === 0" class="text-sm font-medium text-slate-400 py-6 text-center bg-slate-50 rounded-xl">
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