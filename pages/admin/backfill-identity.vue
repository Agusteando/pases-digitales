<template>
  <div class="p-6 md:p-10 max-w-[1400px] mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    <header class="mb-8 shrink-0">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Sincronización Masiva de Identidad</h1>
      <p class="text-slate-500 mt-2 text-sm font-bold">
        Motor de resolución por lotes. Identifica nombres únicos sin CURP o ClaveUnica y aplica actualizaciones masivas.
      </p>
    </header>

    <!-- Top Control Panel & Live Stats -->
    <div class="glass-panel p-8 rounded-[2.5rem] border border-white/80 shadow-sm mb-6 shrink-0 transition-all">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div class="max-w-3xl">
          <h2 class="text-lg font-black text-slate-800">Panel de Ejecución de Dos Fases</h2>
          <p class="text-sm font-medium text-slate-500 mt-1 leading-relaxed">
            <strong>Fase 1:</strong> Búsqueda exacta indexada en memoria. <br/>
            <strong>Fase 2 (Fallback):</strong> Para los nombres no resueltos, aplica una búsqueda determinista por contención de tokens (ignorando orden y palabras cortas). <br/>
            Por cada coincidencia, ejecuta un único <code class="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">UPDATE</code> masivo, optimizando el rendimiento.
          </p>
        </div>
        <button 
          @click="startBackfill" 
          :disabled="isRunning" 
          class="px-6 py-3.5 bg-gradient-to-r from-[#007F92] to-[#006575] hover:from-[#006575] hover:to-[#00497B] text-white font-black rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 outline-none shrink-0 min-w-[200px]"
        >
          <Loader2 v-if="isRunning" class="w-5 h-5 animate-spin" />
          <Database v-else class="w-5 h-5" />
          <span>{{ isRunning ? 'Procesando lote...' : 'Iniciar Backfill Masivo' }}</span>
        </button>
      </div>
      
      <!-- Live Metrics Dashboard -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/60">
        <!-- Global Stats -->
        <div class="col-span-2 md:col-span-1 bg-white/60 p-5 rounded-[1.5rem] border border-white shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <span class="text-3xl font-black text-slate-800 relative z-10">{{ stats.totalUniqueNames }}</span>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 relative z-10">Nombres Únicos</p>
          
          <div class="w-full h-px bg-slate-200/60 my-3"></div>
          
          <span class="text-2xl font-black text-[#006575] relative z-10">{{ stats.totalRowsUpdated }}</span>
          <p class="text-[9px] font-black text-[#006575]/70 uppercase tracking-widest mt-1 relative z-10">Total Filas Actualizadas</p>
        </div>

        <!-- Fase 1 Stats -->
        <div class="col-span-2 md:col-span-1 bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-200/50 shadow-sm relative overflow-hidden">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Fase 1 (Exacta)</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-600">Resueltos</span>
              <span class="text-sm font-black text-[#00692F]">{{ stats.p1MatchesFound }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-600">Ambiguos</span>
              <span class="text-sm font-black text-[#6D5F24]">{{ stats.p1Ambiguous }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-600">No Encontrados</span>
              <span class="text-sm font-black text-[#762728]">{{ stats.p1MatchesNotFound }}</span>
            </div>
          </div>
        </div>

        <!-- Fase 2 Stats -->
        <div class="col-span-2 md:col-span-1 bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-200/50 shadow-sm relative overflow-hidden">
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-2">Fase 2 (Tokens)</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-600">Nuevos Resueltos</span>
              <span class="text-sm font-black text-[#00692F]">{{ stats.p2MatchesFound }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-600">Ambiguos</span>
              <span class="text-sm font-black text-[#6D5F24]">{{ stats.p2Ambiguous }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-slate-600">Aún No Encontrados</span>
              <span class="text-sm font-black text-[#762728]">{{ stats.p2MatchesNotFound }}</span>
            </div>
          </div>
        </div>

        <!-- Remaining Unresolved -->
        <div class="col-span-2 md:col-span-1 bg-[#E83F4B]/5 p-5 rounded-[1.5rem] border border-[#E83F4B]/20 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <span class="text-3xl font-black text-[#762728] relative z-10">{{ stats.p2MatchesNotFound + stats.p2Ambiguous }}</span>
          <p class="text-[10px] font-black text-[#762728]/70 uppercase tracking-widest mt-1 relative z-10">Total Sin Resolver</p>
          <p class="text-[9px] font-medium text-[#762728]/60 mt-2 max-w-[150px] leading-tight">Requieren corrección manual en el origen.</p>
        </div>
      </div>

      <!-- Final Execution Time -->
      <div v-if="stats.executionTimeMs > 0" class="mt-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/40 w-max mx-auto px-4 py-1.5 rounded-full border border-white shadow-sm">
        <Clock class="w-3.5 h-3.5" />
        <span>Tiempo total de ejecución: {{ (stats.executionTimeMs / 1000).toFixed(2) }} segundos</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-[400px]">
      
      <!-- Terminal Emulator for Live Stream -->
      <div class="lg:col-span-3 bg-slate-900 rounded-[2.5rem] p-6 shadow-xl border border-slate-800 flex flex-col overflow-hidden relative">
        <div class="flex items-center gap-2 mb-4 shrink-0 px-2">
          <div class="w-3 h-3 rounded-full bg-casita-red"></div>
          <div class="w-3 h-3 rounded-full bg-casita-gold"></div>
          <div class="w-3 h-3 rounded-full bg-casita-green"></div>
          <span class="ml-2 text-xs font-mono text-slate-500 font-bold">registro_ejecucion.log</span>
        </div>
        
        <div ref="terminalContainer" class="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-relaxed pr-2 scroll-smooth">
          <div v-if="logs.length === 0" class="text-slate-600 italic">Esperando inicio de proceso...</div>
          <div v-for="(log, i) in logs" :key="i" class="mb-1.5 break-words flex gap-2">
            <span class="text-slate-500 shrink-0">[{{ formatTime(log.timestamp) }}]</span>
            
            <span v-if="log.type === 'info'" class="text-blue-400 font-bold shrink-0">[INFO]</span>
            <span v-else-if="log.type === 'start_phase1'" class="text-purple-400 font-bold shrink-0">[PHASE_1]</span>
            <span v-else-if="log.type === 'start_phase2'" class="text-orange-400 font-bold shrink-0">[PHASE_2]</span>
            <span v-else-if="log.type === 'process1' || log.type === 'process2'" :class="getProcessColor(log.status)" class="font-bold shrink-0">
              [{{ log.type === 'process1' ? 'P1' : 'P2' }}]
            </span>
            <span v-else-if="log.type === 'summary'" class="text-casita-green font-bold shrink-0">[DONE]</span>
            <span v-else-if="log.type === 'error'" class="text-casita-red font-bold shrink-0">[FAIL]</span>
            
            <span class="text-slate-300 flex-1">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <!-- Failed / Ambiguous List -->
      <div class="lg:col-span-2 glass-panel rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col overflow-hidden">
        <div class="p-6 border-b border-white/60 bg-white/40 shrink-0">
          <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-[#E83F4B]" /> Aún Sin Resolver ({{ reviewList.length }})
          </h3>
        </div>
        <div class="overflow-y-auto custom-scrollbar flex-1 bg-white/30 p-2">
          <div v-if="reviewList.length === 0" class="text-center py-12 text-slate-400">
            <CheckCircle2 class="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p class="text-xs font-bold uppercase tracking-widest">Sin registros pendientes</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="(item, idx) in reviewList" :key="idx" class="p-4 bg-white/80 rounded-2xl shadow-sm border border-white flex flex-col gap-1">
              <span class="text-sm font-black text-slate-800">{{ item.name }}</span>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm" :class="item.phase === 'process1' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-orange-100 text-orange-700 border-orange-200'">
                  Fase {{ item.phase === 'process1' ? '1' : '2' }}
                </span>
                <span class="text-[9px] font-black uppercase tracking-widest" :class="item.status === 'ambiguous' ? 'text-[#D97746]' : 'text-[#E83F4B]'">
                  {{ item.status === 'ambiguous' ? 'Ambigüedad' : 'No Encontrado' }}
                </span>
              </div>
              <span class="text-xs text-slate-500 mt-1 font-medium leading-snug">{{ item.message }}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { Database, Loader2, AlertTriangle, Clock, CheckCircle2 } from 'lucide-vue-next'

const isRunning = ref(false)
const terminalContainer = ref(null)
const logs = ref([])
const reviewList = ref([])

const stats = reactive({
  totalUniqueNames: 0,
  p1MatchesFound: 0,
  p1MatchesNotFound: 0,
  p1Ambiguous: 0,
  p2MatchesFound: 0,
  p2MatchesNotFound: 0,
  p2Ambiguous: 0,
  totalRowsUpdated: 0,
  executionTimeMs: 0
})

const resetState = () => {
  logs.value = []
  reviewList.value = []
  Object.assign(stats, {
    totalUniqueNames: 0, 
    p1MatchesFound: 0, p1MatchesNotFound: 0, p1Ambiguous: 0,
    p2MatchesFound: 0, p2MatchesNotFound: 0, p2Ambiguous: 0,
    totalRowsUpdated: 0, executionTimeMs: 0
  })
}

const appendLog = async (logData) => {
  logs.value.push(logData)
  
  // Real-time metrics parsing
  if (logData.type === 'start_phase1') {
    stats.totalUniqueNames = logData.total || 0
  } else if (logData.type === 'process1') {
    if (logData.status === 'success') {
      stats.p1MatchesFound++
      stats.totalRowsUpdated += (logData.affected || 0)
    } else if (logData.status === 'not_found' || logData.status === 'missing_data') {
      stats.p1MatchesNotFound++
    } else if (logData.status === 'ambiguous') {
      stats.p1Ambiguous++
    }
  } else if (logData.type === 'process2') {
    if (logData.status === 'success') {
      stats.p2MatchesFound++
      stats.totalRowsUpdated += (logData.affected || 0)
      // Remove from review list if it was placed there in Phase 1
      reviewList.value = reviewList.value.filter(item => item.name !== logData.name)
    } else if (logData.status === 'not_found' || logData.status === 'missing_data') {
      stats.p2MatchesNotFound++
      reviewList.value.push({ name: logData.name, phase: 'process2', status: logData.status, message: logData.message })
    } else if (logData.status === 'ambiguous') {
      stats.p2Ambiguous++
      reviewList.value.push({ name: logData.name, phase: 'process2', status: logData.status, message: logData.message })
    }
  } else if (logData.type === 'summary') {
    stats.executionTimeMs = logData.executionTimeMs || 0
  }

  await nextTick()
  if (terminalContainer.value) {
    terminalContainer.value.scrollTop = terminalContainer.value.scrollHeight
  }
}

const startBackfill = async () => {
  if (!confirm('¿Iniciar sincronización masiva en dos fases? El proceso identificará identidades exactas y utilizará contención de tokens como contingencia.')) return
  
  isRunning.value = true
  resetState()

  try {
    const response = await fetch('/api/admin/backfill-identity', {
      method: 'POST',
      headers: { 'Accept': 'application/x-ndjson' }
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || 'Error al conectar con el motor de sincronización.')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line)
            await appendLog(data)
          } catch (e) {
            console.warn('Error parsing NDJSON line:', line)
          }
        }
      }
    }
  } catch (error) {
    appendLog({ type: 'error', timestamp: Date.now(), message: error.message })
    alert(error.message)
  } finally {
    isRunning.value = false
  }
}

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}.${String(d.getMilliseconds()).padStart(3,'0')}`
}

const getProcessColor = (status) => {
  if (status === 'success') return 'text-[#8EC152]'
  if (status === 'not_found' || status === 'missing_data') return 'text-[#E83F4B]'
  if (status === 'ambiguous') return 'text-[#FCBF2C]'
  return 'text-slate-300'
}
</script>