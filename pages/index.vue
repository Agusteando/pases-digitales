<template>
  <div class="flex flex-col lg:flex-row h-full w-full overflow-hidden pb-16 md:pb-0">
    <!-- Left: Intelligent Creation Flow -->
    <section class="w-full lg:w-[45%] flex flex-col h-[50vh] lg:h-full bg-white shadow-[10px_0_30px_-10px_rgba(0,0,0,0.03)] z-20 relative shrink-0">
      <header class="p-6 md:p-8 pb-4 flex justify-between items-start shrink-0">
        <div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Portal de Incidencias</h1>
          <p class="text-slate-500 mt-1 font-medium text-xs md:text-sm">Emisión oficial y prevención de duplicados.</p>
        </div>
        <div class="flex items-center gap-2 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200/60 shadow-sm">
          <div class="w-6 h-6 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center font-bold text-xs">{{ userInitials }}</div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto px-6 md:px-8 pb-8 custom-scrollbar">
        <div class="mb-8">
          <label class="block text-xs md:text-sm font-extrabold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
            Identidad del Colaborador
          </label>
          <EmployeeSearch @select="addEmployee" />
          
          <div v-if="selectedEmployees.length > 0" class="flex flex-wrap gap-2.5 mt-4">
            <div v-for="emp in selectedEmployees" :key="emp.id" class="flex items-center gap-2 bg-white border-2 border-slate-900 pl-1.5 pr-3 py-1.5 rounded-xl shadow-sm animate-in zoom-in-95 duration-200">
              <span class="text-sm font-bold text-slate-800 pl-2">{{ emp.name.split(' ')[0] }}</span>
              <button type="button" @click="removeEmployee(emp.id)" class="text-slate-400 hover:text-red-500 ml-1 rounded-full p-1 transition-colors">
                <XIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <transition name="fade">
          <div v-if="selectedEmployees.length > 0" class="mb-8">
            <label class="block text-xs md:text-sm font-extrabold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
              Naturaleza del Pase
            </label>
            <div class="grid grid-cols-2 gap-3 md:gap-4">
              <ScenarioCard v-for="scenario in predefinedScenarios" :key="scenario.id" :title="scenario.title" :iconName="scenario.icon" :active="activeScenario?.id === scenario.id" @click="selectScenario(scenario)"/>
            </div>
          </div>
        </transition>

        <transition name="slide-up">
          <form v-if="activeScenario" @submit.prevent="submitPass" class="space-y-6 bg-slate-50 p-5 md:p-6 rounded-3xl border border-slate-200">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-xs font-bold text-slate-600 uppercase">Fecha Inicio</label>
                <input type="date" v-model="form.date" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-500 outline-none font-medium text-slate-700" />
              </div>
              <div v-if="activeScenario.needsEndDate" class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-xs font-bold text-slate-600 uppercase">Fecha Fin</label>
                <input type="date" v-model="form.endDate" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-500 outline-none font-medium text-slate-700" />
              </div>
              <div v-if="activeScenario.needsTime" class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-xs font-bold text-slate-600 uppercase">Hora de Movimiento</label>
                <input type="time" v-model="form.time" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-500 outline-none font-medium text-slate-700" />
              </div>
            </div>

            <div v-if="activeScenario.canReturn" class="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 cursor-pointer" @click="form.regreso = !form.regreso">
              <span class="text-sm font-bold text-slate-700">¿Retorna al plantel hoy?</span>
              <div :class="['w-12 h-6 rounded-full transition-colors px-1 flex items-center', form.regreso ? 'bg-slate-900' : 'bg-slate-200']">
                <div :class="['w-4 h-4 bg-white rounded-full transition-transform', form.regreso ? 'transform translate-x-6' : '']"></div>
              </div>
            </div>

            <div v-if="form.regreso" class="space-y-2 animate-in fade-in">
              <label class="block text-xs font-bold text-slate-600 uppercase">Hora Estimada de Retorno</label>
              <input type="time" v-model="form.horaRegreso" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none font-medium text-slate-700" />
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-bold text-slate-600 uppercase">Motivo Oficial</label>
              <textarea v-model="form.comentarios" rows="2" required class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-500 outline-none resize-none font-medium text-slate-700" placeholder="Especifique los detalles..."></textarea>
            </div>

            <button type="submit" :disabled="isSubmitting" class="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3">
              <CheckCircle v-if="!isSubmitting" class="w-5 h-5"/>
              <Loader2 v-else class="w-5 h-5 animate-spin" />
              <span>{{ isSubmitting ? 'Procesando...' : 'Emitir Pase Oficial' }}</span>
            </button>
          </form>
        </transition>
      </div>
    </section>

    <!-- Right: Context & Recent Activity -->
    <section class="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative z-10 h-[50vh] lg:h-full">
      <div class="relative z-10 h-full max-w-4xl mx-auto">
        <div v-if="selectedEmployees.length > 0" class="flex flex-col gap-6 pb-12">
          <!-- Two-Stage Enrichment automatically handles fetching real photos -->
          <EmployeeContextPanel v-for="emp in selectedEmployees" :key="emp.id" :employee="emp" />
        </div>
        <div v-else class="h-full">
          <RecentActivityPanel />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { CheckCircle, Loader2, X as XIcon } from 'lucide-vue-next'
import EmployeeSearch from '~/components/EmployeeSearch.vue'
import ScenarioCard from '~/components/ScenarioCard.vue'
import EmployeeContextPanel from '~/components/EmployeeContextPanel.vue'
import RecentActivityPanel from '~/components/RecentActivityPanel.vue'

const { user } = useAuth()
const userInitials = computed(() => user.value?.name?.substring(0, 2).toUpperCase() || 'AD')

const selectedEmployees = ref([])
const activeScenario = ref(null)
const isSubmitting = ref(false)

function addEmployee(emp) {
  if (!selectedEmployees.value.find(e => e.id === emp.id)) {
    selectedEmployees.value.push(emp)
  }
}

function removeEmployee(id) {
  selectedEmployees.value = selectedEmployees.value.filter(e => e.id !== id)
  if (selectedEmployees.value.length === 0) activeScenario.value = null
}

const getToday = () => new Date().toISOString().split('T')[0]

const form = reactive({
  date: getToday(),
  endDate: '',
  time: '',
  comentarios: '',
  regreso: false,
  horaRegreso: ''
})

const predefinedScenarios = [
  { id: 'salida', title: 'Salida Anticipada', icon: 'LogOut', categoryId: 2, needsTime: true, canReturn: true },
  { id: 'llegada', title: 'Llegada Tardía', icon: 'LogIn', categoryId: 1, needsTime: true, canReturn: false },
  { id: 'falta', title: 'Ausencia Autorizada', icon: 'UserX', categoryId: 3, needsTime: false, canReturn: false, needsEndDate: true },
  { id: 'imss', title: 'Incapacidad Médica', icon: 'Stethoscope', categoryId: 5, needsTime: false, canReturn: false, needsEndDate: true }
]

function selectScenario(scenario) {
  activeScenario.value = scenario
  Object.assign(form, { date: getToday(), endDate: getToday(), time: '', comentarios: '', regreso: false, horaRegreso: '' })
}

async function submitPass() {
  isSubmitting.value = true
  try {
    await Promise.all(selectedEmployees.value.map(emp => 
      $fetch('/api/passes', {
        method: 'POST',
        body: { employeeId: emp.id, employeeName: emp.name, plantel: emp.plantel || 'N/A', categoryId: activeScenario.value.categoryId, ...form }
      })
    ))
    activeScenario.value = null
    selectedEmployees.value = []
    refreshNuxtData() // Soft refresh to update recent activity
  } catch(e) {
    console.error(e)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(15px); }
</style>