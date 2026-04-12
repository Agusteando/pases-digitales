<template>
  <div class="p-6 md:p-10 max-w-6xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    <header class="mb-8 shrink-0">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Sincronización Masiva de Identidad</h1>
      <p class="text-slate-500 mt-2 text-sm font-bold">
        Motor de resolución por lotes. Identifica nombres únicos sin CURP o ClaveUnica y aplica actualizaciones masivas.
      </p>
    </header>

    <!-- Top Control Panel & Live Stats -->
    <div class="glass-panel p-8 rounded-[2.5rem] border border-white/80 shadow-sm mb-6 shrink-0 transition-all">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div class="max-w-2xl">
          <h2 class="text-lg font-black text-slate-800">Panel de Ejecución</h2>
          <p class="text-sm font-medium text-slate-500 mt-1 leading-relaxed">
            Esta herramienta descarga el directorio SOAP una sola vez, lo indexa en memoria y resuelve los nombres únicos faltantes. Por cada coincidencia, ejecuta un único <code class="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">UPDATE</code> masivo, reduciendo drásticamente la carga sobre la base de datos.
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
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-white/60">
        <div class="bg-white/60 p-4 rounded-2xl border border-white shadow-sm text-center relative overflow-hidden">
          <span class="text-2xl font-black text-slate-800 relative z-10">{{ stats.totalUniqueNames }}</span>
          <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 relative z-10">Nombres Únicos</p>
        </div>
        <div class="bg-[#8EC152]/10 p-4 rounded-2xl border border-[#8EC152]/20 shadow-sm text-center relative overflow-hidden">
          <span class="text-2xl font-black text-[#00692F] relative z-10">{{ stats.matchesFound }}</span>
          <p class="text-[9px] font-black text-[#00692F]/70 uppercase tracking-widest mt-1 relative z-10">Resueltos (Éxito)</p>
        </div>
        <div class="bg-[#007F92]/10 p-4 rounded-2xl border border-[#007F92]/20 shadow-sm text-center relative overflow-hidden">
          <span class="text-2xl font-black text-[#006575] relative z-10">{{ stats.totalRowsUpdated }}</span>
          <p class="text-[9px] font-black text-[#006575]/70 uppercase tracking-widest mt-1 relative z-10">Filas Actualizadas</p>
        </div>
        <div class="bg-[#FCBF2C]/10 p-4 rounded-2xl border border-[#FCBF2C]/20 shadow-sm text-center relative overflow-hidden">
          <span class="text-2xl font-black text-[#6D5F24] relative z-10">{{ stats.ambiguousMatches }}</span>
          <p class="text-[9px] font-black text-[#6D5F24]/70 uppercase tracking-widest mt-1 relative z-10">Ambiguos</p>
        </div>
        <div class="bg-[#E83F4B]/10 p-4 rounded-2xl border border-[#E83F4B]/20 shadow-sm text-center relative overflow-hidden">
          <span class="text-2xl font-black text-[#762728] relative z-10">{{ stats.matchesNotFound }}</span>
          <p class="text-[9px] font-black text-[#762728]/70 uppercase tracking-widest mt-1 relative z-10">No Encontrados</p>
        </div>
      </div>

      <!-- Final Execution Time -->
      <div v-if="stats.executionTimeMs > 0" class="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <Clock class="w-3.5 h-3.5" />
        <span>Tiempo de ejecución: {{ (stats.executionTimeMs / 1000).toFixed(2) }} segundos</span>
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
          <div v-for="(log, i) in logs" :key="i" class="mb-1.5 break-words">
            <span class="text-slate-500 mr-2">[{{ formatTime(log.timestamp) }}]</span>
            <span v-if="log.type === 'info'" class="text-blue-400 font-bold">[INFO]</span>
            <span v-else-if="log.type === 'start_batch'" class="text-purple-400 font-bold">[BATCH]</span>
            <span v-else-if="log.type === 'process'" :class="getProcessColor(log.status)" class="font-bold">[PROC]</span>
            <span v-else-if="log.type === 'summary'" class="text-casita-green font-bold">[DONE]</span>
            <span v-else-if="log.type === 'error'" class="text-casita-red font-bold">[FAIL]</span>
            
            <span class="text-slate-300 ml-2">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <!-- Failed / Ambiguous List -->
      <div class="lg:col-span-2 glass-panel rounded-[2.5rem] border border-white/80 shadow-sm flex flex-col overflow-hidden">
        <div class="p-6 border-b border-white/60 bg-white/40 shrink-0">
          <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 text-[#E83F4B]" /> Requieren Revisión Manual ({{ reviewList.length }})
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
              <span class="text-[10px] font-bold uppercase tracking-widest" :class="item.status === 'ambiguous' ? 'text-[#D97746]' : 'text-[#E83F4B]'">
                {{ item.status === 'ambiguous' ? 'Coincidencia Ambigua' : 'Identidad no encontrada' }}
              </span>
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
  matchesFound: 0,
  matchesNotFound: 0,
  ambiguousMatches: 0,
  totalRowsUpdated: 0,
  executionTimeMs: 0
})

const resetState = () => {
  logs.value = []
  reviewList.value = []
  Object.assign(stats, {
    totalUniqueNames: 0, matchesFound: 0, matchesNotFound: 0,
    ambiguousMatches: 0, totalRowsUpdated: 0, executionTimeMs: 0
  })
}

const appendLog = async (logData) => {
  logs.value.push(logData)
  
  // Real-time metrics parsing
  if (logData.type === 'start_batch') {
    stats.totalUniqueNames = logData.total || 0
  } else if (logData.type === 'process') {
    if (logData.status === 'success') {
      stats.matchesFound++
      stats.totalRowsUpdated += (logData.affected || 0)
    } else if (logData.status === 'not_found' || logData.status === 'missing_data') {
      stats.matchesNotFound++
      reviewList.value.push({ name: logData.name, status: logData.status, message: logData.message })
    } else if (logData.status === 'ambiguous') {
      stats.ambiguousMatches++
      reviewList.value.push({ name: logData.name, status: logData.status, message: logData.message })
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
  if (!confirm('¿Iniciar sincronización masiva? Este proceso actualizará de forma masiva los registros históricos mediante resolución en memoria.')) return
  
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
      
      // Keep the last incomplete fragment in the buffer
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