<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
    <div class="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300 border border-white/50 relative">
      
      <header class="px-8 py-6 border-b border-white/60 flex items-center justify-between bg-white/40 relative rounded-t-[2.5rem] z-10">
        <h3 class="text-lg font-black text-slate-900 tracking-tight">Acción requerida</h3>
        <button v-if="!setupForm.saving" @click="$emit('cancel')" class="text-slate-400 hover:text-slate-700 bg-white shadow-sm hover:shadow-md p-2.5 rounded-full transition-all focus:outline-none border border-slate-100">
          <X class="w-5 h-5" />
        </button>
      </header>

      <div class="p-8 min-h-[250px] flex flex-col justify-center rounded-b-[2.5rem] relative z-20">
        <div v-if="setupForm.saving" class="py-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          <Loader2 class="w-10 h-10 animate-spin text-iedis-teal mb-5" />
          <p class="text-sm font-bold text-slate-500">Guardando contacto...</p>
        </div>

        <div v-else class="animate-in fade-in duration-300">
          <!-- State 1: Select Person -->
          <div v-if="setupForm.internalStep === 'SELECT_PERSON'" class="space-y-5">
            <p class="text-sm font-medium text-slate-600 mb-2 leading-relaxed bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
              Para continuar con el registro de <strong class="text-slate-900 font-black">{{ employeeFirstName }}</strong>, selecciona al <strong class="text-casita-green-dark font-black">{{ coverageData.role }}</strong> de <strong class="text-slate-900 font-black">{{ plantel }}</strong>.
            </p>
            <div class="relative z-50">
              <div class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search class="w-5 h-5" /></div>
              <input v-model="setupForm.gwQuery" @input="searchSetupGw" placeholder="Buscar por nombre o correo..." class="w-full pl-12 pr-5 py-4 rounded-2xl border border-white/80 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold bg-white/70 transition-all shadow-sm" />
              
              <div v-if="setupForm.gwResults.length > 0" class="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-white shadow-2xl rounded-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar p-2">
                <button type="button" v-for="res in setupForm.gwResults" :key="res.email" @click="selectSetupGw(res)" class="w-full text-left px-4 py-3 hover:bg-brand-50 rounded-xl flex items-center gap-4 transition-colors group">
                  <img v-if="res.photoUrl" :src="res.photoUrl" class="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
                  <div v-else class="w-10 h-10 rounded-full bg-slate-100 border border-white shadow-sm flex justify-center items-center font-black text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600">{{ res.name.slice(0,2).toUpperCase() }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-black text-slate-800 truncate group-hover:text-brand-900">{{ res.name }}</p>
                    <p class="text-[10px] font-bold text-slate-500 truncate group-hover:text-brand-700">{{ res.email }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- State 2: Enter Phone -->
          <div v-else-if="setupForm.internalStep === 'ENTER_PHONE'" class="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div class="flex items-center gap-4 p-5 bg-white/80 border border-white rounded-2xl shadow-sm">
              <img v-if="displayContext.photoUrl" :src="displayContext.photoUrl" class="w-12 h-12 rounded-full border border-white object-cover shadow-sm bg-white" />
              <div v-else class="w-12 h-12 rounded-full bg-white border border-white shadow-sm flex items-center justify-center font-black text-slate-400">{{ displayContext.name.slice(0,2).toUpperCase() }}</div>
              <div class="flex-1 min-w-0">
                <p class="text-base font-black text-slate-800 truncate">{{ displayContext.name }}</p>
                <p class="text-[10px] font-bold text-slate-500 truncate mt-0.5">{{ displayContext.email }}</p>
              </div>
            </div>

            <div class="space-y-3">
              <label class="block text-[11px] font-black text-slate-600 uppercase tracking-widest">Ahora agrega su número celular</label>
              <div class="flex items-center shadow-sm rounded-2xl">
                <div class="bg-white/80 border border-white border-r-0 px-5 py-4 rounded-l-2xl text-slate-500 font-black text-sm">+52 1</div>
                <input v-model="setupForm.phone" @input="onSetupPhoneInput" type="tel" placeholder="10 dígitos" class="flex-1 px-5 py-4 rounded-r-2xl border border-white focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-black bg-white/90 transition-all placeholder:text-slate-400 placeholder:font-medium" />
              </div>
            </div>

            <button @click="saveSetupData" :disabled="setupForm.phone.length !== 10" class="w-full py-4 mt-2 bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white font-black text-sm rounded-2xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex justify-center items-center gap-2 outline-none">
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