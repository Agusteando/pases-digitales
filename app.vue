<template>
  <div class="antialiased selection:bg-brand-200 selection:text-brand-900 font-sans text-slate-900 bg-slate-50/40 min-h-[100dvh] relative overflow-x-hidden edu-pattern">
    
    <!-- Seamless background persists across route transitions -->
    <AmbientCanvas />

    <div class="relative z-10">
      <NuxtLoadingIndicator color="#5fb4a9" :height="3" />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </div>
</template>

<script setup>
import AmbientCanvas from '~/components/AmbientCanvas.vue'
</script>