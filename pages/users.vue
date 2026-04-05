<template>
  <div class="p-6 md:p-10 max-w-7xl mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    
    <header class="mb-8 shrink-0">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Usuarios del Sistema</h1>
      <p class="text-slate-500 mt-2 text-sm font-medium">Monitoreo de operadores autenticados y gestión de roles administrativos.</p>
    </header>

    <div v-if="pending" class="py-16 flex justify-center flex-1">
      <Loader2 class="w-8 h-8 animate-spin text-brand-600" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 items-start content-start">
      <div v-for="sysUser in users" :key="sysUser.email" class="glass-card bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-5 relative group">
        
        <div class="flex items-start gap-4">
          <div class="relative shrink-0">
            <img v-if="sysUser.picture" :src="sysUser.picture" class="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md bg-white" />
            <div v-else class="w-14 h-14 rounded-full bg-brand-100 border-2 border-white shadow-md flex items-center justify-center font-black text-brand-700 text-lg">
              {{ sysUser.name.slice(0, 2).toUpperCase() }}
            </div>
            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" title="Cuenta Activa"></div>
          </div>
          
          <div class="flex-1 min-w-0 pt-1">
            <h3 class="text-base font-black text-slate-900 truncate tracking-tight">{{ sysUser.name }}</h3>
            <p class="text-[11px] font-medium text-slate-500 truncate mt-0.5">{{ sysUser.email }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <div class="bg-brand-50/50 rounded-xl p-3 border border-brand-100/50 flex flex-col justify-center items-center text-center">
            <span class="text-xl font-black text-brand-700 font-mono leading-none mb-1">{{ sysUser.passesGenerated }}</span>
            <span class="text-[9px] font-bold text-brand-600/80 uppercase tracking-widest">Generados</span>
          </div>
          <div class="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50 flex flex-col justify-center items-center text-center">
            <span class="text-xl font-black text-emerald-700 font-mono leading-none mb-1">{{ sysUser.passesAuthorized }}</span>
            <span class="text-[9px] font-bold text-emerald-600/80 uppercase tracking-widest">Autorizados</span>
          </div>
        </div>

        <div class="flex flex-col gap-3 mt-2 pt-4 border-t border-slate-100">
          <div class="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            <span>Último Acceso</span>
            <span class="text-slate-600">{{ new Date(sysUser.last_login).toLocaleString() }}</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Shield class="w-4 h-4 text-slate-400" />
              <span class="text-xs font-bold text-slate-600">Acceso Administrador</span>
            </div>
            <button 
              @click="toggleAdmin(sysUser)"
              :disabled="sysUser.email === 'desarrollo.tecnologico@casitaiedis.edu.mx' || isToggling === sysUser.email"
              class="relative inline-flex h-5 w-9 items-center justify-center rounded-full transition-colors focus:outline-none disabled:opacity-50"
              :class="sysUser.is_admin ? 'bg-brand-600' : 'bg-slate-200'"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm" :class="sysUser.is_admin ? 'translate-x-2' : '-translate-x-2'"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Loader2, Shield } from 'lucide-vue-next'

const { data: users, pending } = useFetch('/api/users/stats')
const isToggling = ref(null)

const toggleAdmin = async (u) => {
  if (u.email === 'desarrollo.tecnologico@casitaiedis.edu.mx') return
  isToggling.value = u.email
  try {
    await $fetch(`/api/users/${encodeURIComponent(u.email)}/admin`, {
      method: 'PUT',
      body: { is_admin: !u.is_admin }
    })
    u.is_admin = !u.is_admin
  } catch(e) {
    alert('Fallo al actualizar el rol del usuario.')
  } finally {
    isToggling.value = null
  }
}
</script>