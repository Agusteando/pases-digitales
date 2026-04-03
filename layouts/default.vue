<template>
  <div class="min-h-[100dvh] bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
    
    <aside class="hidden md:flex w-20 bg-white border-r border-slate-200 flex-col items-center py-6 gap-6 z-40 shrink-0 sticky top-0 h-screen">
      <div class="w-12 h-12 bg-slate-900 rounded-xl shadow-sm flex items-center justify-center text-white font-bold text-lg select-none">
        PD
      </div>
      
      <nav class="flex flex-col gap-2 mt-4 w-full px-3 flex-1">
        <NuxtLink 
          to="/" 
          class="p-3 w-full rounded-xl flex justify-center transition-colors group"
          active-class="bg-slate-100 text-slate-900 font-semibold"
          :class="$route.path === '/' ? '' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
          title="Generar Pase"
        >
          <Plus class="w-5 h-5" />
        </NuxtLink>
        <NuxtLink 
          to="/analytics" 
          class="p-3 w-full rounded-xl flex justify-center transition-colors group"
          active-class="bg-slate-100 text-slate-900 font-semibold"
          :class="$route.path === '/analytics' ? '' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
          title="Historial y Métricas"
        >
          <BarChart2 class="w-5 h-5" />
        </NuxtLink>
      </nav>

      <div class="mt-auto pb-4 w-full px-3">
        <button @click="handleLogout" class="p-3 w-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl flex justify-center transition-colors group" title="Cerrar sesión">
          <LogOut class="w-5 h-5" />
        </button>
      </div>
    </aside>

    <main class="flex-1 w-full bg-slate-50 pb-[80px] md:pb-0">
      <slot />
    </main>

    <nav class="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 pb-safe pt-2 px-4 flex justify-around items-center z-50">
      <NuxtLink to="/" class="px-4 py-2 flex flex-col items-center gap-1 transition-colors" active-class="text-slate-900" :class="$route.path === '/' ? '' : 'text-slate-500'">
        <Plus class="w-5 h-5" />
        <span class="text-[10px] font-medium">Pases</span>
      </NuxtLink>
      <NuxtLink to="/analytics" class="px-4 py-2 flex flex-col items-center gap-1 transition-colors" active-class="text-slate-900" :class="$route.path === '/analytics' ? '' : 'text-slate-500'">
        <BarChart2 class="w-5 h-5" />
        <span class="text-[10px] font-medium">Métricas</span>
      </NuxtLink>
      <button @click="handleLogout" class="px-4 py-2 flex flex-col items-center gap-1 text-slate-500 transition-colors">
        <LogOut class="w-5 h-5" />
        <span class="text-[10px] font-medium">Salir</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { Plus, BarChart2, LogOut } from 'lucide-vue-next'
const { logout } = useAuth()

const handleLogout = async () => {
  await logout()
}
</script>