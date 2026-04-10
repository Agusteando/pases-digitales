### components/ScenarioCard.vue
<template>
  <button 
    type="button"
    @click="$emit('click')"
    class="relative flex items-center p-3.5 rounded-[1rem] transition-all duration-300 w-full text-left outline-none group"
    :class="active 
      ? 'bg-brand-50 ring-1 ring-brand-200' 
      : 'bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200'"
  >
    <div class="w-10 h-10 rounded-lg shrink-0 relative z-10 transition-colors flex items-center justify-center"
         :class="active ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'">
      <component :is="icon" class="w-5 h-5" />
    </div>
    
    <div class="ml-3.5 relative z-10 flex-1 min-w-0">
      <span class="block text-sm tracking-tight truncate transition-colors"
            :class="active ? 'text-brand-900 font-semibold' : 'text-slate-700 font-medium group-hover:text-slate-900'">
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