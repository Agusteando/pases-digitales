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
})