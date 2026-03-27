import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const masterPassword = ref('')
  const gistId = ref('')

  const isAuthenticated = computed(() => !!token.value && !!masterPassword.value)

  function setToken(newToken) {
    token.value = newToken
  }

  function setMasterPassword(password) {
    masterPassword.value = password
  }

  function setGistId(id) {
    gistId.value = id
  }

  function logout() {
    token.value = ''
    masterPassword.value = ''
    gistId.value = ''
    localStorage.removeItem('pm_token')
    localStorage.removeItem('pm_gist_id')
  }

  function loadFromStorage() {
    const savedToken = localStorage.getItem('pm_token')
    const savedGistId = localStorage.getItem('pm_gist_id')
    if (savedToken) token.value = savedToken
    if (savedGistId) gistId.value = savedGistId
  }

  function saveTokenToStorage() {
    localStorage.setItem('pm_token', token.value)
    localStorage.setItem('pm_gist_id', gistId.value)
  }

  return {
    token,
    masterPassword,
    gistId,
    isAuthenticated,
    setToken,
    setMasterPassword,
    setGistId,
    logout,
    loadFromStorage,
    saveTokenToStorage
  }
})
