import { useState } from '#app'

export const useAuth = () => {
  const user = useState('auth-user', () => null)

  const fetchUser = async () => {
    try {
      const data = await $fetch('/api/auth/user', {
        headers: useRequestHeaders(['cookie']) as Record<string, string>
      })
      user.value = data?.user || null
    } catch (e) {
      user.value = null
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
      await navigateTo('/login', { replace: true })
    }
  }

  return { user, fetchUser, logout }
}