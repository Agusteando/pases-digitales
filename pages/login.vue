<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans relative overflow-hidden">
    
    <!-- Premium Decorative Blurs -->
    <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-200/40 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[100px] pointer-events-none"></div>

    <div class="w-full max-w-[400px] glass-card p-12 rounded-[2.5rem] shadow-2xl border border-white/80 relative z-10 text-center transition-all duration-500">
      
      <div v-if="isProcessing" class="absolute inset-0 bg-white/95 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center z-20">
        <Loader2 class="w-10 h-10 animate-spin text-brand-600 mb-5" />
        <span class="text-sm font-black text-slate-800 tracking-tight">Validando credenciales...</span>
      </div>

      <div class="w-24 h-24 bg-gradient-to-br from-brand-500 to-indigo-700 rounded-[1.5rem] shadow-xl shadow-brand-500/30 flex items-center justify-center text-white font-black text-4xl mx-auto mb-10 select-none ring-8 ring-white">
        PD
      </div>
      
      <h1 class="text-3xl font-black text-slate-900 mb-3 tracking-tight">Pases Digitales</h1>
      <p class="text-slate-500 text-sm font-bold mb-12 leading-relaxed">
        Inicia sesión con tu cuenta institucional.
      </p>
      
      <div class="flex justify-center min-h-[44px]">
        <div id="google-btn-container" class="w-full flex justify-center drop-shadow-sm"></div>
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
  const initGoogle = () => {
    // Prevent rendering attempts if the Google SDK script has not finished downloading
    if (window.google && window.google.accounts && window.google.accounts.id) {
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
            await fetchUser()
            
            const redirectCookie = useCookie('auth-redirect')
            const redirect = redirectCookie.value || '/'
            redirectCookie.value = null
            
            await navigateTo(redirect, { replace: true })
          } catch (error) {
            console.error('Auth error:', error)
            isProcessing.value = false
          }
        }
      })
      
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn-container'),
        { theme: 'outline', size: 'large', width: 280, text: 'continue_with', shape: 'pill' }
      )
    } else {
      // Loop seamlessly until hydration is complete to guarantee initial render
      setTimeout(initGoogle, 100)
    }
  }

  initGoogle()
})
</script>