<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
    <div class="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 relative">
      
      <header class="px-8 py-6 border-b border-white/60 flex items-center justify-between bg-white/40 shrink-0 relative">
        <div class="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
        <div>
          <h3 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span class="font-mono text-iedis-teal-dark">#{{ String(pass.id).padStart(5, '0') }}</span>
            <span v-if="!isEditable" class="text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg bg-white shadow-sm text-slate-500 border border-white">Solo lectura</span>
          </h3>
          <p class="text-sm font-bold text-slate-500 mt-1.5">{{ pass.employee_name }}</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 bg-white shadow-sm hover:shadow-md p-2.5 rounded-full transition-all focus:outline-none border border-slate-100">
          <X class="w-5 h-5" />
        </button>
      </header>

      <div class="p-8 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-slate-50/30">
        
        <div v-if="!isEditable" class="bg-casita-gold/10 border border-casita-gold/30 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
          <Lock class="w-5 h-5 text-casita-gold-dark shrink-0 mt-0.5" />
          <div>
            <h4 class="text-sm font-black text-casita-gold-dark">Edición bloqueada</h4>
            <p class="text-xs text-casita-gold-dark/80 font-medium mt-1.5 leading-relaxed">
              La edición no está disponible. El pase ya fue resuelto, han pasado más de 48 horas o no cuenta con permisos de administrador.
            </p>
          </div>
        </div>

        <form @submit.prevent="handleSave" id="editPassForm" class="space-y-6">
          <div class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Categoría</label>
            <select v-model="form.categoryId" :disabled="!isEditable" class="w-full px-5 py-4 rounded-2xl border border-white/80 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold text-slate-900 transition-all bg-white/70 shadow-sm disabled:bg-slate-50/50 disabled:text-slate-500 cursor-pointer">
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
              <input type="date" v-model="form.date" :min="todayDate" :disabled="!isEditable" class="w-full px-5 py-4 rounded-2xl border border-white/80 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold transition-all bg-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] disabled:bg-slate-50/50 disabled:text-slate-500" />
            </div>
            <div v-if="[3, 5].includes(form.categoryId)" class="space-y-2">
              <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Hasta</label>
              <input type="date" v-model="form.endDate" :min="todayDate" :disabled="!isEditable" class="w-full px-5 py-4 rounded-2xl border border-white/80 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold transition-all bg-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] disabled:bg-slate-50/50 disabled:text-slate-500" />
            </div>
            <div v-if="![3].includes(form.categoryId)" class="space-y-2">
              <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Hora</label>
              <input type="time" v-model="form.time" :disabled="!isEditable" class="w-full px-5 py-4 rounded-2xl border border-white/80 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold transition-all bg-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] disabled:bg-slate-50/50 disabled:text-slate-500" />
            </div>
          </div>

          <!-- Edit Modal Subcategories (Category 3) -->
          <div v-if="form.categoryId === 3" class="space-y-3">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Clasificación de la ausencia</label>
            <div class="flex flex-wrap gap-3">
              <button 
                v-for="sub in ['Cuidados Maternos', 'Comisiones', 'Por Estudios', 'Por Embarazo', 'Por Definir', 'Permiso de Paternidad']" :key="sub"
                type="button"
                :disabled="!isEditable"
                @click="form.tipoPermiso = form.tipoPermiso === sub ? '' : sub"
                class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all border outline-none shadow-sm flex-1 sm:flex-none text-center disabled:opacity-50"
                :class="form.tipoPermiso === sub 
                  ? 'bg-casita-red/10 text-casita-red-dark border-casita-red/50 shadow-sm ring-1 ring-casita-red/30' 
                  : 'bg-white/60 text-slate-600 border-transparent shadow-sm hover:border-slate-300 hover:bg-white'"
              >
                {{ sub }}
              </button>
            </div>
          </div>

          <!-- Edit Modal Opciones (Category 4) -->
          <div v-if="form.categoryId === 4" class="space-y-3">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Tipo de cambio de horario</label>
            <div class="flex flex-col sm:flex-row gap-3">
              <button 
                v-for="opt in ['Permiso para salir temprano', 'Permiso para llegar tarde']" :key="opt"
                type="button"
                :disabled="!isEditable"
                @click="form.tipoPermiso = form.tipoPermiso === opt ? '' : opt"
                class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all border outline-none shadow-sm flex-1 text-center disabled:opacity-50"
                :class="form.tipoPermiso === opt 
                  ? 'bg-casita-gold/10 text-casita-gold-dark border-casita-gold/50 shadow-sm ring-1 ring-casita-gold/30' 
                  : 'bg-white/60 text-slate-600 border-transparent shadow-sm hover:border-slate-300 hover:bg-white'"
              >
                {{ opt }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Plantel</label>
            <input type="text" v-model="form.plantel" :disabled="!isEditable" class="w-full px-5 py-4 rounded-2xl border border-white/80 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold transition-all bg-white/70 shadow-sm disabled:bg-slate-50/50 disabled:text-slate-500" />
          </div>

          <div v-if="[2].includes(form.categoryId)" class="flex items-center gap-4 bg-white/60 p-5 rounded-2xl border border-white shadow-sm">
            <input type="checkbox" id="regresoEdit" v-model="form.regreso" :disabled="!isEditable" class="w-5 h-5 rounded text-iedis-teal border-slate-300 focus:ring-iedis-teal cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
            <label for="regresoEdit" class="text-sm font-bold text-slate-700 select-none cursor-pointer" :class="{'opacity-60 cursor-not-allowed': !isEditable}">Retorna en la misma jornada</label>
          </div>

          <div v-if="form.regreso && [2].includes(form.categoryId)" class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Hora de retorno</label>
            <input type="time" v-model="form.horaRegreso" :disabled="!isEditable" class="w-full px-5 py-4 rounded-2xl border border-white/80 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold transition-all bg-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] disabled:bg-slate-50/50 disabled:text-slate-500" />
          </div>

          <div v-if="form.categoryId === 5" class="space-y-5 p-6 bg-iedis-teal/5 rounded-3xl border border-iedis-teal/20 shadow-sm">
            <div class="space-y-2">
              <label class="block text-[11px] font-black text-iedis-teal-dark uppercase tracking-widest">Folio IMSS</label>
              <input type="text" v-model="form.imss" :disabled="!isEditable" class="w-full px-5 py-4 rounded-2xl border border-white focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-bold transition-all bg-white/80 shadow-sm disabled:bg-slate-50/50 disabled:text-slate-500" />
            </div>
            <div class="space-y-3">
              <label class="block text-[11px] font-black text-iedis-teal-dark uppercase tracking-widest">Tipo de incapacidad</label>
              <div class="flex flex-col sm:flex-row gap-3">
                <button 
                  v-for="tipo in ['Enfermedad general', 'Riesgo de trabajo', 'Maternidad']" :key="tipo"
                  type="button"
                  :disabled="!isEditable"
                  @click="form.tipoIncapacidad = tipo"
                  class="px-4 py-2.5 text-xs font-bold rounded-xl transition-all border outline-none shadow-sm flex-1 text-center disabled:opacity-50"
                  :class="form.tipoIncapacidad === tipo 
                    ? 'bg-iedis-teal/10 text-iedis-teal-dark border-iedis-teal/50 shadow-sm ring-1 ring-iedis-teal/30' 
                    : 'bg-white/60 text-slate-600 border-transparent shadow-sm hover:border-iedis-teal/30 hover:bg-white'"
                >
                  {{ tipo }}
                </button>
              </div>
            </div>
          </div>

          <!-- Evidence / File Upload -->
          <div v-if="[3, 5].includes(form.categoryId)" class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Paperclip class="w-3.5 h-3.5" /> Evidencia / Justificante
            </label>
            
            <div v-if="form.evidenceUrl && !evidenceFile" class="flex items-center justify-between p-5 bg-white/60 border border-white rounded-2xl shadow-sm">
              <div class="flex items-center gap-3">
                <ExternalLink class="w-5 h-5 text-brand-600" />
                <div>
                  <p class="text-sm font-black text-slate-800">Archivo adjunto actual</p>
                  <a :href="form.evidenceUrl" target="_blank" class="text-[10px] font-bold text-brand-600 hover:underline">Ver documento</a>
                </div>
              </div>
              <button v-if="isEditable" type="button" @click="form.evidenceUrl = null" class="text-xs font-bold text-casita-red hover:text-casita-red-dark bg-casita-red/10 px-3 py-1.5 rounded-lg transition-colors border border-casita-red/20 outline-none shadow-sm">
                Remover
              </button>
            </div>

            <div v-if="isEditable && !form.evidenceUrl" class="relative border-2 border-dashed border-white/80 hover:border-iedis-teal/50 bg-white/40 rounded-2xl p-6 transition-all text-center group" :class="{'border-iedis-teal bg-iedis-teal/5': evidenceFile}">
              <input type="file" @change="onFileChange" accept="image/*,application/pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div v-if="!evidenceFile" class="flex flex-col items-center gap-2">
                <UploadCloud class="w-6 h-6 text-slate-400 group-hover:text-iedis-teal transition-colors" />
                <span class="text-sm font-bold text-slate-600">Reemplazar o adjuntar archivo nuevo</span>
                <span class="text-[10px] font-medium text-slate-400">PDF, JPG o PNG (Max. 5MB)</span>
              </div>
              <div v-else class="flex items-center justify-between z-20 relative">
                <div class="flex items-center gap-3">
                   <FileText class="w-6 h-6 text-iedis-teal" />
                   <div class="text-left">
                      <p class="text-sm font-black text-slate-800 truncate max-w-[200px]">{{ evidenceFile.name }}</p>
                      <p class="text-[10px] font-bold text-slate-500">{{ (evidenceFile.size / 1024 / 1024).toFixed(2) }} MB</p>
                   </div>
                </div>
                <button type="button" @click.stop.prevent="evidenceFile = null" class="p-2 text-slate-400 hover:text-casita-red bg-white rounded-full shadow-sm relative z-20 transition-colors border border-transparent hover:border-casita-red/20 outline-none">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Justificación</label>
            <textarea v-model="form.comentarios" rows="3" :disabled="!isEditable" class="w-full px-5 py-4 rounded-2xl border border-white/80 focus:border-iedis-teal focus:ring-2 focus:ring-iedis-teal/20 outline-none text-sm font-medium transition-all bg-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] disabled:bg-slate-50/50 disabled:text-slate-500 resize-none"></textarea>
          </div>
        </form>

      </div>

      <footer class="px-8 py-6 bg-white/60 border-t border-white/80 flex items-center justify-end shrink-0 gap-4">
        <button @click="$emit('close')" :disabled="isSaving" class="px-6 py-3 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all outline-none disabled:opacity-50 border border-transparent hover:border-slate-200 shadow-sm">
          Cerrar
        </button>
        <button v-if="isEditable" type="submit" form="editPassForm" :disabled="isSaving" class="px-8 py-3 bg-gradient-to-r from-iedis-teal to-iedis-teal-dark text-white text-sm font-black rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2 outline-none">
          <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
          <span>{{ isSaving ? 'Guardando...' : 'Guardar cambios' }}</span>
        </button>
      </footer>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { X, Lock, Loader2, Trash2, Paperclip, UploadCloud, FileText, ExternalLink } from 'lucide-vue-next'
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
  tipoIncapacidad: '',
  tipoPermiso: '',
  evidenceUrl: null
})

const evidenceFile = ref(null)

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    alert('El archivo supera el tamaño máximo permitido (5MB).')
    e.target.value = ''
    return
  }
  evidenceFile.value = file
}

async function uploadFileToServer(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', `pases-evidencia/${dayjs().format('YYYY-MM')}`)
  formData.append('includeUrl', '1')

  const res = await fetch('https://expediente.casitaapps.com/upload.ashx', {
    method: 'POST',
    body: formData
  })
  if (!res.ok) throw new Error('Fallo al comunicarse con el servidor de expedientes.')
  const data = await res.json()
  if (!data.success) throw new Error('El servidor rechazó el archivo.')
  return data.url
}

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
      tipoIncapacidad: props.pass.tipo_incapacidad || '',
      tipoPermiso: props.pass.tipo_permiso || '',
      evidenceUrl: props.pass.evidence || null
    }
  }
})

const isSaving = ref(false)

const handleSave = async () => {
  if (!isEditable.value || isSaving.value) return
  isSaving.value = true

  let finalEvidenceUrl = form.value.evidenceUrl

  if (evidenceFile.value) {
    try {
      finalEvidenceUrl = await uploadFileToServer(evidenceFile.value)
    } catch (err) {
      alert('No se pudo subir la nueva evidencia adjunta. ' + err.message)
      isSaving.value = false
      return
    }
  }

  try {
    await $fetch(`/api/passes/${props.pass.id}`, {
      method: 'PUT',
      body: {
        ...form.value,
        evidence: finalEvidenceUrl
      }
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