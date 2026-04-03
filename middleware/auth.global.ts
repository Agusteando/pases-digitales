export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie('auth-token')
  
  if (to.path === '/login') {
    if (token.value) {
      return navigateTo('/', { replace: true })
    }
    return
  }

  if (!token.value) {
    return navigateTo('/login', { replace: true })
  }

  const { user, fetchUser } = useAuth()
  if (!user.value) {
    await fetchUser()
  }

  if (!user.value) {
    return navigateTo('/login', { replace: true })
  }
})