<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
    <!-- Ambient Background -->
    <div class="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

    <div class="glass-card w-full max-w-md p-10 rounded-[2.5rem] relative z-10 text-center">
      <div class="w-16 h-16 bg-slate-900 rounded-2xl shadow-xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-8">
        PD
      </div>
      <h1 class="text-3xl font-black text-slate-800 tracking-tight mb-2">Pases Digitales</h1>
      <p class="text-slate-500 font-medium text-sm mb-10">Gestión Integral y Control de Accesos</p>
      
      <div class="flex justify-center min-h-[40px]">
        <div id="google-btn-container" class="w-full flex justify-center"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
const config = useRuntimeConfig()
const { fetchUser } = useAuth()

onMounted(() => {
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: config.public.googleClientIdPublic,
      callback: async (response) => {
        try {
          await $fetch('/api/auth/login', {
            method: 'POST',
            body: { credential: response.credential }
          })
          await fetchUser()
          navigateTo('/')
        } catch (error) {
          console.error('Login failed')
        }
      }
    })
    window.google.accounts.id.renderButton(
      document.getElementById('google-btn-container'),
      { theme: 'outline', size: 'large', width: 280, shape: 'pill' }
    )
  }
})
</script>