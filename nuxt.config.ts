export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  
  css: ['~/assets/css/main.css'],
  
  build: {
    transpile: ['lucide-vue-next']
  },

  vite: {
    optimizeDeps: {
      exclude: ['mysql2', 'googleapis', 'google-auth-library']
    }
  },

  nitro: {
    preset: 'vercel'
  },

  app: {
    head: {
      title: 'Pases Digitales',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover' },
        { name: 'theme-color', content: '#ffffff' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      script: [
        { src: 'https://accounts.google.com/gsi/client', async: true, defer: true }
      ]
    }
  },

  runtimeConfig: {
    mysqlHost: process.env.MYSQL_HOST,
    mysqlUser: process.env.MYSQL_USER,
    mysqlPassword: process.env.MYSQL_PASSWORD,
    mysqlDatabase: process.env.MYSQL_DATABASE,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    jwtSecret: process.env.JWT_SECRET,
    signiaApiUrl: process.env.SIGNIA_API_URL || 'https://signia.casitaapps.com/api/export/employees',
    googleWorkspaceAdminEmail: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL,
    googleSaClientEmail: process.env.GOOGLE_SA_CLIENT_EMAIL,
    googleSaPrivateKey: process.env.GOOGLE_SA_PRIVATE_KEY,
    
    public: {
      googleClientIdPublic: process.env.GOOGLE_CLIENT_ID,
    }
  }
})