import { useState } from '#app'

export const useAuth = () => {
  const user = useState('auth-user', () => null)

  const fetchUser = async () => {
    try {
      const data = await $fetch('/api/auth/user')
      user.value = data.user
    } catch (e) {
      user.value = null
    }
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    navigateTo('/login')
  }

  return { user, fetchUser, logout }
}