<template>
  <button 
    type="button"
    @click="$emit('click')"
    :class="[
      'flex flex-col items-start p-4 rounded-xl border transition-all duration-200 w-full text-left outline-none',
      active 
        ? 'bg-brand-600 border-brand-600 shadow-md ring-2 ring-brand-200 ring-offset-1' 
        : 'bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm hover:bg-brand-50/50'
    ]"
  >
    <div :class="['mb-3 p-2 rounded-lg inline-flex transition-colors', active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600']">
      <component :is="icon" class="w-5 h-5" />
    </div>
    
    <span :class="['font-bold text-sm tracking-tight', active ? 'text-white' : 'text-slate-800']">
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