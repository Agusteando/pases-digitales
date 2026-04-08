<template>
  <button 
    type="button"
    @click="$emit('click')"
    :class="[
      'flex flex-col items-start p-5 rounded-[2rem] border transition-all duration-300 w-full text-left outline-none group relative overflow-hidden',
      active 
        ? 'bg-gradient-to-br from-iedis-teal to-iedis-teal-dark border-transparent shadow-lg shadow-iedis-teal/20' 
        : 'bg-white/60 backdrop-blur-sm border-white hover:border-iedis-teal/30 hover:shadow-md hover:bg-white/90'
    ]"
  >
    <div :class="['mb-4 p-3 rounded-2xl inline-flex transition-colors relative z-10', active ? 'bg-white/20 text-white shadow-inner' : 'bg-slate-50 text-inst-gray group-hover:bg-iedis-teal/10 group-hover:text-iedis-teal-dark']">
      <component :is="icon" class="w-6 h-6" />
    </div>
    
    <span :class="['font-black text-sm tracking-tight relative z-10', active ? 'text-white' : 'text-inst-gray-dark']">
      {{ title }}
    </span>

    <div v-if="active" class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
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