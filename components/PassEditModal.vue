<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
      
      <header class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div>
          <h3 class="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            Pase #{{ String(pass.id).padStart(5, '0') }}
            <span v-if="!isEditable" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-600">Solo Lectura</span>
          </h3>
          <p class="text-xs font-medium text-slate-500 mt-0.5">{{ pass.employee_name }}</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
          <X class="w-5 h-5" />
        </button>
      </header>

      <div class="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
        
        <div v-if="!isEditable" class="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3 items-center">
          <Lock class="w-5 h-5 text-slate-400 shrink-0" />
          <p class="text-xs text-slate-600 font-medium">
            El periodo permitido para modificación ha concluido, el registro se encuentra en un estado inalterable, o no eres el creador de este pase.
          </p>
        </div>

        <form @submit.prevent="handleSave" id="editPassForm" class="space-y-5">
          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Categoría</label>
            <select v-model="form.categoryId" :disabled="!isEditable" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium text-slate-900 transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500">
              <option :value="1">Pase de entrada (Llegada tarde)</option>
              <option :value="2">Pase de salida (Salida anticipada)</option>
              <option :value="3">Pase para faltar (Ausencia)</option>
              <option :value="4">Pase cambio de horario</option>
              <option :value="5">Incapacidad</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha inicio</label>
              <input type="date" v-model="form.date" :disabled="!isEditable" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
            </div>
            <div v-if="[3, 5].includes(form.categoryId)" class="space-y-1.5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fecha fin</label>
              <input type="date" v-model="form.endDate" :disabled="!isEditable" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
            </div>
            <div v-if="![3].includes(form.categoryId)" class="space-y-1.5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hora evento</label>
              <input type="time" v-model="form.time" :disabled="!isEditable" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Plantel</label>
            <input type="text" v-model="form.plantel" :disabled="!isEditable" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
          </div>

          <div v-if="[2].includes(form.categoryId)" class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <input type="checkbox" id="regresoEdit" v-model="form.regreso" :disabled="!isEditable" class="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
            <label for="regresoEdit" class="text-sm font-bold text-slate-700 select-none cursor-pointer" :class="{'opacity-60 cursor-not-allowed': !isEditable}">El colaborador regresa al plantel</label>
          </div>

          <div v-if="form.regreso && [2].includes(form.categoryId)" class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hora regreso</label>
            <input type="time" v-model="form.horaRegreso" :disabled="!isEditable" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
          </div>

          <div v-if="form.categoryId === 5" class="space-y-4 p-4 bg-teal-50/50 rounded-xl border border-teal-100">
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Folio IMSS</label>
              <input type="text" v-model="form.imss" :disabled="!isEditable" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500" />
            </div>
            <div class="space-y-1.5">
              <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipo Incapacidad</label>
              <select v-model="form.tipoIncapacidad" :disabled="!isEditable" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium transition-all bg-white shadow-sm disabled:bg-slate-50 disabled:text-slate-500">
                <option value="Enfermedad en General">Enfermedad en General</option>
                <option value="Riesgo de Trabajo">Riesgo de Trabajo</option>
                <option value="Maternidad">Maternidad</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Motivo</label>
            <textarea v-model="form.comentarios" rows="3" :disabled="!isEditable" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-brand-500 outline-none text-sm font-medium transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500 resize-none"></textarea>
          </div>
        </form>

      </div>

      <footer class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
        <button v-if="isEditable" @click="handleCancel" :disabled="isSaving" class="px-4 py-2 text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors outline-none disabled:opacity-50 flex items-center gap-2">
          <Trash2 class="w-4 h-4" />
          Anular Pase
        </button>
        <div v-else></div>

        <div class="flex items-center gap-3">
          <button @click="$emit('close')" :disabled="isSaving" class="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors outline-none disabled:opacity-50">
            Cerrar
          </button>
          <button v-if="isEditable" type="submit" form="editPassForm" :disabled="isSaving" class="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all disabled:opacity-60 disabled:hover:bg-brand-600 flex items-center gap-2 outline-none">
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            <span>{{ isSaving ? 'Guardando...' : 'Actualizar Pase' }}</span>
          </button>
        </div>
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

const isOwner = computed(() => {
  return user.value && user.value.name === props.pass.user
})

// Strict editing rule: only the creator can edit/cancel, and only within 48 hours of pass date
const isEditable = computed(() => {
  if (!isOwner.value) return false
  if (props.pass.status === 'cancelado' || props.pass.status === 'rechazado') return false
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

const handleCancel = async () => {
  if (!confirm('¿Estás seguro de anular permanentemente este pase? Esta acción no se puede deshacer.')) return
  if (isSaving.value) return
  isSaving.value = true

  try {
    await $fetch(`/api/passes/${props.pass.id}/action`, {
      method: 'POST',
      body: { action: 'cancel' }
    })
    emit('updated')
    emit('close')
  } catch (error) {
    console.error('Cancel error:', error)
    alert(error?.data?.message || 'Ocurrió un error al intentar anular el registro.')
  } finally {
    isSaving.value = false
  }
}
</script>