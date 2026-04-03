<template>
  <button 
    type="button"
    @click="$emit('click')"
    :class="[
      'flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 w-full text-left relative overflow-hidden group',
      active 
        ? 'bg-blue-600 border-blue-600 shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] ring-2 ring-blue-600 ring-offset-2' 
        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-soft hover:bg-blue-50/50'
    ]"
  >
    <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    
    <div 
      :class="[
        'p-2.5 rounded-xl mb-4 transition-colors relative z-10',
        active ? 'bg-white/20 text-white shadow-inner' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
      ]"
    >
      <component :is="icon" class="w-6 h-6" />
    </div>
    
    <span :class="['font-extrabold text-sm relative z-10 transition-colors', active ? 'text-white' : 'text-slate-800 group-hover:text-blue-900']">
      {{ title }}
    </span>
    
    <!-- Active Indicator Dot -->
    <div v-if="active" class="absolute top-4 right-4 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
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