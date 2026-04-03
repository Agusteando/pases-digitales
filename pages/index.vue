<template>
  <div class="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
    <!-- Sidebar -->
    <aside class="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-6 z-20 shrink-0 shadow-sm">
      <div class="w-12 h-12 bg-blue-600 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-xl">
        PD
      </div>
      <nav class="flex flex-col gap-4 mt-4 w-full px-3">
        <button class="p-3 w-full bg-blue-50 text-blue-600 rounded-xl flex justify-center hover:bg-blue-100 transition-colors group relative" title="Generar Pase">
          <Plus class="w-6 h-6" />
        </button>
        <button class="p-3 w-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl flex justify-center transition-colors" title="Ver Historial">
          <List class="w-6 h-6" />
        </button>
      </nav>
      <div class="mt-auto pb-4 w-full px-3">
        <button class="p-3 w-full text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex justify-center transition-colors" title="Cerrar Sesión">
          <LogOut class="w-6 h-6" />
        </button>
      </div>
    </aside>

    <!-- Main Command Center -->
    <main class="flex-1 flex flex-col xl:flex-row h-screen overflow-hidden">
      
      <!-- Left: Intelligent Creation Flow -->
      <section class="w-full xl:w-[45%] p-8 overflow-y-auto bg-white shadow-[10px_0_15px_-3px_rgba(0,0,0,0.02)] z-10 flex flex-col">
        <header class="mb-8 flex justify-between items-end">
          <div>
            <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Pases Digitales</h1>
            <p class="text-slate-500 mt-1 font-medium">Centro de Control de Asistencia</p>
          </div>
          <div class="flex items-center gap-2 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200">
            <UserCircle class="w-5 h-5 text-slate-500" />
            <span class="text-sm font-semibold text-slate-600">Admin</span>
          </div>
        </header>

        <!-- 1. Who? (Multi-User Support) -->
        <div class="mb-8">
          <label class="block text-sm font-bold text-slate-700 mb-2">1. ¿Para quién es el pase?</label>
          <EmployeeSearch @select="addEmployee" />
          
          <!-- Selected Employees Chips -->
          <div v-if="selectedEmployees.length > 0" class="flex flex-wrap gap-2 mt-4">
            <div 
              v-for="emp in selectedEmployees" 
              :key="emp.name" 
              class="flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-200 pl-1.5 pr-3 py-1.5 rounded-lg shadow-sm"
            >
              <img :src="emp.picture || getFallbackAvatar(emp.name)" @error="$event.target.src = getFallbackAvatar(emp.name)" class="w-6 h-6 rounded-md object-cover bg-white" />
              <span class="text-sm font-semibold">{{ emp.name }}</span>
              <button type="button" @click="removeEmployee(emp.name)" class="text-blue-400 hover:text-blue-600 ml-1 bg-white rounded-full p-0.5">
                <XIcon class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- 2. What? -->
        <transition name="fade">
          <div v-if="selectedEmployees.length > 0" class="mb-8">
            <label class="block text-sm font-bold text-slate-700 mb-3">2. ¿Qué situación reporta?</label>
            <div class="grid grid-cols-2 gap-3">
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
          <form v-if="activeScenario" @submit.prevent="submitPass" class="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-auto">
            <h3 class="font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">3. Detalles de {{ activeScenario.title }}</h3>
            
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">Fecha de Inicio</label>
              <input type="date" v-model="form.date" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" />
            </div>

            <div v-if="activeScenario.needsEndDate" class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">Fecha de Fin</label>
              <input type="date" v-model="form.endDate" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" />
            </div>

            <div v-if="activeScenario.needsTime" class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">Hora</label>
              <input type="time" v-model="form.time" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" />
            </div>

            <div v-if="activeScenario.canReturn" class="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer" @click="form.regreso = !form.regreso">
              <span class="text-sm font-semibold text-slate-700">¿Regresa al plantel hoy?</span>
              <div :class="['w-11 h-6 rounded-full transition-colors flex items-center px-1', form.regreso ? 'bg-blue-600' : 'bg-slate-300']">
                <div :class="['w-4 h-4 bg-white rounded-full transition-transform', form.regreso ? 'transform translate-x-5' : '']"></div>
              </div>
            </div>

            <transition name="fade">
              <div v-if="form.regreso" class="space-y-2">
                <label class="block text-sm font-semibold text-slate-700">Hora estimada de regreso</label>
                <input type="time" v-model="form.horaRegreso" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" />
              </div>
            </transition>

            <div v-if="activeScenario.isMedical" class="space-y-4">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-700">Folio IMSS (Certificado)</label>
                <input type="text" v-model="form.imss" placeholder="Ej. 12345678" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none" />
              </div>
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-slate-700">Tipo de Incapacidad</label>
                <select v-model="form.tipoIncapacidad" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white">
                  <option value="Enfermedad en General">Enfermedad en General</option>
                  <option value="Riesgo de Trabajo">Riesgo de Trabajo</option>
                  <option value="Maternidad">Maternidad</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">Motivo / Causa (Requerido)</label>
              <textarea v-model="form.comentarios" rows="2" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none" placeholder="Añade el contexto del pase..."></textarea>
            </div>

            <button type="submit" :disabled="isSubmitting" class="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
              <CheckCircle v-if="!isSubmitting" class="w-5 h-5"/>
              <Loader2 v-else class="w-5 h-5 animate-spin" />
              {{ isSubmitting ? 'Procesando...' : `Generar ${selectedEmployees.length > 1 ? selectedEmployees.length + ' Pases' : 'Pase'}` }}
            </button>
            
            <p v-if="submitSuccess" class="text-sm font-bold text-emerald-600 text-center mt-2 flex justify-center items-center gap-1">
              <CheckCircle2 class="w-4 h-4" /> ¡Completado con éxito!
            </p>
            <p v-if="submitError" class="text-sm font-bold text-red-600 text-center mt-2">
              Ocurrió un error al procesar la solicitud.
            </p>
          </form>
        </transition>
      </section>

      <!-- Right: Operational Context -->
      <section class="flex-1 bg-slate-100/50 p-8 overflow-y-auto">
        <div v-if="selectedEmployees.length > 0" class="flex flex-col gap-6">
          <EmployeeContextPanel 
            v-for="emp in selectedEmployees" 
            :key="emp.name" 
            :employee="emp" 
          />
        </div>
        <div v-else class="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
          <UserSearch class="w-20 h-20 opacity-20 text-slate-500" />
          <h2 class="text-xl font-bold text-slate-500">Esperando Selección</h2>
          <p class="text-center max-w-sm font-medium">Busca a uno o más empleados en el panel izquierdo para generar sus pases en bloque y ver su historial.</p>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, List, LogOut, CheckCircle, Loader2, UserSearch, UserCircle, CheckCircle2, X as XIcon } from 'lucide-vue-next'
import EmployeeSearch from '~/components/EmployeeSearch.vue'
import ScenarioCard from '~/components/ScenarioCard.vue'
import EmployeeContextPanel from '~/components/EmployeeContextPanel.vue'

const selectedEmployees = ref([])
const activeScenario = ref(null)
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref(false)

function getFallbackAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=f1f5f9&color=64748b`
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
  { id: 'falta', title: 'Falta / Ausencia', icon: 'UserX', categoryId: 3, needsTime: false, canReturn: false, needsEndDate: true, isMedical: false },
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
    // Generate passes sequentially or concurrently for all selected employees
    await Promise.all(selectedEmployees.value.map(emp => 
      $fetch('/api/passes', {
        method: 'POST',
        body: {
          employeeName: emp.name,
          plantel: emp.plantelId || 'N/A',
          categoryId: activeScenario.value.categoryId,
          ...form
        }
      })
    ))
    
    submitSuccess.value = true
    
    setTimeout(() => {
      activeScenario.value = null
      selectedEmployees.value = []
      submitSuccess.value = false
    }, 2000)
    
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