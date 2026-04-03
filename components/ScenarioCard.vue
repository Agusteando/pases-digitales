<template>
  <button 
    type="button"
    @click="$emit('click')"
    :class="[
      'flex flex-col items-start p-3 md:p-4 rounded-xl border transition-all w-full text-left',
      active 
        ? 'bg-slate-900 border-slate-900 shadow-sm' 
        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
    ]"
  >
    <div :class="['mb-2', active ? 'text-white' : 'text-slate-500']">
      <component :is="icon" class="w-5 h-5" />
    </div>
    
    <span :class="['font-medium text-sm', active ? 'text-white' : 'text-slate-900']">
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