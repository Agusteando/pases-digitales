<template>
  <button 
    type="button"
    @click="$emit('click')"
    class="relative flex items-center p-3 rounded-2xl transition-all duration-300 w-full text-left outline-none group"
    :class="active 
      ? 'bg-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)]' 
      : 'bg-transparent hover:bg-white/60 hover:shadow-sm'"
  >
    <div class="w-10 h-10 rounded-[0.65rem] shrink-0 relative z-10 transition-colors flex items-center justify-center shadow-sm"
         :class="active ? 'bg-[#007F92] text-white' : 'bg-white text-slate-400 group-hover:text-[#007F92]'">
      <component :is="icon" class="w-5 h-5" />
    </div>
    
    <div class="ml-3.5 relative z-10 flex-1 pr-1">
      <span class="block text-sm tracking-tight transition-colors leading-snug"
            :class="active ? 'text-slate-900 font-black' : 'text-slate-600 font-bold group-hover:text-slate-900'">
        {{ title }}
      </span>
    </div>
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