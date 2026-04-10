<template>
  <div class="flex flex-col">
    <span class="text-2xl font-black text-[#007F92] leading-none tracking-tight">{{ count }}</span>
    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({
  count: { type: [Number, String], required: true },
  label: { type: String, required: true }
})
</script>