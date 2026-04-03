<template>
  <div class="space-y-6">
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold text-slate-900">Métricas Consolidadas</h2>
        <p class="text-sm text-slate-500">Transacciones completadas durante la jornada de hoy</p>
      </div>
      <div class="text-3xl font-black text-slate-900">
        {{ data?.totalToday || 0 }}
      </div>
    </div>

    <div v-if="pending" class="flex justify-center py-10">
      <Loader2 class="w-8 h-8 animate-spin text-slate-300" />
    </div>

    <div v-else-if="data" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-card">
        <h3 class="text-sm font-semibold text-slate-900 mb-4">Clasificación de Incidencias</h3>
        <div class="space-y-4">
          <div v-for="cat in data.byCategory" :key="cat.name">
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-slate-700">{{ cat.name }}</span>
              <span class="font-medium text-slate-900">{{ cat.count }}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div class="bg-slate-400 h-2 rounded-full" :style="{ width: `${Math.max((cat.count / data.totalToday) * 100, 2)}%` }"></div>
            </div>
          </div>
          <div v-if="data.byCategory.length === 0" class="text-sm text-slate-500 py-4 text-center">
            No se han registrado incidencias
          </div>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-card">
        <h3 class="text-sm font-semibold text-slate-900 mb-4">Volumen por Sucursal</h3>
        <div class="space-y-4">
          <div v-for="plantel in data.byPlantel" :key="plantel.name">
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-slate-700">PL {{ plantel.name }}</span>
              <span class="font-medium text-slate-900">{{ plantel.count }}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div class="bg-slate-900 h-2 rounded-full" :style="{ width: `${Math.max((plantel.count / maxPlantelCount) * 100, 2)}%` }"></div>
            </div>
          </div>
          <div v-if="data.byPlantel.length === 0" class="text-sm text-slate-500 py-4 text-center">
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