<template>
  <div class="p-6 md:p-10 max-w-6xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10">
    <header class="mb-12">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Métricas Operativas</h1>
      <p class="text-slate-500 mt-2 text-sm font-bold">Visualización y resumen en tiempo real de pases generados en la red institucional.</p>
    </header>
    
    <MovementDashboard />
  </div>
</template>

<script setup>
import MovementDashboard from '~/components/MovementDashboard.vue'
</script>