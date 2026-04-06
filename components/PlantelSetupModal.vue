<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
      
      <header class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
            <Settings2 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-black text-slate-900 tracking-tight">Directorio del Plantel</h3>
            <p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Requisito Operativo Único</p>
          </div>
        </div>
        <button @click="$emit('cancel')" class="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none">
          <X class="w-5 h-5" />
        </button>
      </header>

      <div class="p-8 bg-slate-50/50">
        <p class="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
          Para habilitar las operaciones en <strong class="text-indigo-600 font-black">{{ plantel || 'este plantel' }}</strong>, necesitamos completar un dato de contacto faltante.
        </p>

        <!-- State: Missing Person -->
        <div v-if="coverageData.step.includes('MISSING')" class="space-y-5">
          <div class="space-y-3 relative z-20">
            <label class="block text-[10px] font-black text-indigo-500 uppercase tracking-widest">Seleccionar {{ coverageData.role }}</label>
            
            <!-- Selected state -->
            <div v-if="setupForm.selectedUser" class="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm">
              <img v-if="setupForm.selectedUser.photoUrl" :src="setupForm.selectedUser.photoUrl" class="w-8 h-8 rounded-full border border-slate-200 object-cover" />
              <div v-else class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">{{ setupForm.selectedUser.name.slice(0,2).toUpperCase() }}</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-black text-slate-800 truncate">{{ setupForm.selectedUser.name }}</p>
                <p class="text-[10px] font-bold text-slate-500 truncate">{{ setupForm.selectedUser.email }}</p>
              </div>
              <button @click="setupForm.selectedUser = null" class="text-slate-400 hover:text-red-500 p-1.5 rounded-full bg-slate-50 hover:bg-red-50 border border-slate-100 shadow-sm transition-colors focus:outline-none">
                <X class="w-4 h-4" />
              </button>
            </div>
            
            <!-- Search state -->
            <div v-else class="relative">
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search class="w-4 h-4" /></div>
              <input v-model="setupForm.gwQuery" @input="searchSetupGw" placeholder="Buscar por nombre o correo..." class="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold bg-white shadow-sm transition-all" />
              
              <!-- Dropdown -->
              <div v-if="setupForm.gwResults.length > 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl z-30 max-h-48 overflow-y-auto custom-scrollbar py-2">
                <button type="button" v-for="res in setupForm.gwResults" :key="res.email" @click="selectSetupGw(res)" class="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 flex items-center gap-3 transition-colors">
                  <img v-if="res.photoUrl" :src="res.photoUrl" class="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  <div v-else class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex justify-center items-center text-[10px] font-black">{{ res.name.slice(0,2).toUpperCase() }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-black text-slate-800 truncate">{{ res.name }}</p>
                    <p class="text-[10px] font-bold text-slate-500 truncate">{{ res.email }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Phone Input -->
          <div class="space-y-2 relative z-10">
            <label class="block text-[10px] font-black text-indigo-500 uppercase tracking-widest">Número de Contacto</label>
            <div class="flex items-center shadow-sm rounded-xl">
              <div class="bg-indigo-50 border border-indigo-200 border-r-0 px-4 py-3 rounded-l-xl text-indigo-700 font-black text-sm">+52 1</div>
              <input v-model="setupForm.phone" @input="onSetupPhoneInput" type="tel" placeholder="10 dígitos exactos" class="flex-1 px-4 py-3 rounded-r-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-black bg-white transition-all" />
            </div>
          </div>
          
          <button @click="saveSetupData" :disabled="!setupForm.selectedUser || setupForm.phone.length !== 10 || setupForm.saving" class="w-full py-3.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all flex justify-center items-center gap-2 outline-none">
            <Loader2 v-if="setupForm.saving" class="w-4 h-4 animate-spin" />
            <span>{{ setupForm.saving ? 'Procesando...' : 'Completar Directorio' }}</span>
          </button>
        </div>
        
        <!-- State: Missing Phone Only -->
        <div v-else class="space-y-5">
          <div class="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <img v-if="coverageData.context.photoUrl" :src="coverageData.context.photoUrl" class="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm bg-white" />
            <div v-else class="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center text-sm font-black text-slate-500">{{ coverageData.context.name.slice(0,2).toUpperCase() }}</div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{{ coverageData.role }}</p>
              <p class="text-base font-black text-slate-800 truncate">{{ coverageData.context.name }}</p>
            </div>
          </div>
          
          <div class="space-y-2">
            <label class="block text-[10px] font-black text-indigo-500 uppercase tracking-widest">Número de Contacto Requerido</label>
            <div class="flex items-center shadow-sm rounded-xl">
              <div class="bg-indigo-50 border border-indigo-200 border-r-0 px-4 py-3 rounded-l-xl text-indigo-700 font-black text-sm">+52 1</div>
              <input v-model="setupForm.phone" @input="onSetupPhoneInput" type="tel" placeholder="10 dígitos exactos" class="flex-1 px-4 py-3 rounded-r-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-black bg-white transition-all" />
            </div>
          </div>
          
          <button @click="saveSetupData" :disabled="setupForm.phone.length !== 10 || setupForm.saving" class="w-full py-3.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all flex justify-center items-center gap-2 outline-none">
            <Loader2 v-if="setupForm.saving" class="w-4 h-4 animate-spin" />
            <span>{{ setupForm.saving ? 'Procesando...' : 'Completar Directorio' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Settings2, X, Search, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  plantel: { type: String, required: true },
  coverageData: { type: Object, required: true }
})

const emit = defineEmits(['cancel', 'completed'])

const setupForm = reactive({
  gwQuery: '',
  gwResults: [],
  selectedUser: null,
  phone: '',
  saving: false
})
let gwTimeout = null

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    setupForm.gwQuery = ''
    setupForm.gwResults = []
    setupForm.selectedUser = null
    setupForm.phone = ''
    setupForm.saving = false
  }
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
  setupForm.phone = cleanPhone
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
            channel: 'WHATSAPP',
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
    alert('Fallo al completar el ajuste operativo. Por favor, intenta nuevamente.')
  } finally {
    setupForm.saving = false
  }
}
</script>