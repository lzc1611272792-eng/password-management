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
    localStorage.removeItem('pm_master_password')
  }

  function loadFromStorage() {
    const savedToken = localStorage.getItem('pm_token')
    const savedGistId = localStorage.getItem('pm_gist_id')
    const savedPassword = localStorage.getItem('pm_master_password')
    if (savedToken) token.value = savedToken
    if (savedGistId) gistId.value = savedGistId
    if (savedPassword) masterPassword.value = savedPassword
  }

  function saveToStorage() {
    localStorage.setItem('pm_token', token.value)
    localStorage.setItem('pm_gist_id', gistId.value)
    localStorage.setItem('pm_master_password', masterPassword.value)
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
