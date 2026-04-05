<template>
  <button 
    type="button"
    @click="$emit('click')"
    :class="[
      'flex flex-col items-start p-5 rounded-2xl border-2 transition-all duration-200 w-full text-left outline-none group',
      active 
        ? 'bg-brand-600 border-brand-600 shadow-md shadow-brand-500/20' 
        : 'bg-white border-slate-200 hover:border-brand-400 hover:shadow-sm hover:bg-brand-50/30'
    ]"
  >
    <div :class="['mb-4 p-2.5 rounded-xl inline-flex transition-colors', active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600']">
      <component :is="icon" class="w-6 h-6" />
    </div>
    
    <span :class="['font-black text-sm tracking-tight', active ? 'text-white' : 'text-slate-800']">
      {{ title }}
    </span>
  </button>
</template>

<script setup>
import { LogOut, LogIn, UserX, Stethoscope, Clock } from 'lucide-vue-next'

const props = defineProps({
  title: { type: String, required: true },
  iconName: { type: String, required: true },
  active: { type: Boolean, default: false }
})

defineEmits(['click'])

const iconMap = {
  'LogOut': LogOut,
  'LogIn': LogIn,
  'UserX': UserX,
  'Stethoscope': Stethoscope,
  'Clock': Clock
}

const icon = iconMap[props.iconName] || Clock
</script>