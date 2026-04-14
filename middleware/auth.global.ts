export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie('auth-token')
  const redirectCookie = useCookie('auth-redirect', { maxAge: 300 })
  
  if (to.path === '/login') {
    if (token.value) {
      const redirect = redirectCookie.value || '/'
      redirectCookie.value = null
      return navigateTo(redirect, { replace: true })
    }
    return
  }

  if (!token.value) {
    if (to.path !== '/') redirectCookie.value = to.fullPath
    return navigateTo('/login', { replace: true })
  }

  const { user, fetchUser } = useAuth()
  if (!user.value) {
    await fetchUser()
  }

  if (!user.value) {
    if (to.path !== '/') redirectCookie.value = to.fullPath
    return navigateTo('/login', { replace: true })
  }

  const adminRoutes = ['/analytics', '/routing', '/users', '/notifications']
  if (adminRoutes.some(r => to.path.startsWith(r)) && !user.value.is_admin) {
    return navigateTo('/', { replace: true })
  }

  if (to.path.startsWith('/reports') && !user.value.is_admin) {
    let hasAccess = false
    try {
      const headers = process.server ? useRequestHeaders(['cookie']) as Record<string, string> : undefined
      const profile: any = await $fetch('/api/auth/profile', { headers })
      if (profile?.is_admon) hasAccess = true
    } catch (e) {}
    
    if (!hasAccess) {
      return navigateTo('/', { replace: true })
    }
  }
})