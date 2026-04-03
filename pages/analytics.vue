<template>
  <div class="p-6 md:p-8 max-w-5xl mx-auto font-sans">
    <header class="mb-8">
      <h1 class="text-2xl font-bold text-slate-900">Inteligencia Operativa</h1>
      <p class="text-slate-500 mt-1 text-sm">Resumen de movimientos e incidencias del día.</p>
    </header>
    
    <MovementDashboard />
  </div>
</template>

<script setup>
import MovementDashboard from '~/components/MovementDashboard.vue'
</script>