<template>
  <div class="bg-white p-5 md:p-6 rounded-xl shadow-card border border-slate-200 flex flex-col gap-5">
    <div class="flex items-center gap-4">
      <div class="relative shrink-0">
        <div v-if="pendingEnrich" class="w-16 h-16 rounded-lg bg-slate-100 animate-pulse"></div>
        <img v-else :src="displayPic" @error="handleImageError" class="w-16 h-16 rounded-lg object-cover bg-slate-50 border border-slate-200" alt="Fotografía del Colaborador" />
      </div>

      <div class="flex-1 min-w-0">
        <h2 class="text-base font-bold text-slate-900 truncate">{{ employee.name }}</h2>
        <div v-if="pendingEnrich" class="mt-1 space-y-1 w-1/2">
          <div class="h-2.5 bg-slate-100 rounded animate-pulse w-full"></div>
          <div class="h-2.5 bg-slate-100 rounded animate-pulse w-2/3"></div>
        </div>
        <div v-else class="mt-0.5">
          <p class="text-slate-500 text-xs truncate">{{ displayRole }} • Plantel {{ displayPlantel }}</p>
          <p v-if="displayEmail" class="text-slate-500 text-xs truncate mt-0.5">{{ displayEmail }}</p>
        </div>
      </div>
    </div>

    <div v-if="hasRecentPassToday" class="bg-amber-50 rounded-lg p-3 flex gap-2 border border-amber-200 items-start">
      <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 leading-snug font-medium">
        Prevención Operativa: Ya existe un registro procesado hoy para este colaborador. Verifique la bitácora antes de proceder.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps({ 
  employee: { type: Object, required: true } 
})

const useFallbackImage = ref(false)
function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f8fafc&color=64748b`
}

function handleImageError(event) {
  useFallbackImage.value = true
  event.target.src = getFallbackAvatar(props.employee.name)
}

const { data: enrichment, pending: pendingEnrich } = useFetch('/api/employees/enrich', {
  query: { id: props.employee.id, name: props.employee.name }
})

const { data: history } = useFetch('/api/passes/recent', { lazy: true })

const displayPic = computed(() => {
  if (useFallbackImage.value || !enrichment.value?.picture) {
    return getFallbackAvatar(props.employee.name)
  }
  return enrichment.value.picture
})

const displayRole = computed(() => enrichment.value?.puesto || 'Puesto no especificado')
const displayEmail = computed(() => enrichment.value?.email)
const displayPlantel = computed(() => enrichment.value?.plantelId || props.employee.plantel)

const hasRecentPassToday = computed(() => {
  if (!history.value) return false
  const today = new Date().toISOString().split('T')[0]
  return history.value.some(p => p.employee_name === props.employee.name && p.date && p.date.startsWith(today))
})
</script>