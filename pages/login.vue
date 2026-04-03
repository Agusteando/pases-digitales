<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
    <div class="w-full max-w-sm bg-white p-8 rounded-2xl shadow-card border border-slate-200 text-center relative">
      
      <div v-if="isProcessing" class="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-20">
        <Loader2 class="w-6 h-6 animate-spin text-slate-900 mb-2" />
        <span class="text-sm font-medium text-slate-600">Iniciando sesión...</span>
      </div>

      <div class="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 select-none">
        PD
      </div>
      
      <h1 class="text-2xl font-bold text-slate-900 mb-2">Pases Digitales</h1>
      <p class="text-slate-500 text-sm mb-8">
        Herramienta interna para la gestión operativa y registro de incidencias.
      </p>
      
      <div class="flex justify-center min-h-[44px]">
        <div id="google-btn-container" class="w-full flex justify-center"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const config = useRuntimeConfig()
const isProcessing = ref(false)

definePageMeta({ layout: false })

onMounted(() => {
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: config.public.googleClientIdPublic,
      callback: async (response) => {
        isProcessing.value = true
        try {
          await $fetch('/api/auth/login', {
            method: 'POST',
            body: { credential: response.credential }
          })
          const { fetchUser } = useAuth()
          await fetchUser() // Hydrate user immediately into state
          await navigateTo('/', { replace: true }) // Navigate using router
        } catch (error) {
          console.error('Auth error:', error)
          isProcessing.value = false
        }
      }
    })
    
    window.google.accounts.id.renderButton(
      document.getElementById('google-btn-container'),
      { theme: 'outline', size: 'large', width: 280, text: 'continue_with', shape: 'rectangular' }
    )
  }
})
</script>