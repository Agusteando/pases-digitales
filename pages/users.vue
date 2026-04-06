<template>
  <div class="p-6 md:p-10 max-w-[1400px] mx-auto h-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col">
    
    <header class="mb-10 shrink-0">
      <h1 class="text-3xl font-black text-slate-900 tracking-tight">Usuarios del Sistema</h1>
      <p class="text-slate-500 mt-2 text-sm font-bold">Monitoreo de operadores autenticados y gestión de roles administrativos.</p>
    </header>

    <div v-if="pending" class="py-20 flex justify-center flex-1">
      <Loader2 class="w-10 h-10 animate-spin text-brand-600" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 items-start content-start">
      <div v-for="sysUser in users" :key="sysUser.email" class="glass-card bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col gap-6 relative group">
        
        <div class="flex flex-col items-center text-center gap-3">
          <div class="relative shrink-0">
            <PremiumAvatar :src="sysUser.picture" :name="sysUser.name" size="lg" class="shrink-0 ring-4 ring-white shadow-sm" />
            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm z-30" title="Cuenta Activa"></div>
          </div>
          
          <div class="w-full mt-1">
            <h3 class="text-base font-black text-slate-900 truncate tracking-tight px-2">{{ sysUser.name }}</h3>
            <p class="text-[10px] font-bold text-slate-500 truncate mt-1 px-2">{{ sysUser.email }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="bg-brand-50 rounded-2xl p-3 border border-brand-100/50 flex flex-col justify-center items-center text-center">
            <span class="text-2xl font-black text-brand-700 font-mono leading-none mb-1">{{ sysUser.passesGenerated }}</span>
            <span class="text-[9px] font-black text-brand-600/70 uppercase tracking-widest">Generados</span>
          </div>
          <div class="bg-emerald-50 rounded-2xl p-3 border border-emerald-100/50 flex flex-col justify-center items-center text-center">
            <span class="text-2xl font-black text-emerald-700 font-mono leading-none mb-1">{{ sysUser.passesAuthorized }}</span>
            <span class="text-[9px] font-black text-emerald-600/70 uppercase tracking-widest">Resueltos</span>
          </div>
        </div>

        <div class="flex flex-col gap-4 mt-2 pt-5 border-t border-slate-100">
          <div class="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Último Acceso</span>
            <span class="text-slate-600">{{ new Date(sysUser.last_login).toLocaleDateString() }}</span>
          </div>
          <div class="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div class="flex items-center gap-2">
              <Shield class="w-4 h-4" :class="sysUser.is_admin ? 'text-brand-500' : 'text-slate-400'" />
              <span class="text-xs font-black text-slate-700">Administrador</span>
            </div>
            <button 
              @click="toggleAdmin(sysUser)"
              :disabled="sysUser.email === 'desarrollo.tecnologico@casitaiedis.edu.mx' || isToggling === sysUser.email"
              class="relative inline-flex h-6 w-11 items-center justify-center rounded-full transition-colors focus:outline-none disabled:opacity-50"
              :class="sysUser.is_admin ? 'bg-brand-600' : 'bg-slate-300'"
            >
              <span class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm" :class="sysUser.is_admin ? 'translate-x-2.5' : '-translate-x-2.5'"></span>
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
import PremiumAvatar from '~/components/PremiumAvatar.vue'

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