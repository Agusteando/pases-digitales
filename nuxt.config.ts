export default defineNuxtConfig({
  devtools: { enabled: true },
  
  css: ['~/assets/css/main.css'],
  
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  modules: [
    '@nuxtjs/tailwindcss'
  ],

  // Ensure Nuxt builds perfectly for Vercel Serverless Functions
  nitro: {
    preset: 'vercel'
  },

  runtimeConfig: {
    // Private keys are only available on the server
    mysqlHost: process.env.MYSQL_HOST,
    mysqlUser: process.env.MYSQL_USER,
    mysqlPassword: process.env.MYSQL_PASSWORD,
    mysqlDatabase: process.env.MYSQL_DATABASE,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    jwtSecret: process.env.JWT_SECRET,
    signiaApiUrl: process.env.SIGNIA_API_URL || 'https://signia.casitaapps.com/api/export/employees',
    
    public: {
      // Keys available on both client and server
      googleClientIdPublic: process.env.GOOGLE_CLIENT_ID,
    }
  }
})