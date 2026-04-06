<template>
  <div class="flex flex-col xl:flex-row h-full w-full">
    
    <!-- Left Column: Search & Action Form -->
    <section class="w-full xl:w-[48%] flex flex-col bg-white/60 backdrop-blur-md border-r border-slate-200/60 z-20 min-h-[50vh] xl:h-screen xl:sticky xl:top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      <header class="px-8 py-8 border-b border-slate-200/60 bg-white/50">
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">Emisión de Pase</h1>
        <p class="text-slate-500 mt-2 text-sm font-bold">Justificación formal de incidencias del personal.</p>
      </header>

      <div class="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar relative">
        
        <!-- Search Section -->
        <div class="mb-10">
          <label class="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest">Localizar Colaborador</label>
          <EmployeeSearch @select="addEmployee" />
          
          <div v-if="selectedEmployees.length > 0" class="flex flex-wrap gap-3 mt-5">
            <div v-for="emp in selectedEmployees" :key="emp.id" class="flex items-center gap-3 bg-white border border-slate-200 pl-4 pr-1.5 py-1.5 rounded-2xl group shadow-sm transition-all hover:border-brand-300 hover:shadow-md">
              <span class="text-sm font-black text-slate-800">{{ emp.name.split(' ')[0] }} {{ emp.name.split(' ')[1] || '' }}</span>
              <button type="button" @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-white bg-slate-50 hover:bg-red-500 w-7 h-7 flex items-center justify-center rounded-full transition-colors focus:outline-none border border-slate-100">
                <XIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Directory Completion Interceptor -->
        <div v-if="checkingCoverage" class="mb-10 py-10 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border border-slate-100 animate-pulse">
           <Loader2 class="w-8 h-8 animate-spin text-brand-400 mb-3" />
           <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Verificando estado operativo...</p>
        </div>
        
        <div v-else-if="directoryCoverage && !directoryCoverage.isComplete" class="mb-10 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div class="flex items-start gap-4 mb-6">
              <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200 shadow-sm">
                 <Settings2 class="w-5 h-5" />
              </div>
              <div>
                 <h3 class="text-sm font-black text-indigo-900 tracking-tight">Ajuste Único del Plantel</h3>
                 <p class="text-xs font-medium text-indigo-700/80 mt-1 leading-relaxed">
                   Para continuar con el plantel <strong>{{ selectedEmployees[0]?.plantel }}</strong>, necesitamos completar un dato pendiente. Solo se solicita una vez.
                 </p>
              </div>
           </div>
           
           <!-- State: Missing Person -->
           <div v-if="directoryCoverage.step.includes('MISSING')" class="space-y-5 bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
              <div class="space-y-3 relative z-20">
                 <label class="block text-[10px] font-black text-indigo-500 uppercase tracking-widest">Seleccionar {{ directoryCoverage.role }}</label>
                 
                 <!-- Selected state -->
                 <div v-if="setupForm.selectedUser" class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <img v-if="setupForm.selectedUser.photoUrl" :src="setupForm.selectedUser.photoUrl" class="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                    <div v-else class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-500">{{ setupForm.selectedUser.name.slice(0,2).toUpperCase() }}</div>
                    <div class="flex-1 min-w-0">
                       <p class="text-sm font-black text-slate-800 truncate">{{ setupForm.selectedUser.name }}</p>
                       <p class="text-[10px] font-bold text-slate-500 truncate">{{ setupForm.selectedUser.email }}</p>
                    </div>
                    <button @click="setupForm.selectedUser = null" class="text-slate-400 hover:text-red-500 p-1 rounded-full bg-white border border-slate-100 shadow-sm"><X class="w-4 h-4" /></button>
                 </div>
                 
                 <!-- Search state -->
                 <div v-else class="relative">
                    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search class="w-4 h-4" /></div>
                    <input v-model="setupForm.gwQuery" @input="searchSetupGw" placeholder="Buscar por nombre o correo..." class="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold bg-white shadow-sm" />
                    
                    <!-- Dropdown -->
                    <div v-if="setupForm.gwResults.length > 0" class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl z-30 max-h-48 overflow-y-auto custom-scrollbar">
                       <button v-for="res in setupForm.gwResults" :key="res.email" @click="selectSetupGw(res)" class="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 flex items-center gap-3 transition-colors">
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
                    <input v-model="setupForm.phone" @input="onSetupPhoneInput" type="tel" placeholder="10 dígitos exactos" class="flex-1 px-4 py-3 rounded-r-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-black bg-white" />
                 </div>
              </div>
              
              <button @click="saveSetupData" :disabled="!setupForm.selectedUser || setupForm.phone.length !== 10 || setupForm.saving" class="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md disabled:opacity-50 transition-all flex justify-center items-center gap-2 outline-none">
                 <Loader2 v-if="setupForm.saving" class="w-4 h-4 animate-spin" />
                 <span>Completar Ajuste</span>
              </button>
           </div>
           
           <!-- State: Missing Phone Only -->
           <div v-else class="space-y-5 bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
              <div class="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                 <img v-if="directoryCoverage.context.photoUrl" :src="directoryCoverage.context.photoUrl" class="w-12 h-12 rounded-full border border-slate-200 object-cover shadow-sm bg-white" />
                 <div v-else class="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-sm font-black text-slate-500">{{ directoryCoverage.context.name.slice(0,2).toUpperCase() }}</div>
                 <div class="flex-1 min-w-0">
                    <p class="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{{ directoryCoverage.role }}</p>
                    <p class="text-base font-black text-slate-800 truncate">{{ directoryCoverage.context.name }}</p>
                 </div>
              </div>
              
              <div class="space-y-2">
                 <label class="block text-[10px] font-black text-indigo-500 uppercase tracking-widest">Número de Contacto Requerido</label>
                 <div class="flex items-center shadow-sm rounded-xl">
                    <div class="bg-indigo-50 border border-indigo-200 border-r-0 px-4 py-3 rounded-l-xl text-indigo-700 font-black text-sm">+52 1</div>
                    <input v-model="setupForm.phone" @input="onSetupPhoneInput" type="tel" placeholder="10 dígitos exactos" class="flex-1 px-4 py-3 rounded-r-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-black bg-white" />
                 </div>
              </div>
              
              <button @click="saveSetupData" :disabled="setupForm.phone.length !== 10 || setupForm.saving" class="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md disabled:opacity-50 transition-all flex justify-center items-center gap-2 outline-none">
                 <Loader2 v-if="setupForm.saving" class="w-4 h-4 animate-spin" />
                 <span>Completar Ajuste</span>
              </button>
           </div>
        </div>

        <template v-else-if="directoryCoverage && directoryCoverage.isComplete">
          <!-- Intelligent Quick Actions Layer -->
          <div v-if="selectedEmployees.length > 0" class="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label class="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest">Acciones Rápidas</label>
            
            <div class="flex flex-col gap-4">
              <!-- Birthday Inference Banner -->
              <button v-if="isBirthday(selectedEmployees[0])" @click="triggerBirthdayQuickAction" class="w-full relative overflow-hidden bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-5 text-left transition-transform hover:scale-[1.01] hover:shadow-lg outline-none group border border-orange-400/50">
                <div class="absolute right-0 top-0 bottom-0 w-32 bg-white/20 blur-2xl transform skew-x-12 translate-x-10 group-hover:translate-x-0 transition-transform duration-700"></div>
                <div class="relative z-10 flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-2 text-white/90 mb-1">
                      <Cake class="w-4 h-4" />
                      <span class="text-[10px] font-black uppercase tracking-widest">Día Festivo</span>
                    </div>
                    <h3 class="text-lg font-black text-white tracking-tight">¡Hoy es su cumpleaños! 🎉</h3>
                    <p class="text-xs font-bold text-orange-100 mt-0.5">Generar pase de ausencia por cumpleaños.</p>
                  </div>
                  <ArrowRight class="w-6 h-6 text-white" />
                </div>
              </button>

              <!-- Regular Quick Action -->
              <div class="flex gap-4">
                <button @click="triggerEarlyLeaveQuickAction" class="flex-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-2xl p-4 text-left transition-all shadow-sm hover:shadow-md outline-none flex items-center gap-4 group">
                  <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LogOut class="w-5 h-5" />
                  </div>
                  <div>
                    <h4 class="text-sm font-black text-slate-800">Salida Temprano</h4>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Prellenar formato</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Standard Scenarios Section -->
          <div v-if="selectedEmployees.length > 0" class="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label class="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest">Catálogo Estándar</label>
            <div class="grid grid-cols-2 gap-4">
              <ScenarioCard 
                v-for="scenario in predefinedScenarios" 
                :key="scenario.id" 
                :title="scenario.title" 
                :iconName="scenario.icon" 
                :active="activeScenario?.id === scenario.id" 
                @click="selectScenario(scenario)"
              />
            </div>
          </div>

          <!-- Form Section -->
          <form v-if="activeScenario" @submit.prevent="submitPass" class="space-y-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-card animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1.5 bg-brand-500"></div>
            
            <h3 class="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
              <PenTool class="w-5 h-5 text-brand-500" />
              Detalles Operativos
            </h3>

            <div class="grid grid-cols-2 gap-5">
              <div class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha Inicio</label>
                <input type="date" v-model="form.date" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
              </div>
              <div v-if="activeScenario.needsEndDate" class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha Fin</label>
                <input type="date" v-model="form.endDate" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
              </div>
              <div v-if="activeScenario.needsTime" class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora Evento</label>
                <input type="time" v-model="form.time" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
              </div>
            </div>

            <div v-if="activeScenario.canReturn" class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <input type="checkbox" id="regreso" v-model="form.regreso" class="w-5 h-5 rounded text-brand-600 focus:ring-brand-500 border-slate-300 transition-colors cursor-pointer" />
              <label for="regreso" class="text-sm font-black text-slate-700 cursor-pointer select-none">El colaborador retorna en la misma jornada</label>
            </div>

            <div v-if="form.regreso" class="space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora Estimada de Retorno</label>
              <input type="time" v-model="form.horaRegreso" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-slate-50/50" />
            </div>

            <!-- Medical specifics -->
            <div v-if="activeScenario.isMedical" class="space-y-5 p-6 bg-teal-50/50 rounded-3xl border border-teal-100">
              <div class="space-y-2">
                <label class="block text-[10px] font-black text-teal-700 uppercase tracking-widest">Folio IMSS</label>
                <input type="text" v-model="form.imss" placeholder="Ej. 12345678" class="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm font-bold text-teal-900 transition-all bg-white shadow-sm" />
              </div>
              <div class="space-y-2">
                <label class="block text-[10px] font-black text-teal-700 uppercase tracking-widest">Clasificación Médica</label>
                <select v-model="form.tipoIncapacidad" class="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm font-bold text-teal-900 transition-all bg-white shadow-sm">
                  <option value="Enfermedad en General">Enfermedad en General</option>
                  <option value="Riesgo de Trabajo">Riesgo de Trabajo</option>
                  <option value="Maternidad">Maternidad</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Justificación u Observaciones</label>
              <textarea v-model="form.comentarios" rows="3" placeholder="Redacta el motivo de forma clara..." required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium text-slate-900 resize-none transition-all bg-slate-50/50"></textarea>
            </div>

            <div class="pt-4">
              <button type="submit" :disabled="isSubmitting" class="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-base rounded-2xl transition-all shadow-md hover:shadow-xl disabled:opacity-70 disabled:hover:bg-brand-600 flex items-center justify-center gap-3 outline-none transform active:scale-[0.98]">
                <Loader2 v-if="isSubmitting" class="w-5 h-5 animate-spin" />
                <Send v-else class="w-5 h-5" />
                <span>{{ isSubmitting ? 'Procesando Envío...' : 'Generar y Notificar Pase' }}</span>
              </button>
            </div>
          </form>
        </template>
      </div>
    </section>

    <!-- Right Column: Operational Context -->
    <section class="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar relative xl:h-screen bg-transparent z-10">
      <div class="max-w-3xl mx-auto flex flex-col gap-8">
        <template v-if="selectedEmployees.length > 0">
          <div class="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">Expediente Operativo</h2>
          </div>
          <EmployeeContextPanel v-for="emp in selectedEmployees" :key="emp.id" :employee="emp" class="animate-in fade-in slide-in-from-right-8 duration-500" />
        </template>
        <template v-else>
          <RecentActivityPanel class="animate-in fade-in duration-700" />
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Loader2, X as XIcon, Cake, ArrowRight, LogOut, PenTool, Send, Settings2, Search, X } from 'lucide-vue-next'
import EmployeeSearch from '~/components/EmployeeSearch.vue'
import ScenarioCard from '~/components/ScenarioCard.vue'
import EmployeeContextPanel from '~/components/EmployeeContextPanel.vue'
import RecentActivityPanel from '~/components/RecentActivityPanel.vue'

const selectedEmployees = ref([])
const activeScenario = ref(null)
const isSubmitting = ref(false)

// Directory Completion Setup Logic
const checkingCoverage = ref(false)
const directoryCoverage = ref(null)

const setupForm = reactive({
  gwQuery: '',
  gwResults: [],
  selectedUser: null,
  phone: '',
  saving: false
})
let gwTimeout = null

async function checkPlantelCoverage(plantel) {
  if (!plantel || plantel === 'N/A') {
    directoryCoverage.value = { isComplete: true }
    return
  }
  checkingCoverage.value = true
  try {
    directoryCoverage.value = await $fetch('/api/directory/coverage', { params: { plantel } })
    setupForm.gwQuery = ''
    setupForm.gwResults = []
    setupForm.selectedUser = null
    setupForm.phone = ''
  } catch(e) {
    // Fail open safely so it never blocks operation completely if API breaks
    directoryCoverage.value = { isComplete: true }
  } finally {
    checkingCoverage.value = false
  }
}

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
  const step = directoryCoverage.value?.step
  const role = directoryCoverage.value?.role
  const plantel = selectedEmployees.value[0]?.plantel
  
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
       const email = directoryCoverage.value.context.email
       const id = directoryCoverage.value.context.id
       await $fetch(`/api/directory/${id}/phone`, {
          method: 'PUT',
          body: { email, phone: setupForm.phone }
       })
    }
    await checkPlantelCoverage(plantel)
  } catch(e) {
    alert('Fallo al completar el ajuste. Por favor intenta nuevamente.')
  } finally {
    setupForm.saving = false
  }
}

async function addEmployee(emp) {
  if (!selectedEmployees.value.find(e => e.id === emp.id)) {
    const enriched = await $fetch('/api/employees/enrich', { query: { name: emp.name } }).catch(() => ({}))
    emp.curp = enriched.curp || emp.curp || null
    emp.plantel = enriched.plantelId || emp.plantel || null
    selectedEmployees.value.push(emp)

    await checkPlantelCoverage(emp.plantel)
  }
}

function removeEmployee(id) {
  selectedEmployees.value = selectedEmployees.value.filter(e => e.id !== id)
  if (selectedEmployees.value.length === 0) {
    activeScenario.value = null
    directoryCoverage.value = null
  } else {
    checkPlantelCoverage(selectedEmployees.value[0]?.plantel)
  }
}

const getToday = () => new Date().toISOString().split('T')[0]
const getCurrentTime = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const form = reactive({
  date: getToday(),
  endDate: '',
  time: '',
  comentarios: '',
  regreso: false,
  horaRegreso: '',
  imss: '',
  tipoIncapacidad: 'Enfermedad en General'
})

const predefinedScenarios = [
  { id: 'salida', title: 'Salida Anticipada', icon: 'LogOut', categoryId: 2, needsTime: true, canReturn: true, isMedical: false },
  { id: 'llegada', title: 'Llegada Tarde', icon: 'LogIn', categoryId: 1, needsTime: true, canReturn: false, isMedical: false },
  { id: 'falta', title: 'Ausencia Justificada', icon: 'UserX', categoryId: 3, needsTime: false, canReturn: false, needsEndDate: true, isMedical: false },
  { id: 'imss', title: 'Incapacidad Médica', icon: 'Stethoscope', categoryId: 5, needsTime: false, canReturn: false, needsEndDate: true, isMedical: true }
]

function selectScenario(scenario) {
  activeScenario.value = scenario
  Object.assign(form, { 
    date: getToday(), endDate: getToday(), time: '', 
    comentarios: '', regreso: false, horaRegreso: '',
    imss: '', tipoIncapacidad: 'Enfermedad en General'
  })
}

// Birthday Logic
function isBirthday(emp) {
  if (!emp || !emp.curp || emp.curp.length < 10) return false;
  const mm = emp.curp.substring(6, 8);
  const dd = emp.curp.substring(8, 10);
  const today = new Date();
  const bMonth = parseInt(mm) - 1;
  const bDay = parseInt(dd);
  return today.getMonth() === bMonth && (today.getDate() === bDay || today.getDate() + 1 === bDay);
}

function triggerBirthdayQuickAction() {
  const ausenciaScenario = predefinedScenarios.find(s => s.categoryId === 3)
  selectScenario(ausenciaScenario)
  form.comentarios = 'Pase por día de cumpleaños.'
}

function triggerEarlyLeaveQuickAction() {
  const salidaScenario = predefinedScenarios.find(s => s.categoryId === 2)
  selectScenario(salidaScenario)
  form.time = getCurrentTime()
}

async function submitPass() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  
  try {
    await Promise.all(selectedEmployees.value.map(emp => 
      $fetch('/api/passes', {
        method: 'POST',
        body: { 
          employeeName: emp.name, 
          plantel: emp.plantel || 'N/A', 
          categoryId: activeScenario.value.categoryId, 
          ...form 
        }
      })
    ))
    
    activeScenario.value = null
    selectedEmployees.value = []
    directoryCoverage.value = null
    
    refreshNuxtData() 
  } catch(e) {
    console.error('Error', e)
    alert('Hubo un problema al registrar el pase.')
  } finally {
    isSubmitting.value = false
  }
}
</script>