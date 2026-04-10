### components/ScenarioCard.vue
<template>
  <button 
    type="button"
    @click="$emit('click')"
    class="relative flex items-center p-3.5 rounded-[1.25rem] transition-all duration-300 w-full text-left outline-none group border bg-white"
    :class="active 
      ? 'border-transparent ring-2 ring-[#007F92] shadow-md' 
      : 'border-slate-200 hover:border-slate-300 shadow-sm'"
  >
    <div class="w-10 h-10 rounded-xl shrink-0 relative z-10 transition-colors flex items-center justify-center"
         :class="active ? 'bg-[#007F92]/10 text-[#007F92]' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'">
      <component :is="icon" class="w-5 h-5" />
    </div>
    
    <div class="ml-3.5 relative z-10 flex-1 min-w-0">
      <span class="block text-sm tracking-tight truncate transition-colors"
            :class="active ? 'text-slate-900 font-black' : 'text-slate-700 font-bold group-hover:text-slate-900'">
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