<template>
  <button 
    type="button"
    @click="$emit('click')"
    class="relative flex items-center p-4 sm:p-5 rounded-[1.5rem] transition-all duration-300 w-full text-left outline-none group border shadow-sm"
    :class="active 
      ? 'bg-white/95 border-[#007F92]/40 shadow-[0_8px_30px_-4px_rgba(0,127,146,0.15)] scale-[1.02] ring-2 ring-[#007F92]/10' 
      : 'bg-white/60 border-white/80 hover:bg-white/90 hover:border-white hover:shadow-md'"
  >
    <div class="w-12 h-12 rounded-[1rem] shrink-0 relative z-10 transition-all duration-300 flex items-center justify-center shadow-sm"
         :class="active ? 'bg-gradient-to-br from-[#007F92] to-[#00497B] text-white border border-[#007F92]/50 shadow-md shadow-[#007F92]/20' : 'bg-white text-[#86888C] group-hover:text-[#007F92] border border-white/80'">
      <component :is="icon" class="w-5 h-5" :class="active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'" />
    </div>
    
    <div class="ml-4 relative z-10 flex-1 pr-1">
      <span class="block text-[15px] tracking-tight transition-colors leading-snug"
            :class="active ? 'text-[#00497B] font-black' : 'text-[#50535A] font-bold group-hover:text-[#00497B]'">
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