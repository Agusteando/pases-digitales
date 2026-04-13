<template>
  <div class="min-h-[100dvh] flex flex-col md:flex-row bg-transparent relative">
    
    <!-- Sidebar / Desktop Navigation -->
    <aside class="hidden md:flex w-24 bg-white/40 backdrop-blur-2xl border-r border-white/60 flex-col items-center py-8 gap-8 z-40 shrink-0 sticky top-0 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div class="w-14 h-14 bg-white/80 rounded-[1.25rem] shadow-sm flex items-center justify-center p-2.5 ring-1 ring-white relative group backdrop-blur-sm">
        <div class="absolute inset-0 bg-gradient-to-tr from-casita-green-light/30 to-iedis-teal/30 rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
        <img src="/pases.png" alt="Pases Digitales" class="w-full h-full object-contain relative z-10" />
      </div>
      
      <nav class="flex flex-col gap-4 mt-4 w-full px-4 flex-1">
        <NuxtLink 
          to="/" 
          class="p-3.5 w-full rounded-2xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-600 text-white shadow-md shadow-brand-500/20"
          :class="$route.path === '/' ? '' : 'text-slate-400 hover:bg-white hover:text-brand-600 shadow-sm'"
          title="Generar pase"
        >
          <Plus class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink 
          to="/history" 
          class="p-3.5 w-full rounded-2xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-600 text-white shadow-md shadow-brand-500/20"
          :class="$route.path === '/history' ? '' : 'text-slate-400 hover:bg-white hover:text-brand-600 shadow-sm'"
          title="Historial"
        >
          <History class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink 
          v-if="user?.is_admin"
          to="/kardex" 
          class="p-3.5 w-full rounded-2xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-600 text-white shadow-md shadow-brand-500/20"
          :class="$route.path === '/kardex' ? '' : 'text-slate-400 hover:bg-white hover:text-brand-600 shadow-sm'"
          title="Kardex de Asistencia"
        >
          <CalendarDays class="w-6 h-6" />
        </NuxtLink>
        
        <!-- Nueva Sección: Reporte de Personal (R.P.) -->
        <NuxtLink 
          v-if="hasReportsAccess"
          to="/reports" 
          class="p-3.5 w-full rounded-2xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-600 text-white shadow-md shadow-brand-500/20"
          :class="$route.path === '/reports' ? '' : 'text-slate-400 hover:bg-white hover:text-brand-600 shadow-sm'"
          title="Reportes de Personal (R.P.)"
        >
          <FileSpreadsheet class="w-6 h-6" />
        </NuxtLink>

        <NuxtLink 
          v-if="user?.is_admin"
          to="/analytics" 
          class="p-3.5 w-full rounded-2xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-600 text-white shadow-md shadow-brand-500/20"
          :class="$route.path === '/analytics' ? '' : 'text-slate-400 hover:bg-white hover:text-brand-600 shadow-sm'"
          title="Estadísticas"
        >
          <BarChart2 class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink 
          v-if="user?.is_admin"
          to="/routing" 
          class="p-3.5 w-full rounded-2xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-600 text-white shadow-md shadow-brand-500/20"
          :class="$route.path === '/routing' ? '' : 'text-slate-400 hover:bg-white hover:text-brand-600 shadow-sm'"
          title="Configuración de envíos"
        >
          <BellRing class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink 
          v-if="user?.is_admin"
          to="/users" 
          class="p-3.5 w-full rounded-2xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-600 text-white shadow-md shadow-brand-500/20"
          :class="$route.path === '/users' ? '' : 'text-slate-400 hover:bg-white hover:text-brand-600 shadow-sm'"
          title="Usuarios"
        >
          <Shield class="w-6 h-6" />
        </NuxtLink>
      </nav>

      <div class="mt-auto pb-4 w-full px-4 flex flex-col items-center gap-6">
        <img src="/id.png" alt="Institucional" class="w-8 opacity-50 hover:opacity-100 transition-opacity drop-shadow-sm mix-blend-multiply" />
        <button @click="handleLogout" class="p-3.5 w-full text-slate-400 hover:text-red-600 hover:bg-white rounded-2xl flex justify-center transition-all group outline-none shadow-sm" title="Cerrar sesión">
          <LogOut class="w-6 h-6" />
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 w-full bg-transparent pb-[80px] md:pb-0 relative z-10 overflow-x-hidden md:overflow-hidden">
      <div class="relative z-10 h-auto md:h-full">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="md:hidden fixed bottom-0 w-full bg-white/70 backdrop-blur-2xl border-t border-white/80 pb-safe pt-2 px-4 flex justify-around items-center z-50 shadow-[0_-4px_30px_rgba(0,0,0,0.05)]">
      <NuxtLink to="/" class="px-2 py-2 flex flex-col items-center gap-1.5 transition-colors" active-class="text-brand-600" :class="$route.path === '/' ? '' : 'text-slate-400'">
        <Plus class="w-5 h-5" />
        <span class="text-[10px] font-bold">Pases</span>
      </NuxtLink>
      <NuxtLink to="/history" class="px-2 py-2 flex flex-col items-center gap-1.5 transition-colors" active-class="text-brand-600" :class="$route.path === '/history' ? '' : 'text-slate-400'">
        <History class="w-5 h-5" />
        <span class="text-[10px] font-bold">Historial</span>
      </NuxtLink>
      <NuxtLink v-if="hasReportsAccess" to="/reports" class="px-2 py-2 flex flex-col items-center gap-1.5 transition-colors" active-class="text-brand-600" :class="$route.path === '/reports' ? '' : 'text-slate-400'">
        <FileSpreadsheet class="w-5 h-5" />
        <span class="text-[10px] font-bold">Reportes</span>
      </NuxtLink>
      <NuxtLink v-if="user?.is_admin" to="/routing" class="px-2 py-2 flex flex-col items-center gap-1.5 transition-colors" active-class="text-brand-600" :class="$route.path === '/routing' ? '' : 'text-slate-400'">
        <BellRing class="w-5 h-5" />
        <span class="text-[10px] font-bold">Avisos</span>
      </NuxtLink>
      <button @click="handleLogout" class="px-2 py-2 flex flex-col items-center gap-1.5 text-slate-400 transition-colors hover:text-red-600">
        <LogOut class="w-5 h-5" />
        <span class="text-[10px] font-bold">Salir</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, BarChart2, History, BellRing, Shield, LogOut, CalendarDays, FileSpreadsheet } from 'lucide-vue-next'

const { user, logout } = useAuth()
const { data: profile } = useFetch('/api/auth/profile')

const hasReportsAccess = computed(() => {
  return user.value?.is_admin || (profile.value?.authorizedPlanteles && profile.value.authorizedPlanteles.length > 0)
})

const handleLogout = async () => {
  await logout()
}
</script>