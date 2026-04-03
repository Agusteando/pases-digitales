<template>
  <div class="h-full p-8 overflow-y-auto custom-scrollbar">
    <div class="max-w-6xl mx-auto">
      <header class="mb-8">
        <h1 class="text-3xl font-black text-slate-800 tracking-tight">Inteligencia Operativa</h1>
        <p class="text-slate-500 mt-1.5 font-medium text-sm">Visualización global y tendencias de movimientos por plantel.</p>
      </header>
      
      <MovementDashboard />
    </div>
  </div>
</template>

<script setup>
import MovementDashboard from '~/components/MovementDashboard.vue'
</script>