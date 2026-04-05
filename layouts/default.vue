<template>
  <div class="min-h-[100dvh] flex flex-col md:flex-row">
    
    <!-- Sidebar / Desktop Navigation -->
    <aside class="hidden md:flex w-24 bg-white border-r border-slate-200 flex-col items-center py-8 gap-8 z-40 shrink-0 sticky top-0 h-screen shadow-sm">
      <div class="w-14 h-14 bg-gradient-to-br from-brand-500 to-indigo-700 rounded-2xl shadow-lg shadow-brand-500/30 flex items-center justify-center text-white font-black text-xl select-none ring-4 ring-brand-50">
        PD
      </div>
      
      <nav class="flex flex-col gap-3 mt-4 w-full px-4 flex-1">
        <NuxtLink 
          to="/" 
          class="p-3.5 w-full rounded-xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-50 text-brand-600 shadow-sm border border-brand-100"
          :class="$route.path === '/' ? '' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-transparent'"
          title="Generar Pase"
        >
          <Plus class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink 
          to="/history" 
          class="p-3.5 w-full rounded-xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-50 text-brand-600 shadow-sm border border-brand-100"
          :class="$route.path === '/history' ? '' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-transparent'"
          title="Historial y Búsqueda"
        >
          <History class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink 
          v-if="user?.is_admin"
          to="/analytics" 
          class="p-3.5 w-full rounded-xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-50 text-brand-600 shadow-sm border border-brand-100"
          :class="$route.path === '/analytics' ? '' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-transparent'"
          title="Métricas"
        >
          <BarChart2 class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink 
          v-if="user?.is_admin"
          to="/routing" 
          class="p-3.5 w-full rounded-xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-50 text-brand-600 shadow-sm border border-brand-100"
          :class="$route.path === '/routing' ? '' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-transparent'"
          title="Rutas y Contactos"
        >
          <Network class="w-6 h-6" />
        </NuxtLink>
        <NuxtLink 
          v-if="user?.is_admin"
          to="/users" 
          class="p-3.5 w-full rounded-xl flex justify-center transition-all group outline-none"
          active-class="bg-brand-50 text-brand-600 shadow-sm border border-brand-100"
          :class="$route.path === '/users' ? '' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-transparent'"
          title="Usuarios del Sistema"
        >
          <Shield class="w-6 h-6" />
        </NuxtLink>
      </nav>

      <div class="mt-auto pb-4 w-full px-4">
        <button @click="handleLogout" class="p-3.5 w-full text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl flex justify-center transition-colors group outline-none border border-transparent hover:border-red-100" title="Cerrar sesión">
          <LogOut class="w-6 h-6" />
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 w-full bg-slate-50/50 pb-[80px] md:pb-0 relative overflow-hidden">
      <!-- Decorative background blur -->
      <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none"></div>
      
      <div class="relative z-10 h-full">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 pb-safe pt-2 px-4 flex justify-around items-center z-50 shadow-lg">
      <NuxtLink to="/" class="px-2 py-2 flex flex-col items-center gap-1 transition-colors" active-class="text-brand-600" :class="$route.path === '/' ? '' : 'text-slate-500'">
        <Plus class="w-5 h-5" />
        <span class="text-[9px] font-bold">Pases</span>
      </NuxtLink>
      <NuxtLink to="/history" class="px-2 py-2 flex flex-col items-center gap-1 transition-colors" active-class="text-brand-600" :class="$route.path === '/history' ? '' : 'text-slate-500'">
        <History class="w-5 h-5" />
        <span class="text-[9px] font-bold">Historial</span>
      </NuxtLink>
      <NuxtLink v-if="user?.is_admin" to="/routing" class="px-2 py-2 flex flex-col items-center gap-1 transition-colors" active-class="text-brand-600" :class="$route.path === '/routing' ? '' : 'text-slate-500'">
        <Network class="w-5 h-5" />
        <span class="text-[9px] font-bold">Rutas</span>
      </NuxtLink>
      <NuxtLink v-if="user?.is_admin" to="/users" class="px-2 py-2 flex flex-col items-center gap-1 transition-colors" active-class="text-brand-600" :class="$route.path === '/users' ? '' : 'text-slate-500'">
        <Shield class="w-5 h-5" />
        <span class="text-[9px] font-bold">Usuarios</span>
      </NuxtLink>
      <button @click="handleLogout" class="px-2 py-2 flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-red-600">
        <LogOut class="w-5 h-5" />
        <span class="text-[9px] font-bold">Salir</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { Plus, BarChart2, History, Network, Shield, LogOut } from 'lucide-vue-next'
const { user, logout } = useAuth()

const handleLogout = async () => {
  await logout()
}
</script>