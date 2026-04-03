<template>
  <div class="glass-card p-5 md:p-6 rounded-3xl flex items-center gap-4 relative overflow-hidden animate-in slide-in-from-right-4 duration-500">
    <div class="relative shrink-0">
      <div v-if="pendingEnrich" class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-200 animate-pulse z-10 relative"></div>
      <img v-else :src="displayPic" @error="$event.target.src = getFallbackAvatar(employee.name)" class="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover shadow-sm bg-slate-50 z-10 relative" />
      <div v-if="!pendingEnrich && enrichment?.isActive" class="absolute -bottom-1 -right-1 bg-slate-900 text-white p-1 rounded-full border-2 border-white z-20 shadow-sm" title="Activo">
        <CheckCircle2 class="w-3 h-3" />
      </div>
    </div>

    <div class="flex-1 min-w-0 z-10">
      <h2 class="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight truncate">{{ employee.name }}</h2>
      <div v-if="pendingEnrich" class="mt-2 space-y-1.5 w-1/2">
        <div class="h-3 bg-slate-200 rounded animate-pulse"></div>
      </div>
      <div v-else>
        <p class="text-slate-500 font-medium text-xs mt-1 truncate">{{ displayRole }} • Plantel {{ displayPlantel }}</p>
        <div class="mt-2 flex gap-2">
          <span v-if="displayEmail" class="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg truncate">
            {{ displayEmail }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({ employee: { type: Object, required: true } })

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f8fafc&color=475569`
}

// SECURE STAGE 2: Query Signia API safely using the backend
const { data: enrichment, pending: pendingEnrich } = useFetch('/api/employees/enrich', {
  query: { id: props.employee.id, name: props.employee.name }
})

const displayPic = computed(() => enrichment.value?.picture || getFallbackAvatar(props.employee.name))
const displayRole = computed(() => enrichment.value?.puesto || 'Puesto no especificado')
const displayEmail = computed(() => enrichment.value?.email)
const displayPlantel = computed(() => enrichment.value?.plantelId || props.employee.plantel)
</script>