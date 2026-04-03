<template>
  <div class="h-screen bg-[#f8fafc] flex flex-col md:flex-row text-slate-900 overflow-hidden">
    
    <!-- Premium Sidebar -->
    <aside class="w-20 bg-white border-r border-slate-200/60 flex flex-col items-center py-6 gap-6 z-30 shrink-0 shadow-soft">
      <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-glow flex items-center justify-center text-white font-black text-xl hover:scale-105 transition-transform cursor-pointer">
        PD
      </div>
      <nav class="flex flex-col gap-4 mt-6 w-full px-3">
        <button class="p-3 w-full bg-blue-50 text-blue-600 rounded-xl flex justify-center hover:bg-blue-100 hover:shadow-inner transition-all group relative" title="Generar Pase">
          <Plus class="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        <button class="p-3 w-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl flex justify-center transition-all group" title="Ver Historial">
          <List class="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </nav>
      <div class="mt-auto pb-4 w-full px-3">
        <button class="p-3 w-full text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex justify-center transition-all group" title="Cerrar Sesión">
          <LogOut class="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </aside>

    <!-- Main Command Center -->
    <main class="flex-1 flex flex-col xl:flex-row h-full overflow-hidden relative">
      
      <!-- Left: Intelligent Creation Flow -->
      <section class="w-full xl:w-[45%] flex flex-col h-full bg-white shadow-[10px_0_30px_-10px_rgba(0,0,0,0.03)] z-20">
        <!-- Header -->
        <header class="p-8 pb-4 flex justify-between items-start shrink-0">
          <div>
            <h1 class="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              Generador
              <span v-if="isSandbox" class="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 shadow-sm animate-pulse">Test Mode</span>
            </h1>
            <p class="text-slate-500 mt-1.5 font-medium text-sm">Crea pases de asistencia de forma rápida y segura.</p>
          </div>
          
          <div class="flex flex-col items-end gap-3">
            <!-- User Profile -->
            <div class="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200/60 shadow-sm">
              <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">AD</div>
              <span class="text-xs font-bold text-slate-600 pr-1">Admin</span>
            </div>
            
            <!-- First-Class Sandbox Toggle -->
            <div 
              @click="isSandbox = !isSandbox"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
              :class="isSandbox ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'"
            >
              <Beaker class="w-4 h-4" :class="isSandbox ? 'text-amber-600' : 'text-slate-400'" />
              <span class="text-[10px] font-extrabold uppercase tracking-widest">Sandbox</span>
              <div :class="['w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ml-1', isSandbox ? 'bg-amber-500' : 'bg-slate-300']">
                <div :class="['w-3 h-3 bg-white rounded-full transition-transform shadow-sm', isSandbox ? 'transform translate-x-4' : '']"></div>
              </div>
            </div>
          </div>
        </header>

        <div class="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          <!-- 1. Who? -->
          <div class="mb-8">
            <label class="block text-sm font-extrabold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
              Selecciona Empleado(s)
            </label>
            <EmployeeSearch @select="addEmployee" />
            
            <!-- Selected Employees Chips -->
            <div v-if="selectedEmployees.length > 0" class="flex flex-wrap gap-2.5 mt-4">
              <div 
                v-for="emp in selectedEmployees" 
                :key="emp.name" 
                class="flex items-center gap-2 bg-white border-2 border-blue-500 pl-1.5 pr-3 py-1.5 rounded-xl shadow-sm animate-in zoom-in-95 duration-200"
              >
                <img :src="emp.picture || getFallbackAvatar(emp.name)" @error="$event.target.src = getFallbackAvatar(emp.name)" class="w-7 h-7 rounded-lg object-cover bg-slate-50 shadow-inner" />
                <span class="text-sm font-bold text-slate-800">{{ emp.name.split(' ')[0] }}</span>
                <button type="button" @click="removeEmployee(emp.name)" class="text-slate-400 hover:text-red-500 hover:bg-red-50 ml-1 rounded-full p-1 transition-colors">
                  <XIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- 2. What? -->
          <transition name="fade">
            <div v-if="selectedEmployees.length > 0" class="mb-8">
              <label class="block text-sm font-extrabold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                Tipo de Movimiento
              </label>
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
          </transition>

          <!-- 3. Dynamic Fields -->
          <transition name="slide-up">
            <form v-if="activeScenario" @submit.prevent="submitPass" class="space-y-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-soft">
              <div class="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-extrabold">3</span>
                <h3 class="font-extrabold text-slate-800 uppercase tracking-wider text-sm">Detalles Requeridos</h3>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2 col-span-2 md:col-span-1">
                  <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Fecha Inicio</label>
                  <input type="date" v-model="form.date" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-700" />
                </div>

                <div v-if="activeScenario.needsEndDate" class="space-y-2 col-span-2 md:col-span-1">
                  <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Fecha Fin</label>
                  <input type="date" v-model="form.endDate" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-700" />
                </div>

                <div v-if="activeScenario.needsTime" class="space-y-2 col-span-2 md:col-span-1">
                  <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Hora Exacta</label>
                  <input type="time" v-model="form.time" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-700" />
                </div>
              </div>

              <div v-if="activeScenario.canReturn" class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors" @click="form.regreso = !form.regreso">
                <span class="text-sm font-bold text-slate-700">¿Regresa al plantel hoy?</span>
                <div :class="['w-12 h-6 rounded-full transition-colors flex items-center px-1', form.regreso ? 'bg-blue-600' : 'bg-slate-300']">
                  <div :class="['w-4 h-4 bg-white rounded-full transition-transform shadow-sm', form.regreso ? 'transform translate-x-6' : '']"></div>
                </div>
              </div>

              <transition name="fade">
                <div v-if="form.regreso" class="space-y-2">
                  <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Hora estimada de regreso</label>
                  <input type="time" v-model="form.horaRegreso" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-700" />
                </div>
              </transition>

              <div v-if="activeScenario.isMedical" class="space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Folio IMSS</label>
                  <input type="text" v-model="form.imss" placeholder="Ej. 12345678" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none font-medium text-slate-700" />
                </div>
                <div class="space-y-2">
                  <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Clasificación</label>
                  <select v-model="form.tipoIncapacidad" class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none font-medium text-slate-700 appearance-none">
                    <option value="Enfermedad en General">Enfermedad en General</option>
                    <option value="Riesgo de Trabajo">Riesgo de Trabajo</option>
                    <option value="Maternidad">Maternidad</option>
                  </select>
                </div>
              </div>

              <div class="space-y-2">
                <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider">Justificación / Causa</label>
                <textarea v-model="form.comentarios" rows="2" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none font-medium text-slate-700" placeholder="Añade el contexto del pase..."></textarea>
              </div>

              <button type="submit" :disabled="isSubmitting" class="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] hover:shadow-lg relative overflow-hidden group">
                <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CheckCircle v-if="!isSubmitting" class="w-5 h-5 relative z-10"/>
                <Loader2 v-else class="w-5 h-5 animate-spin relative z-10" />
                <span class="relative z-10 tracking-wide">
                  {{ isSubmitting ? 'Procesando...' : `Confirmar y Generar ${selectedEmployees.length > 1 ? selectedEmployees.length + ' Pases' : 'Pase'}` }}
                </span>
              </button>
              
              <p v-if="submitSuccess" class="text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center flex justify-center items-center gap-2 animate-in slide-in-from-bottom-2">
                <CheckCircle2 class="w-5 h-5" /> 
                <span v-if="isSandbox">¡Pase simulado con éxito (Sandbox)!</span>
                <span v-else>¡Pase generado con éxito!</span>
              </p>
              <p v-if="submitError" class="text-sm font-bold text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl text-center flex justify-center items-center gap-2 animate-in slide-in-from-bottom-2">
                <ShieldAlert class="w-5 h-5" /> Ocurrió un error en la solicitud.
              </p>
            </form>
          </transition>
        </div>
      </section>

      <!-- Right: Operational Context or Global Dashboard -->
      <section class="flex-1 p-8 overflow-y-auto custom-scrollbar relative z-10 bg-slate-50/50">
        <!-- Background Pattern -->
        <div class="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"></div>
        
        <div class="relative z-10 h-full">
          <div v-if="selectedEmployees.length > 0" class="flex flex-col gap-6 pb-12">
            <EmployeeContextPanel 
              v-for="emp in selectedEmployees" 
              :key="emp.name" 
              :employee="emp" 
            />
          </div>
          <div v-else class="h-full">
            <MovementDashboard />
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, List, LogOut, CheckCircle, Loader2, Beaker, CheckCircle2, ShieldAlert, X as XIcon } from 'lucide-vue-next'
import EmployeeSearch from '~/components/EmployeeSearch.vue'
import ScenarioCard from '~/components/ScenarioCard.vue'
import EmployeeContextPanel from '~/components/EmployeeContextPanel.vue'
import MovementDashboard from '~/components/MovementDashboard.vue'

const selectedEmployees = ref([])
const activeScenario = ref(null)
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref(false)
const isSandbox = ref(false) // State-of-the-art Sandbox Mode

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f8fafc&color=475569`
}

function addEmployee(emp) {
  if (!selectedEmployees.value.find(e => e.name === emp.name)) {
    selectedEmployees.value.push(emp)
  }
}

function removeEmployee(name) {
  selectedEmployees.value = selectedEmployees.value.filter(e => e.name !== name)
  if (selectedEmployees.value.length === 0) {
    activeScenario.value = null
  }
}

const getToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  { id: 'salida', title: 'Salida Temprano', icon: 'LogOut', categoryId: 2, needsTime: true, canReturn: true, needsEndDate: false, isMedical: false },
  { id: 'llegada', title: 'Llegada Tarde', icon: 'LogIn', categoryId: 1, needsTime: true, canReturn: false, needsEndDate: false, isMedical: false },
  { id: 'falta', title: 'Ausencia General', icon: 'UserX', categoryId: 3, needsTime: false, canReturn: false, needsEndDate: true, isMedical: false },
  { id: 'imss', title: 'Incapacidad IMSS', icon: 'Stethoscope', categoryId: 5, needsTime: false, canReturn: false, needsEndDate: true, isMedical: true }
]

function selectScenario(scenario) {
  activeScenario.value = scenario
  form.date = getToday()
  form.endDate = getToday()
  form.time = ''
  form.comentarios = ''
  form.regreso = false
  form.horaRegreso = ''
  form.imss = ''
  submitSuccess.value = false
  submitError.value = false
}

async function submitPass() {
  isSubmitting.value = true
  submitSuccess.value = false
  submitError.value = false
  
  try {
    await Promise.all(selectedEmployees.value.map(emp => 
      $fetch('/api/passes', {
        method: 'POST',
        body: {
          employeeName: emp.name,
          plantel: emp.plantelId || 'N/A',
          categoryId: activeScenario.value.categoryId,
          sandbox: isSandbox.value, // Pass Sandbox Flag
          ...form
        }
      })
    ))
    
    submitSuccess.value = true
    
    setTimeout(() => {
      activeScenario.value = null
      selectedEmployees.value = []
      submitSuccess.value = false
      // Trigger a soft refresh of components reliant on db data
      refreshNuxtData()
    }, 2500)
    
  } catch(e) {
    console.error(e)
    submitError.value = true
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px); }
</style>