<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border border-white/20 relative">
      
      <header class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white relative rounded-t-3xl z-10">
        <h3 class="text-base font-black text-slate-900 tracking-tight">Confirmación requerida</h3>
        <button v-if="!setupForm.saving" @click="$emit('cancel')" class="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none">
          <X class="w-4 h-4" />
        </button>
      </header>

      <div class="p-6 md:p-8 bg-white min-h-[200px] flex flex-col justify-center rounded-b-3xl relative z-20">
        <div v-if="setupForm.saving" class="py-6 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          <Loader2 class="w-8 h-8 animate-spin text-brand-600 mb-4" />
          <p class="text-sm font-bold text-slate-500">Guardando contacto...</p>
        </div>

        <div v-else class="animate-in fade-in duration-300">
          <!-- State 1: Select Person -->
          <div v-if="setupForm.internalStep === 'SELECT_PERSON'" class="space-y-4">
            <p class="text-sm font-medium text-slate-600 mb-2 leading-relaxed">
              Para continuar con el pase de <strong class="text-slate-900 font-black">{{ employeeFirstName }}</strong>, selecciona al <strong class="text-slate-900 font-black">{{ coverageData.role }}</strong> de <strong class="text-slate-900 font-black">{{ plantel }}</strong>.
            </p>
            <div class="relative z-50">
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search class="w-4 h-4" /></div>
              <input v-model="setupForm.gwQuery" @input="searchSetupGw" placeholder="Buscar por nombre o correo..." class="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold bg-slate-50 transition-all shadow-sm" />
              
              <div v-if="setupForm.gwResults.length > 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-2xl z-[100] max-h-60 overflow-y-auto custom-scrollbar py-2">
                <button type="button" v-for="res in setupForm.gwResults" :key="res.email" @click="selectSetupGw(res)" class="w-full text-left px-4 py-3 hover:bg-brand-50 border-b border-slate-50 flex items-center gap-3 transition-colors last:border-0 group">
                  <img v-if="res.photoUrl" :src="res.photoUrl" class="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  <div v-else class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex justify-center items-center text-[10px] font-black group-hover:bg-brand-100 group-hover:text-brand-600">{{ res.name.slice(0,2).toUpperCase() }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-black text-slate-800 truncate group-hover:text-brand-900">{{ res.name }}</p>
                    <p class="text-[10px] font-bold text-slate-500 truncate group-hover:text-brand-700">{{ res.email }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- State 2: Enter Phone -->
          <div v-else-if="setupForm.internalStep === 'ENTER_PHONE'" class="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div class="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <img v-if="displayContext.photoUrl" :src="displayContext.photoUrl" class="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm bg-white" />
              <div v-else class="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xs font-black text-slate-500">{{ displayContext.name.slice(0,2).toUpperCase() }}</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-black text-slate-800 truncate">{{ displayContext.name }}</p>
                <p class="text-[10px] font-medium text-slate-500 truncate">{{ displayContext.email }}</p>
              </div>
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-bold text-slate-700">Ahora agrega su número de contacto.</label>
              <div class="flex items-center shadow-sm rounded-xl">
                <div class="bg-slate-50 border border-slate-200 border-r-0 px-4 py-3.5 rounded-l-xl text-slate-500 font-black text-sm">+52 1</div>
                <input v-model="setupForm.phone" @input="onSetupPhoneInput" type="tel" placeholder="10 dígitos" class="flex-1 px-4 py-3.5 rounded-r-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-black bg-white transition-all" />
              </div>
            </div>

            <button @click="saveSetupData" :disabled="setupForm.phone.length !== 10" class="w-full py-3.5 mt-2 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2 outline-none">
              Guardar y Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { X, Search, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  plantel: { type: String, required: true },
  employeeName: { type: String, required: true },
  coverageData: { type: Object, required: true }
})

const emit = defineEmits(['cancel', 'completed'])

const employeeFirstName = computed(() => {
  return props.employeeName.split(' ')[0] || 'el colaborador'
})

const setupForm = reactive({
  gwQuery: '',
  gwResults: [],
  selectedUser: null,
  phone: '',
  saving: false,
  internalStep: 'INIT'
})

let gwTimeout = null

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    setupForm.gwQuery = ''
    setupForm.gwResults = []
    setupForm.selectedUser = null
    setupForm.phone = ''
    setupForm.saving = false
    setupForm.internalStep = props.coverageData.step.includes('MISSING') ? 'SELECT_PERSON' : 'ENTER_PHONE'
  }
}, { immediate: true })

const displayContext = computed(() => {
  if (setupForm.selectedUser) return setupForm.selectedUser
  if (props.coverageData.context) return props.coverageData.context
  return { name: 'Usuario', email: '', photoUrl: null }
})

function onSetupPhoneInput() {
  setupForm.phone = setupForm.phone.replace(/\D/g, '').substring(0, 10)
}

function searchSetupGw() {
  if (gwTimeout) clearTimeout(gwTimeout)
  if (setupForm.gwQuery.length < 2) {
    setupForm.gwResults = []
    return
  }
  gwTimeout = setTimeout(async () => {
    setupForm.gwResults = await $fetch('/api/workspace/search', { params: { q: setupForm.gwQuery } }).catch(() => [])
  }, 300)
}

function selectSetupGw(user) {
  setupForm.selectedUser = user
  setupForm.gwQuery = ''
  setupForm.gwResults = []
  
  let cleanPhone = (user.phone || '').replace(/\D/g, '')
  if (cleanPhone.startsWith('521') && cleanPhone.length >= 13) cleanPhone = cleanPhone.substring(3)
  if (cleanPhone.length > 10) cleanPhone = cleanPhone.substring(cleanPhone.length - 10)
  
  if (cleanPhone.length === 10) {
    setupForm.phone = cleanPhone
    saveSetupData()
  } else {
    setupForm.phone = ''
    setupForm.internalStep = 'ENTER_PHONE'
  }
}

async function saveSetupData() {
  if (setupForm.saving) return
  const step = props.coverageData.step
  const role = props.coverageData.role
  const plantel = props.plantel
  
  if (!plantel || setupForm.phone.length !== 10) return
  
  setupForm.saving = true
  try {
    if (step.includes('MISSING')) {
       if (!setupForm.selectedUser) return
       await $fetch('/api/directory', {
         method: 'POST',
         body: {
            plantel,
            email: setupForm.selectedUser.email,
            role,
            channel: 'EMAIL', // Email remains default mode, phone is kept purely as configuration
            phone: setupForm.phone
         }
       })
    } else {
       const email = props.coverageData.context.email
       const id = props.coverageData.context.id
       await $fetch(`/api/directory/${id}/phone`, {
          method: 'PUT',
          body: { email, phone: setupForm.phone }
       })
    }
    emit('completed')
  } catch(e) {
    alert('Fallo al completar el paso. Por favor, intenta nuevamente.')
    setupForm.saving = false
  }
}
</script>