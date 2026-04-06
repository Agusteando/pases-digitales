<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
      
      <header class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 relative">
        <div class="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div>
          <h3 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span class="font-mono text-brand-600">#{{ String(pass.id).padStart(5, '0') }}</span>
            <span v-if="!isEditable" class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">Solo lectura</span>
          </h3>
          <p class="text-sm font-bold text-slate-500 mt-1">{{ pass.employee_name }}</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none">
          <X class="w-5 h-5" />
        </button>
      </header>

      <div class="p-8 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-slate-50/30">
        
        <div v-if="!isEditable" class="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
          <Lock class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 class="text-sm font-black text-amber-900">Edición bloqueada</h4>
            <p class="text-xs text-amber-700 font-medium mt-1 leading-relaxed">
              La edición no está disponible. El pase ya fue resuelto, han pasado más de 48 horas o no cuenta con permisos de administrador.
            </p>
          </div>
        </div>

        <form @submit.prevent="handleSave" id="editPassForm" class="space-y-6">
          <div class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Categoría</label>
            <select v-model="form.categoryId" :disabled="!isEditable" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold text-slate-900 transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500">
              <option :value="1">Llegada tarde</option>
              <option :value="2">Salida anticipada</option>
              <option :value="3">Ausencia justificada</option>
              <option :value="4">Cambio de horario</option>
              <option :value="5">Incapacidad médica</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-5">
            <div class="space-y-2">
              <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Desde</label>
              <input type="date" v-model="form.date" :min="todayDate" :disabled="!isEditable" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
            </div>
            <div v-if="[3, 5].includes(form.categoryId)" class="space-y-2">
              <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Hasta</label>
              <input type="date" v-model="form.endDate" :min="todayDate" :disabled="!isEditable" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
            </div>
            <div v-if="![3].includes(form.categoryId)" class="space-y-2">
              <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Hora</label>
              <input type="time" v-model="form.time" :disabled="!isEditable" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Plantel</label>
            <input type="text" v-model="form.plantel" :disabled="!isEditable" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
          </div>

          <div v-if="[2].includes(form.categoryId)" class="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <input type="checkbox" id="regresoEdit" v-model="form.regreso" :disabled="!isEditable" class="w-5 h-5 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
            <label for="regresoEdit" class="text-sm font-bold text-slate-700 select-none cursor-pointer" :class="{'opacity-60 cursor-not-allowed': !isEditable}">Retorna en la misma jornada</label>
          </div>

          <div v-if="form.regreso && [2].includes(form.categoryId)" class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Hora de regreso</label>
            <input type="time" v-model="form.horaRegreso" :disabled="!isEditable" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-bold transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
          </div>

          <div v-if="form.categoryId === 5" class="space-y-5 p-5 bg-teal-50/80 rounded-2xl border border-teal-100 shadow-sm">
            <div class="space-y-2">
              <label class="block text-[11px] font-black text-teal-700 uppercase tracking-widest">Folio IMSS</label>
              <input type="text" v-model="form.imss" :disabled="!isEditable" class="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm font-bold transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
            </div>
            <div class="space-y-2">
              <label class="block text-[11px] font-black text-teal-700 uppercase tracking-widest">Tipo de incapacidad</label>
              <select v-model="form.tipoIncapacidad" :disabled="!isEditable" class="w-full px-4 py-3 rounded-xl border border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm font-bold transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500">
                <option value="Enfermedad general">Enfermedad general</option>
                <option value="Riesgo de trabajo">Riesgo de trabajo</option>
                <option value="Maternidad">Maternidad</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Justificación</label>
            <textarea v-model="form.comentarios" rows="3" :disabled="!isEditable" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm font-medium transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500 resize-none"></textarea>
          </div>
        </form>

      </div>

      <footer class="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-end shrink-0 gap-3">
        <button @click="$emit('close')" :disabled="isSaving" class="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors outline-none disabled:opacity-50 border border-transparent hover:border-slate-200">
          Cerrar
        </button>
        <button v-if="isEditable" type="submit" form="editPassForm" :disabled="isSaving" class="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:hover:bg-brand-600 flex items-center gap-2 outline-none">
          <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
          <span>{{ isSaving ? 'Guardando...' : 'Guardar cambios' }}</span>
        </button>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { X, Lock, Loader2, Trash2 } from 'lucide-vue-next'
import dayjs from 'dayjs'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  pass: { type: Object, required: true }
})

const emit = defineEmits(['close', 'updated'])
const { user } = useAuth()
const todayDate = dayjs().format('YYYY-MM-DD')

const isAdmin = computed(() => user.value?.is_admin || false)
const isOwner = computed(() => user.value && props.pass && user.value.name === props.pass.user)
const canManage = computed(() => isOwner.value || isAdmin.value)

const isEditable = computed(() => {
  if (!canManage.value) return false
  if (props.pass.status !== 'pendiente') return false
  const passDate = dayjs(props.pass.date)
  const now = dayjs()
  const hoursDiff = now.diff(passDate, 'hour')
  return hoursDiff <= 48
})

const form = ref({
  categoryId: 1,
  date: '',
  endDate: '',
  time: '',
  plantel: '',
  regreso: false,
  horaRegreso: '',
  comentarios: '',
  imss: '',
  tipoIncapacidad: ''
})

const formatToDateInput = (val) => {
  if (!val) return ''
  return dayjs(val).format('YYYY-MM-DD')
}

const formatToTimeInput = (val) => {
  if (!val) return ''
  return val.slice(0, 5)
}

onMounted(() => {
  if (props.pass) {
    form.value = {
      categoryId: Number(props.pass.category_id) || 1,
      date: formatToDateInput(props.pass.date),
      endDate: formatToDateInput(props.pass.fecha_fin),
      time: formatToTimeInput(props.pass.time),
      plantel: props.pass.plantel || '',
      regreso: props.pass.regreso == 1,
      horaRegreso: formatToTimeInput(props.pass.hora_regreso),
      comentarios: props.pass.comentarios || '',
      imss: props.pass.IMSS || '',
      tipoIncapacidad: props.pass.tipo_incapacidad || ''
    }
  }
})

const isSaving = ref(false)

const handleSave = async () => {
  if (!isEditable.value || isSaving.value) return
  isSaving.value = true

  try {
    await $fetch(`/api/passes/${props.pass.id}`, {
      method: 'PUT',
      body: form.value
    })
    
    emit('updated')
    emit('close')
  } catch (error) {
    console.error('Update error:', error)
    alert(error?.data?.message || 'Ocurrió un error al intentar actualizar el registro.')
  } finally {
    isSaving.value = false
  }
}
</script>