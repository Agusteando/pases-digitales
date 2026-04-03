<template>
  <button 
    type="button"
    @click="$emit('click')"
    :class="[
      'flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 w-full',
      active 
        ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-600 shadow-sm' 
        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50 shadow-sm'
    ]"
  >
    <div 
      :class="[
        'p-2 rounded-lg mb-3',
        active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
      ]"
    >
      <component :is="icon" class="w-5 h-5" />
    </div>
    <span :class="['font-semibold text-sm', active ? 'text-blue-900' : 'text-slate-700']">
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

// Map string names to actual Lucide components
const iconMap = {
  'LogOut': LogOut,
  'LogIn': LogIn,
  'UserX': UserX,
  'Stethoscope': Stethoscope,
  'Clock': Clock
}

const icon = iconMap[props.iconName] || Clock
</script>