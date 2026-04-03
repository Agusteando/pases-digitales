<template>
  <div class="p-6 md:p-10 max-w-5xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10">
    <header class="mb-10">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Métricas</h1>
      <p class="text-slate-500 mt-2 text-sm font-medium">Resumen de pases y métricas por plantel de la jornada actual.</p>
    </header>
    
    <MovementDashboard />
  </div>
</template>

<script setup>
import MovementDashboard from '~/components/MovementDashboard.vue'
</script>